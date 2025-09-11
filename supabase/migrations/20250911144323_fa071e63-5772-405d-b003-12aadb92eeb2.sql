-- Add archive functionality to campaigns, batches, and qr_codes tables

-- Add archive columns to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN is_archived boolean NOT NULL DEFAULT false,
ADD COLUMN archived_at timestamp with time zone NULL,
ADD COLUMN archived_by uuid NULL;

-- Add archive columns to batches table  
ALTER TABLE public.batches
ADD COLUMN is_archived boolean NOT NULL DEFAULT false,
ADD COLUMN archived_at timestamp with time zone NULL,
ADD COLUMN archived_by uuid NULL;

-- Add archive columns to qr_codes table
ALTER TABLE public.qr_codes
ADD COLUMN is_archived boolean NOT NULL DEFAULT false,
ADD COLUMN archived_at timestamp with time zone NULL,
ADD COLUMN archived_by uuid NULL;

-- Create function to archive records (soft delete)
CREATE OR REPLACE FUNCTION public.archive_record(
  p_table_name text,
  p_record_id uuid,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  query_text text;
  result jsonb;
BEGIN
  -- Validate table name to prevent SQL injection
  IF p_table_name NOT IN ('campaigns', 'batches', 'qr_codes') THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;
  
  -- Build and execute dynamic SQL
  query_text := format('
    UPDATE public.%I 
    SET 
      is_archived = true,
      archived_at = now(),
      archived_by = $1
    WHERE id = $2
    AND is_archived = false
  ', p_table_name);
  
  EXECUTE query_text USING p_user_id, p_record_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Record not found or already archived'
    );
  END IF;
  
  result := jsonb_build_object(
    'success', true,
    'table', p_table_name,
    'record_id', p_record_id,
    'archived_at', now()
  );
  
  RETURN result;
END;
$function$;

-- Create function to restore archived records
CREATE OR REPLACE FUNCTION public.restore_record(
  p_table_name text,
  p_record_id uuid,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  query_text text;
  result jsonb;
BEGIN
  -- Validate table name to prevent SQL injection
  IF p_table_name NOT IN ('campaigns', 'batches', 'qr_codes') THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;
  
  -- Build and execute dynamic SQL
  query_text := format('
    UPDATE public.%I 
    SET 
      is_archived = false,
      archived_at = NULL,
      archived_by = NULL
    WHERE id = $1
    AND is_archived = true
  ', p_table_name);
  
  EXECUTE query_text USING p_record_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Record not found or not archived'
    );
  END IF;
  
  result := jsonb_build_object(
    'success', true,
    'table', p_table_name,
    'record_id', p_record_id,
    'restored_at', now()
  );
  
  RETURN result;
END;
$function$;

-- Create function to permanently delete old archived records (30+ days)
CREATE OR REPLACE FUNCTION public.cleanup_old_archived_records()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cutoff_date timestamp with time zone;
  campaigns_deleted integer := 0;
  batches_deleted integer := 0;
  qr_codes_deleted integer := 0;
BEGIN
  cutoff_date := now() - interval '30 days';
  
  -- Delete old archived campaigns
  WITH deleted_campaigns AS (
    DELETE FROM public.campaigns 
    WHERE is_archived = true 
      AND archived_at < cutoff_date
    RETURNING id
  )
  SELECT count(*) INTO campaigns_deleted FROM deleted_campaigns;
  
  -- Delete old archived batches
  WITH deleted_batches AS (
    DELETE FROM public.batches 
    WHERE is_archived = true 
      AND archived_at < cutoff_date
    RETURNING id
  )
  SELECT count(*) INTO batches_deleted FROM deleted_batches;
  
  -- Delete old archived QR codes
  WITH deleted_qr_codes AS (
    DELETE FROM public.qr_codes 
    WHERE is_archived = true 
      AND archived_at < cutoff_date
    RETURNING id
  )
  SELECT count(*) INTO qr_codes_deleted FROM deleted_qr_codes;
  
  RETURN jsonb_build_object(
    'success', true,
    'cutoff_date', cutoff_date,
    'deleted_counts', jsonb_build_object(
      'campaigns', campaigns_deleted,
      'batches', batches_deleted,
      'qr_codes', qr_codes_deleted
    )
  );
END;
$function$;

-- Create function to get days until permanent deletion
CREATE OR REPLACE FUNCTION public.days_until_permanent_deletion(archived_at timestamp with time zone)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $function$
  SELECT GREATEST(0, 30 - EXTRACT(days FROM (now() - archived_at))::integer);
$function$;

-- Update RLS policies to exclude archived records by default for regular operations
-- We'll need to create separate views/queries for archive management

-- Create indexes for better performance
CREATE INDEX idx_campaigns_archived ON public.campaigns(is_archived, archived_at);
CREATE INDEX idx_batches_archived ON public.batches(is_archived, archived_at);
CREATE INDEX idx_qr_codes_archived ON public.qr_codes(is_archived, archived_at);