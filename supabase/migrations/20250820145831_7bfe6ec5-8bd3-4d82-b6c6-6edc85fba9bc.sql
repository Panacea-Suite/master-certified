-- Core RPC functions for template management

-- Function to publish a system template (admin only)
CREATE OR REPLACE FUNCTION public.admin_publish_system_template(tpl_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  template_record RECORD;
  new_version INTEGER;
  result JSONB;
BEGIN
  -- Check if user is master_admin
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'master_admin') THEN
    RAISE EXCEPTION 'Access denied: only master admins can publish system templates';
  END IF;

  -- Get template and validate
  SELECT * INTO template_record FROM public.templates WHERE id = tpl_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found';
  END IF;
  
  IF template_record.kind != 'system' THEN
    RAISE EXCEPTION 'Only system templates can be published';
  END IF;
  
  IF template_record.status NOT IN ('draft', 'deprecated') THEN
    RAISE EXCEPTION 'Template must be in draft or deprecated status to publish';
  END IF;

  -- Get next version number
  SELECT COALESCE(MAX(version), 0) + 1 INTO new_version 
  FROM public.templates 
  WHERE id = tpl_id;

  -- Update template
  UPDATE public.templates 
  SET 
    status = 'published',
    version = new_version,
    updated_at = now()
  WHERE id = tpl_id;

  -- Log the action
  INSERT INTO public.audit_log (actor, action, object_type, object_id, meta)
  VALUES (
    auth.uid(),
    'publish_system_template',
    'template',
    tpl_id,
    jsonb_build_object('new_version', new_version, 'previous_status', template_record.status)
  );

  result := jsonb_build_object(
    'success', true,
    'template_id', tpl_id,
    'new_version', new_version,
    'status', 'published'
  );
  
  RETURN result;
END;
$$;

-- Function to fork a system template to brand template
CREATE OR REPLACE FUNCTION public.brand_fork_system_template(system_tpl_id UUID, target_brand_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  source_template RECORD;
  new_template_id UUID;
  result JSONB;
BEGIN
  -- Check if user owns the brand
  IF NOT EXISTS(SELECT 1 FROM public.brands WHERE id = target_brand_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: user does not own this brand';
  END IF;

  -- Get source template
  SELECT * INTO source_template FROM public.templates 
  WHERE id = system_tpl_id AND kind = 'system' AND status = 'published';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'System template not found or not published';
  END IF;

  -- Create new brand template
  INSERT INTO public.templates (
    kind,
    status,
    name,
    description,
    created_by,
    brand_id,
    base_template_id,
    schema,
    content
  ) VALUES (
    'brand',
    'draft',
    source_template.name || ' (Copy)',
    source_template.description,
    auth.uid(),
    target_brand_id,
    system_tpl_id,
    source_template.schema,
    source_template.content
  ) RETURNING id INTO new_template_id;

  -- Log the action
  INSERT INTO public.audit_log (actor, action, object_type, object_id, meta)
  VALUES (
    auth.uid(),
    'fork_system_template',
    'template',
    new_template_id,
    jsonb_build_object(
      'source_template_id', system_tpl_id,
      'brand_id', target_brand_id
    )
  );

  result := jsonb_build_object(
    'success', true,
    'new_template_id', new_template_id,
    'source_template_id', system_tpl_id
  );
  
  RETURN result;
END;
$$;

-- Function to create campaign from template
CREATE OR REPLACE FUNCTION public.create_campaign_from_template(
  p_brand_id UUID,
  p_template_id UUID,
  p_campaign_name TEXT,
  p_template_version INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  template_record RECORD;
  campaign_id UUID;
  flow_id UUID;
  base_url TEXT;
  resolved_version INTEGER;
  result JSONB;
BEGIN
  -- Check if user owns the brand
  IF NOT EXISTS(SELECT 1 FROM public.brands WHERE id = p_brand_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied: user does not own this brand';
  END IF;

  -- Get template and resolve version
  IF p_template_version IS NULL THEN
    -- Get latest published version for system templates, or latest for brand templates
    SELECT * INTO template_record FROM public.templates 
    WHERE id = p_template_id 
      AND (
        (kind = 'system' AND status = 'published') OR 
        (kind = 'brand' AND brand_id = p_brand_id)
      )
    ORDER BY version DESC 
    LIMIT 1;
  ELSE
    SELECT * INTO template_record FROM public.templates 
    WHERE id = p_template_id AND version = p_template_version;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found or not accessible';
  END IF;

  resolved_version := template_record.version;

  -- Create campaign
  INSERT INTO campaigns (
    name,
    description,
    brand_id,
    template_id,
    template_version,
    locked_template,
    approved_stores
  ) VALUES (
    p_campaign_name,
    'Campaign created from template: ' || template_record.name,
    p_brand_id,
    p_template_id,
    resolved_version,
    jsonb_build_object(
      'schema', template_record.schema,
      'content', template_record.content,
      'template_name', template_record.name,
      'locked_at', now()
    ),
    ARRAY['Store A', 'Store B', 'Store C']
  ) RETURNING id INTO campaign_id;

  -- Generate base URL
  base_url := 'https://app.example.com/flow/' || campaign_id::text;

  -- Create flow from locked template
  INSERT INTO flows (
    name,
    campaign_id,
    base_url,
    flow_config,
    created_by
  ) VALUES (
    p_campaign_name || ' Flow',
    campaign_id,
    base_url,
    template_record.content,
    auth.uid()
  ) RETURNING id INTO flow_id;

  -- Log the action
  INSERT INTO public.audit_log (actor, action, object_type, object_id, meta)
  VALUES (
    auth.uid(),
    'create_campaign_from_template',
    'campaign',
    campaign_id,
    jsonb_build_object(
      'template_id', p_template_id,
      'template_version', resolved_version,
      'brand_id', p_brand_id,
      'flow_id', flow_id
    )
  );

  result := jsonb_build_object(
    'success', true,
    'campaign_id', campaign_id,
    'flow_id', flow_id,
    'template_version', resolved_version,
    'base_url', base_url
  );
  
  RETURN result;
END;
$$;

-- Function for admin to get all brands (for management)
CREATE OR REPLACE FUNCTION public.admin_get_all_brands()
RETURNS TABLE(
  id UUID,
  name TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_email TEXT,
  user_display_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is master_admin
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'master_admin') THEN
    RAISE EXCEPTION 'Access denied: only master admins can view all brands';
  END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.user_id,
    b.created_at,
    b.updated_at,
    p.email,
    p.display_name
  FROM public.brands b
  JOIN public.profiles p ON p.user_id = b.user_id
  ORDER BY b.created_at DESC;
END;
$$;