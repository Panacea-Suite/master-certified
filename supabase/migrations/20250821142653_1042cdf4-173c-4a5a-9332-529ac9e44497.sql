-- Ensure the pgcrypto extension is available in the expected schema
create extension if not exists pgcrypto with schema extensions;

-- Optional helper: generate a hex token using the extensions schema
create or replace function public.gen_hex_token(p_bytes int default 16)
returns text
language sql
stable
as $$
  select encode(extensions.gen_random_bytes(p_bytes), 'hex');
$$;

-- Optional helper: UUID without dashes using the extensions schema
create or replace function public.gen_compact_uuid()
returns text
language sql
stable
as $$
  select replace(extensions.gen_random_uuid()::text, '-', '');
$$;

-- Recreate the affected RPC with fully qualified extension calls
create or replace function public.create_ephemeral_campaign_from_template(p_template_id uuid, p_created_by uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
DECLARE
  template_record RECORD;
  admin_brand_id UUID;
  campaign_id UUID;
  batch_id UUID;
  qr_id UUID;
  unique_code TEXT;
  result JSONB;
BEGIN
  -- Check if user is master_admin
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = p_created_by AND role = 'master_admin') THEN
    RAISE EXCEPTION 'Access denied: only master admins can create ephemeral campaigns';
  END IF;

  -- Get template and validate
  SELECT * INTO template_record FROM public.templates WHERE id = p_template_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Template not found';
  END IF;
  
  -- For system templates, use published version if available, otherwise latest
  IF template_record.kind = 'system' THEN
    SELECT * INTO template_record FROM public.templates 
    WHERE id = p_template_id 
    ORDER BY 
      CASE WHEN status = 'published' THEN 1 ELSE 2 END,
      version DESC 
    LIMIT 1;
  END IF;

  -- Get or create a sandbox brand for the admin
  SELECT id INTO admin_brand_id FROM public.brands 
  WHERE user_id = p_created_by AND name = 'Test Sandbox Brand'
  LIMIT 1;
  
  IF admin_brand_id IS NULL THEN
    INSERT INTO public.brands (user_id, name, approved_stores)
    VALUES (p_created_by, 'Test Sandbox Brand', ARRAY['Test Store A', 'Test Store B'])
    RETURNING id INTO admin_brand_id;
  END IF;

  -- Create ephemeral campaign
  INSERT INTO campaigns (
    name,
    description,
    brand_id,
    template_id,
    template_version,
    locked_template,
    approved_stores,
    is_test
  ) VALUES (
    '_Test / ' || template_record.name || ' / ' || now()::text,
    'Ephemeral test campaign for template: ' || template_record.name,
    admin_brand_id,
    p_template_id,
    template_record.version,
    jsonb_build_object(
      'schema', template_record.schema,
      'content', template_record.content,
      'template_name', template_record.name,
      'locked_at', now()
    ),
    ARRAY['Test Store A', 'Test Store B', 'Test Store C'],
    true
  ) RETURNING id INTO campaign_id;

  -- Create a test batch
  INSERT INTO batches (
    campaign_id,
    name,
    status,
    qr_code_count,
    generated_at,
    is_test
  ) VALUES (
    campaign_id,
    '_Test Batch',
    'generated',
    1,
    now(),
    true
  ) RETURNING id INTO batch_id;

  -- Generate unique code for QR (fully-qualified via extensions schema)
  unique_code := 'test_' || public.gen_hex_token(8);
  -- Alternatively: 'test_' || encode(extensions.gen_random_bytes(8), 'hex');

  -- Create a test QR code
  INSERT INTO qr_codes (
    batch_id,
    unique_code,
    qr_url,
    is_test
  ) VALUES (
    batch_id,
    unique_code,
    'https://test-qr.example.com/' || unique_code,
    true
  ) RETURNING id INTO qr_id;

  -- Log the action
  INSERT INTO public.audit_log (actor, action, object_type, object_id, meta)
  VALUES (
    p_created_by,
    'create_ephemeral_campaign',
    'campaign',
    campaign_id,
    jsonb_build_object(
      'template_id', p_template_id,
      'template_version', template_record.version,
      'is_test', true
    )
  );

  result := jsonb_build_object(
    'success', true,
    'campaign_id', campaign_id,
    'qr_id', qr_id,
    'batch_id', batch_id,
    'template_version', template_record.version
  );
  
  RETURN result;
END;
$function$;

-- Ensure appropriate grants for RPC execution
grant execute on function public.create_ephemeral_campaign_from_template(uuid, uuid) to authenticated, service_role;

-- Also grant execute for helpers (optional but safe)
grant execute on function public.gen_hex_token(int) to public;
grant execute on function public.gen_compact_uuid() to public;
