-- Phase 1: Database Structure Fixes (Simplified)

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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_flow_with_campaign TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_flows TO authenticated;