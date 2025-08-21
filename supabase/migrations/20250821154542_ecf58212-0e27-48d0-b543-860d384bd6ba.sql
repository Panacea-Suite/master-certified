-- Add publish fields to flows table
ALTER TABLE flows 
ADD COLUMN latest_published_version INTEGER DEFAULT 1,
ADD COLUMN published_snapshot JSONB DEFAULT NULL;

-- Add locked template fields to campaigns table  
ALTER TABLE campaigns
ADD COLUMN locked_design_tokens JSONB DEFAULT NULL;

-- Create flow_content_versions table for versioned content
CREATE TABLE flow_content_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  file_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on flow_content_versions
ALTER TABLE flow_content_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for flow_content_versions
CREATE POLICY "Users can create versioned content for their flows"
ON flow_content_versions
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM flows f
  JOIN campaigns c ON c.id = f.campaign_id
  JOIN brands b ON b.id = c.brand_id
  WHERE f.id = flow_content_versions.flow_id AND b.user_id = auth.uid()
));

CREATE POLICY "Users can view versioned content for their flows"
ON flow_content_versions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM flows f
  JOIN campaigns c ON c.id = f.campaign_id
  JOIN brands b ON b.id = c.brand_id
  WHERE f.id = flow_content_versions.flow_id AND b.user_id = auth.uid()
));

CREATE POLICY "Public access to versioned flow content for customer experience"
ON flow_content_versions
FOR SELECT
USING (true);

CREATE POLICY "Users can update versioned content for their flows"
ON flow_content_versions
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM flows f
  JOIN campaigns c ON c.id = f.campaign_id
  JOIN brands b ON b.id = c.brand_id
  WHERE f.id = flow_content_versions.flow_id AND b.user_id = auth.uid()
));

CREATE POLICY "Users can delete versioned content for their flows"
ON flow_content_versions
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM flows f
  JOIN campaigns c ON c.id = f.campaign_id
  JOIN brands b ON b.id = c.brand_id
  WHERE f.id = flow_content_versions.flow_id AND b.user_id = auth.uid()
));

-- Create function to publish flow version
CREATE OR REPLACE FUNCTION publish_flow_version(
  p_flow_id UUID,
  p_flow_snapshot JSONB,
  p_design_tokens JSONB DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  flow_record RECORD;
  new_version INTEGER;
  result JSONB;
BEGIN
  -- Get flow and verify ownership
  SELECT f.*, c.brand_id, b.user_id
  INTO flow_record
  FROM flows f
  JOIN campaigns c ON c.id = f.campaign_id
  JOIN brands b ON b.id = c.brand_id
  WHERE f.id = p_flow_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Flow not found';
  END IF;

  IF flow_record.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: user does not own this flow';
  END IF;

  -- Get next version number
  SELECT COALESCE(MAX(latest_published_version), 0) + 1 
  INTO new_version 
  FROM flows 
  WHERE id = p_flow_id;

  -- Update flow with published snapshot
  UPDATE flows 
  SET 
    latest_published_version = new_version,
    published_snapshot = p_flow_snapshot,
    updated_at = now()
  WHERE id = p_flow_id;

  -- Update campaign with locked tokens
  UPDATE campaigns
  SET
    locked_design_tokens = p_design_tokens,
    updated_at = now()
  WHERE id = flow_record.campaign_id;

  -- Create content versions from snapshot pages
  IF p_flow_snapshot ? 'pages' THEN
    INSERT INTO flow_content_versions (flow_id, version, title, content_type, content, order_index)
    SELECT 
      p_flow_id,
      new_version,
      page->>'name',
      'page',
      page,
      (page->>'order')::integer
    FROM jsonb_array_elements(p_flow_snapshot->'pages') as page;
  END IF;

  result := jsonb_build_object(
    'success', true,
    'flow_id', p_flow_id,
    'new_version', new_version,
    'campaign_id', flow_record.campaign_id
  );

  RETURN result;
END;
$$;