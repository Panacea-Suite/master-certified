-- RPC function to start a flow session
CREATE OR REPLACE FUNCTION public.start_flow_session(
  p_qr_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  qr_record RECORD;
  session_id UUID;
  result JSONB;
BEGIN
  -- Get QR code and related data
  SELECT 
    qr.id,
    qr.batch_id,
    bt.campaign_id,
    c.brand_id,
    c.name as campaign_name,
    b.name as brand_name
  INTO qr_record
  FROM qr_codes qr
  JOIN batches bt ON bt.id = qr.batch_id
  JOIN campaigns c ON c.id = bt.campaign_id
  JOIN brands b ON b.id = c.brand_id
  WHERE qr.unique_code = p_qr_id::text OR qr.id = p_qr_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'invalid_qr',
      'message', 'QR code not found or disabled'
    );
  END IF;

  -- Create flow session
  INSERT INTO flow_sessions (
    qr_id,
    campaign_id,
    brand_id,
    status
  ) VALUES (
    qr_record.id,
    qr_record.campaign_id,
    qr_record.brand_id,
    'active'
  ) RETURNING id INTO session_id;

  result := jsonb_build_object(
    'success', true,
    'session_id', session_id,
    'qr_id', qr_record.id,
    'campaign_id', qr_record.campaign_id,
    'brand_id', qr_record.brand_id,
    'campaign_name', qr_record.campaign_name,
    'brand_name', qr_record.brand_name,
    'batch_id', qr_record.batch_id
  );

  RETURN result;
END;
$$;

-- RPC function to update store information
CREATE OR REPLACE FUNCTION public.update_flow_store(
  p_session_id UUID,
  p_store_meta JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE flow_sessions 
  SET 
    store_meta = p_store_meta,
    updated_at = now()
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'session_not_found'
    );
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC function to link user to flow session
CREATE OR REPLACE FUNCTION public.link_user_to_flow(
  p_session_id UUID,
  p_user_id UUID,
  p_marketing_opt_in BOOLEAN DEFAULT false,
  p_created_via auth_provider DEFAULT 'email'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_record RECORD;
  user_profile RECORD;
BEGIN
  -- Get session info
  SELECT * INTO session_record 
  FROM flow_sessions 
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'session_not_found'
    );
  END IF;

  -- Get user profile
  SELECT email, display_name INTO user_profile
  FROM profiles
  WHERE user_id = p_user_id;

  -- Update session with user
  UPDATE flow_sessions 
  SET 
    user_id = p_user_id,
    updated_at = now()
  WHERE id = p_session_id;

  -- Upsert brand_users relationship
  INSERT INTO brand_users (
    brand_id,
    user_id,
    source_campaign_id,
    marketing_opt_in,
    created_via,
    user_email,
    user_name,
    first_seen_at,
    last_seen_at
  ) VALUES (
    session_record.brand_id,
    p_user_id,
    session_record.campaign_id,
    p_marketing_opt_in,
    p_created_via,
    user_profile.email,
    user_profile.display_name,
    now(),
    now()
  )
  ON CONFLICT (brand_id, user_id) 
  DO UPDATE SET
    last_seen_at = now(),
    marketing_opt_in = EXCLUDED.marketing_opt_in,
    updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;

-- RPC function to run verification
CREATE OR REPLACE FUNCTION public.run_verification(
  p_session_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_record RECORD;
  batch_record RECORD;
  verification_id UUID;
  result_status verification_result;
  reasons TEXT[] := '{}';
  store_ok BOOLEAN := true;
  expiry_ok BOOLEAN := true;
  batch_info JSONB;
BEGIN
  -- Get session info
  SELECT 
    fs.*,
    qr.batch_id,
    c.approved_stores
  INTO session_record
  FROM flow_sessions fs
  JOIN qr_codes qr ON qr.id = fs.qr_id
  JOIN campaigns c ON c.id = fs.campaign_id
  WHERE fs.id = p_session_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'session_not_found'
    );
  END IF;

  -- Get batch info
  SELECT * INTO batch_record
  FROM batches
  WHERE id = session_record.batch_id;

  -- Build batch info
  batch_info := jsonb_build_object(
    'batch_id', batch_record.id,
    'name', batch_record.name,
    'status', batch_record.status,
    'generated_at', batch_record.generated_at
  );

  -- Check if QR code has been used before
  IF EXISTS (
    SELECT 1 FROM verifications 
    WHERE qr_id = session_record.qr_id 
    AND result IN ('pass', 'warn')
  ) THEN
    reasons := reasons || 'reused_qr';
  END IF;

  -- Check store alignment if configured
  IF session_record.store_meta->>'store_name' IS NOT NULL AND 
     array_length(session_record.approved_stores, 1) > 0 THEN
    IF NOT (session_record.store_meta->>'store_name' = ANY(session_record.approved_stores)) THEN
      store_ok := false;
      reasons := reasons || 'store_mismatch';
    END IF;
  END IF;

  -- Check batch status
  IF batch_record.status != 'generated' THEN
    expiry_ok := false;
    reasons := reasons || 'batch_inactive';
  END IF;

  -- Determine result
  IF array_length(reasons, 1) = 0 THEN
    result_status := 'pass';
  ELSIF 'batch_inactive' = ANY(reasons) OR 'invalid_qr' = ANY(reasons) THEN
    result_status := 'fail';
  ELSE
    result_status := 'warn';
  END IF;

  -- Create verification record
  INSERT INTO verifications (
    flow_session_id,
    qr_id,
    batch_id,
    result,
    reasons,
    store_ok,
    expiry_ok,
    batch_info
  ) VALUES (
    p_session_id,
    session_record.qr_id,
    session_record.batch_id,
    result_status,
    reasons,
    store_ok,
    expiry_ok,
    batch_info
  ) RETURNING id INTO verification_id;

  -- Update session status
  UPDATE flow_sessions 
  SET 
    status = CASE 
      WHEN result_status = 'fail' THEN 'failed'
      ELSE 'completed'
    END,
    updated_at = now()
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'verification_id', verification_id,
    'result', result_status,
    'reasons', reasons,
    'store_ok', store_ok,
    'expiry_ok', expiry_ok,
    'batch_info', batch_info
  );
END;
$$;

-- RPC function to get flow session data
CREATE OR REPLACE FUNCTION public.get_flow_session(
  p_session_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  session_data JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', fs.id,
    'status', fs.status,
    'store_meta', fs.store_meta,
    'user_id', fs.user_id,
    'campaign', jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'final_redirect_url', c.final_redirect_url
    ),
    'brand', jsonb_build_object(
      'id', b.id,
      'name', b.name,
      'logo_url', b.logo_url,
      'brand_colors', b.brand_colors
    ),
    'verification', (
      SELECT jsonb_build_object(
        'id', v.id,
        'result', v.result,
        'reasons', v.reasons,
        'batch_info', v.batch_info,
        'created_at', v.created_at
      )
      FROM verifications v
      WHERE v.flow_session_id = fs.id
      ORDER BY v.created_at DESC
      LIMIT 1
    )
  ) INTO session_data
  FROM flow_sessions fs
  JOIN campaigns c ON c.id = fs.campaign_id
  JOIN brands b ON b.id = fs.brand_id
  WHERE fs.id = p_session_id;

  IF session_data IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'session_not_found'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'data', session_data
  );
END;
$$;