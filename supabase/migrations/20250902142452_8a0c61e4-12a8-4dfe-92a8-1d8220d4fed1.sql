-- Add constraints to enforce template/campaign flow separation
ALTER TABLE flows ADD CONSTRAINT flows_template_campaign_separation 
CHECK (
  (is_template = true AND campaign_id IS NULL) OR 
  (is_template = false AND campaign_id IS NOT NULL) OR
  (is_template IS NULL AND campaign_id IS NOT NULL)
);

-- Add a database function to clone templates into campaign flows
CREATE OR REPLACE FUNCTION public.apply_flow_template_to_campaign(
  p_template_id uuid,
  p_campaign_id uuid,
  p_flow_name text,
  p_created_by uuid DEFAULT auth.uid()
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  template_record RECORD;
  new_flow_id UUID;
  result JSONB;
BEGIN
  -- Verify user owns the campaign's brand
  IF NOT EXISTS(
    SELECT 1 FROM campaigns c
    JOIN brands b ON b.id = c.brand_id
    WHERE c.id = p_campaign_id AND b.user_id = p_created_by
  ) THEN
    RAISE EXCEPTION 'Access denied: user does not own this campaign';
  END IF;

  -- Get template data (from either flows or templates table)
  SELECT * INTO template_record FROM flows 
  WHERE id = p_template_id AND is_template = true;
  
  IF NOT FOUND THEN
    -- Try templates table as fallback
    SELECT 
      id,
      name,
      content as flow_config,
      null::text as template_category,
      created_by,
      null::timestamp as created_at,
      null::timestamp as updated_at
    INTO template_record 
    FROM templates 
    WHERE id = p_template_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Template not found';
    END IF;
  END IF;

  -- Create campaign flow by cloning template
  INSERT INTO flows (
    name,
    campaign_id,
    flow_config,
    is_template,
    template_category,
    created_by,
    base_url
  ) VALUES (
    p_flow_name,
    p_campaign_id,
    template_record.flow_config,
    false,
    template_record.template_category,
    p_created_by,
    'https://app.example.com/flow/' || p_campaign_id::text
  ) RETURNING id INTO new_flow_id;

  result := jsonb_build_object(
    'success', true,
    'flow_id', new_flow_id,
    'campaign_id', p_campaign_id,
    'template_id', p_template_id
  );

  RETURN result;
END;
$function$;