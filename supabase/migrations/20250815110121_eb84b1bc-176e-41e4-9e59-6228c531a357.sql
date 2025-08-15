-- Phase 1: Database Structure Fixes (Fixed)

-- Create atomic flow creation function
CREATE OR REPLACE FUNCTION public.create_flow_with_campaign(
  p_flow_name text,
  p_brand_id uuid,
  p_flow_config jsonb DEFAULT '{}',
  p_campaign_name text DEFAULT NULL
)
RETURNS TABLE(
  flow_id uuid,
  campaign_id uuid,
  flow_name text,
  base_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_campaign_id uuid;
  v_flow_id uuid;
  v_base_url text;
  v_user_id uuid;
BEGIN
  -- Get current user ID
  SELECT auth.uid() INTO v_user_id;
  
  -- Verify user owns the brand
  IF NOT EXISTS (
    SELECT 1 FROM brands 
    WHERE id = p_brand_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'User does not own this brand';
  END IF;

  -- Create campaign
  INSERT INTO campaigns (
    name,
    description,
    brand_id,
    approved_stores
  ) VALUES (
    COALESCE(p_campaign_name, p_flow_name || ' Campaign'),
    'Auto-generated campaign for ' || p_flow_name,
    p_brand_id,
    ARRAY['Store A', 'Store B', 'Store C']
  )
  RETURNING id INTO v_campaign_id;

  -- Generate base URL
  v_base_url := 'https://app.example.com/flow/' || v_campaign_id::text;

  -- Create flow
  INSERT INTO flows (
    name,
    campaign_id,
    base_url,
    flow_config,
    created_by
  ) VALUES (
    p_flow_name,
    v_campaign_id,
    v_base_url,
    p_flow_config,
    v_user_id
  )
  RETURNING id INTO v_flow_id;

  -- Return the created flow and campaign info
  RETURN QUERY SELECT 
    v_flow_id as flow_id,
    v_campaign_id as campaign_id,
    p_flow_name as flow_name,
    v_base_url as base_url;
END;
$$;

-- Create function to get user flows with proper joins
CREATE OR REPLACE FUNCTION public.get_user_flows(p_user_id uuid DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  name text,
  campaign_id uuid,
  flow_config jsonb,
  base_url text,
  created_at timestamptz,
  updated_at timestamptz,
  template_category text,
  created_by uuid,
  is_template boolean,
  campaign_name text,
  brand_name text,
  brand_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Use provided user_id or get current user
  SELECT COALESCE(p_user_id, auth.uid()) INTO v_user_id;
  
  RETURN QUERY
  SELECT 
    f.id,
    f.name,
    f.campaign_id,
    f.flow_config,
    f.base_url,
    f.created_at,
    f.updated_at,
    f.template_category,
    f.created_by,
    f.is_template,
    c.name as campaign_name,
    b.name as brand_name,
    b.id as brand_id
  FROM flows f
  JOIN campaigns c ON c.id = f.campaign_id
  JOIN brands b ON b.id = c.brand_id
  WHERE b.user_id = v_user_id
  ORDER BY f.created_at DESC;
END;
$$;

-- Add better indexes for performance
CREATE INDEX IF NOT EXISTS idx_flows_campaign_id ON flows(campaign_id);
CREATE INDEX IF NOT EXISTS idx_flows_created_by ON flows(created_by);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand_id ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON brands(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_flow_id ON qr_codes(flow_id);
CREATE INDEX IF NOT EXISTS idx_flow_content_flow_id ON flow_content(flow_id);

-- Add validation constraints
ALTER TABLE flows ADD CONSTRAINT IF NOT EXISTS flows_name_not_empty CHECK (length(trim(name)) > 0);
ALTER TABLE campaigns ADD CONSTRAINT IF NOT EXISTS campaigns_name_not_empty CHECK (length(trim(name)) > 0);
ALTER TABLE brands ADD CONSTRAINT IF NOT EXISTS brands_name_not_empty CHECK (length(trim(name)) > 0);

-- Update RLS policies to be more secure and granular
DROP POLICY IF EXISTS "Public access to flows for customer experience" ON flows;
DROP POLICY IF EXISTS "Public access to campaigns for customer experience" ON campaigns;
DROP POLICY IF EXISTS "Public access to flow content for customer experience" ON flow_content;

-- Create more granular public access policies
CREATE POLICY "Public read access for customer flows via QR codes" 
ON flows 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM qr_codes qr 
    WHERE qr.flow_id = flows.id
  )
);

CREATE POLICY "Public read access for customer campaigns via QR codes" 
ON campaigns 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM flows f
    JOIN qr_codes qr ON qr.flow_id = f.id
    WHERE f.campaign_id = campaigns.id
  )
);

CREATE POLICY "Public read access for customer flow content via QR codes" 
ON flow_content 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM qr_codes qr 
    WHERE qr.flow_id = flow_content.flow_id
  )
);

-- Add audit logging table
CREATE TABLE IF NOT EXISTS flow_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid REFERENCES flows(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE flow_audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log policies
CREATE POLICY "Users can view their own audit logs" 
ON flow_audit_log 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM flows f
    JOIN campaigns c ON c.id = f.campaign_id
    JOIN brands b ON b.id = c.brand_id
    WHERE f.id = flow_audit_log.flow_id AND b.user_id = auth.uid()
  )
);

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_flow_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO flow_audit_log (flow_id, user_id, action, new_data)
    VALUES (NEW.id, auth.uid(), 'CREATE', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO flow_audit_log (flow_id, user_id, action, old_data, new_data)
    VALUES (NEW.id, auth.uid(), 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO flow_audit_log (flow_id, user_id, action, old_data)
    VALUES (OLD.id, auth.uid(), 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers
DROP TRIGGER IF EXISTS audit_flows_trigger ON flows;
CREATE TRIGGER audit_flows_trigger
  AFTER INSERT OR UPDATE OR DELETE ON flows
  FOR EACH ROW EXECUTE FUNCTION audit_flow_changes();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_flow_with_campaign TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_flows TO authenticated;