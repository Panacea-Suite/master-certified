-- Add test mode columns to support admin testing
ALTER TABLE flow_sessions 
ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS created_by_admin UUID REFERENCES auth.users(id);

ALTER TABLE brand_users 
ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE verifications 
ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;

-- Update start_flow_session function to support test mode
CREATE OR REPLACE FUNCTION public.start_flow_session(
  p_qr_id uuid DEFAULT NULL,
  p_campaign_id uuid DEFAULT NULL,
  p_is_test boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  qr_record RECORD;
  session_id UUID;
  result JSONB;
BEGIN
  -- If test mode, create a test session with provided campaign_id
  IF p_is_test AND p_campaign_id IS NOT NULL THEN
    -- Get campaign and related data
    SELECT 
      c.id as campaign_id,
      c.brand_id,
      c.name as campaign_name,
      b.name as brand_name
    INTO qr_record
    FROM campaigns c
    JOIN brands b ON b.id = c.brand_id
    WHERE c.id = p_campaign_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'invalid_campaign',
        'message', 'Campaign not found'
      );
    END IF;

    -- Create test flow session
    INSERT INTO flow_sessions (
      qr_id,
      campaign_id,
      brand_id,
      status,
      is_test,
      created_by_admin
    ) VALUES (
      NULL, -- No QR for test sessions
      qr_record.campaign_id,
      qr_record.brand_id,
      'active',
      true,
      auth.uid()
    ) RETURNING id INTO session_id;

    result := jsonb_build_object(
      'success', true,
      'session_id', session_id,
      'qr_id', NULL,
      'campaign_id', qr_record.campaign_id,
      'brand_id', qr_record.brand_id,
      'campaign_name', qr_record.campaign_name,
      'brand_name', qr_record.brand_name,
      'batch_id', NULL,
      'is_test', true
    );

    RETURN result;
  END IF;

  -- Original QR-based flow (existing logic)
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
    status,
    is_test,
    created_by_admin
  ) VALUES (
    qr_record.id,
    qr_record.campaign_id,
    qr_record.brand_id,
    'active',
    p_is_test,
    CASE WHEN p_is_test THEN auth.uid() ELSE NULL END
  ) RETURNING id INTO session_id;

  result := jsonb_build_object(
    'success', true,
    'session_id', session_id,
    'qr_id', qr_record.id,
    'campaign_id', qr_record.campaign_id,
    'brand_id', qr_record.brand_id,
    'campaign_name', qr_record.campaign_name,
    'brand_name', qr_record.brand_name,
    'batch_id', qr_record.batch_id,
    'is_test', p_is_test
  );

  RETURN result;
END;
$function$;

-- Update link_user_to_flow function to support test mode
CREATE OR REPLACE FUNCTION public.link_user_to_flow(
  p_session_id uuid, 
  p_user_id uuid, 
  p_marketing_opt_in boolean DEFAULT false, 
  p_created_via auth_provider DEFAULT 'email'::auth_provider,
  p_is_test boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  session_record RECORD;
  user_profile RECORD;
  final_is_test BOOLEAN;
BEGIN
  -- Get session info and determine if it's a test
  SELECT *, COALESCE(is_test, false) as session_is_test
  INTO session_record 
  FROM flow_sessions 
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'session_not_found'
    );
  END IF;

  -- Use session's test flag if not explicitly provided
  final_is_test := COALESCE(p_is_test, session_record.session_is_test, false);

  -- Get user profile
  SELECT email, display_name INTO user_profile
  FROM profiles
  WHERE user_id = p_user_id;

  -- Update session with user and test status
  UPDATE flow_sessions 
  SET 
    user_id = p_user_id,
    is_test = final_is_test,
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
    last_seen_at,
    is_test
  ) VALUES (
    session_record.brand_id,
    p_user_id,
    session_record.campaign_id,
    p_marketing_opt_in,
    p_created_via,
    user_profile.email,
    user_profile.display_name,
    now(),
    now(),
    final_is_test
  )
  ON CONFLICT (brand_id, user_id) 
  DO UPDATE SET
    last_seen_at = now(),
    marketing_opt_in = EXCLUDED.marketing_opt_in,
    is_test = EXCLUDED.is_test,
    updated_at = now();

  RETURN jsonb_build_object('success', true, 'is_test', final_is_test);
END;
$function$;

-- Update run_verification function to inherit test flag
CREATE OR REPLACE FUNCTION public.run_verification(p_session_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  session_record RECORD;
  batch_record RECORD;
  verification_id UUID;
  result_status verification_result;
  reasons TEXT[] := '{}';
  store_ok BOOLEAN := true;
  expiry_ok BOOLEAN := true;
  batch_info JSONB;
  session_is_test BOOLEAN := false;
BEGIN
  -- Get session info including test flag
  SELECT 
    fs.*,
    qr.batch_id,
    c.approved_stores,
    COALESCE(fs.is_test, false) as is_test_session
  INTO session_record
  FROM flow_sessions fs
  LEFT JOIN qr_codes qr ON qr.id = fs.qr_id
  LEFT JOIN campaigns c ON c.id = fs.campaign_id
  WHERE fs.id = p_session_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'session_not_found'
    );
  END IF;

  session_is_test := session_record.is_test_session;

  -- Get batch info if QR-based session
  IF session_record.batch_id IS NOT NULL THEN
    SELECT * INTO batch_record
    FROM batches
    WHERE id = session_record.batch_id;

    batch_info := jsonb_build_object(
      'batch_id', batch_record.id,
      'name', batch_record.name,
      'status', batch_record.status,
      'generated_at', batch_record.generated_at
    );

    -- Check batch status for real sessions
    IF NOT session_is_test AND batch_record.status != 'generated' THEN
      expiry_ok := false;
      reasons := reasons || 'batch_inactive';
    END IF;
  ELSE
    -- Test session without QR
    batch_info := jsonb_build_object('test_session', true);
  END IF;

  -- Check if QR code has been used before (skip for test sessions)
  IF NOT session_is_test AND session_record.qr_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM verifications 
    WHERE qr_id = session_record.qr_id 
    AND result IN ('pass', 'warn')
  ) THEN
    reasons := reasons || 'reused_qr';
  END IF;

  -- Check store alignment if configured (skip for test sessions or use lenient validation)
  IF NOT session_is_test AND session_record.store_meta->>'store_name' IS NOT NULL AND 
     array_length(session_record.approved_stores, 1) > 0 THEN
    IF NOT (session_record.store_meta->>'store_name' = ANY(session_record.approved_stores)) THEN
      store_ok := false;
      reasons := reasons || 'store_mismatch';
    END IF;
  END IF;

  -- Determine result (more lenient for test sessions)
  IF session_is_test THEN
    -- Test sessions always pass unless there are critical issues
    result_status := 'pass';
  ELSIF array_length(reasons, 1) = 0 THEN
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
    batch_info,
    is_test
  ) VALUES (
    p_session_id,
    session_record.qr_id,
    session_record.batch_id,
    result_status,
    reasons,
    store_ok,
    expiry_ok,
    batch_info,
    session_is_test
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
    'batch_info', batch_info,
    'is_test', session_is_test
  );
END;
$function$;