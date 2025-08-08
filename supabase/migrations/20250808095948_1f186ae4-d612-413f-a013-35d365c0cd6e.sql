-- Add store management for campaigns
ALTER TABLE campaigns ADD COLUMN approved_stores TEXT[] DEFAULT '{}';
ALTER TABLE campaigns ADD COLUMN flow_settings JSONB DEFAULT '{}';

-- Add content management for flows
CREATE TABLE flow_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flow_id UUID NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('testing_document', 'product_info', 'logistics_info')),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  file_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on flow_content
ALTER TABLE flow_content ENABLE ROW LEVEL SECURITY;

-- RLS policies for flow_content
CREATE POLICY "Users can view content for their flows"
ON flow_content FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM flows f
    JOIN campaigns c ON c.id = f.campaign_id
    JOIN brands b ON b.id = c.brand_id
    WHERE f.id = flow_content.flow_id AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create content for their flows"
ON flow_content FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM flows f
    JOIN campaigns c ON c.id = f.campaign_id
    JOIN brands b ON b.id = c.brand_id
    WHERE f.id = flow_content.flow_id AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update content for their flows"
ON flow_content FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM flows f
    JOIN campaigns c ON c.id = f.campaign_id
    JOIN brands b ON b.id = c.brand_id
    WHERE f.id = flow_content.flow_id AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete content for their flows"
ON flow_content FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM flows f
    JOIN campaigns c ON c.id = f.campaign_id
    JOIN brands b ON b.id = c.brand_id
    WHERE f.id = flow_content.flow_id AND b.user_id = auth.uid()
  )
);

-- Create storage bucket for flow content
INSERT INTO storage.buckets (id, name, public) VALUES ('flow-content', 'flow-content', false);

-- Storage policies for flow content
CREATE POLICY "Users can view flow content files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'flow-content' AND
  EXISTS (
    SELECT 1 FROM flow_content fc
    JOIN flows f ON f.id = fc.flow_id
    JOIN campaigns c ON c.id = f.campaign_id
    JOIN brands b ON b.id = c.brand_id
    WHERE fc.file_url = storage.objects.name AND b.user_id = auth.uid()
  )
);

CREATE POLICY "Users can upload flow content files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'flow-content');

CREATE POLICY "Users can update flow content files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'flow-content');

CREATE POLICY "Users can delete flow content files"
ON storage.objects FOR DELETE
USING (bucket_id = 'flow-content');

-- Update flow_config structure for new flow stages
UPDATE flows SET flow_config = jsonb_build_object(
  'stages', jsonb_build_array(
    jsonb_build_object('type', 'landing', 'title', 'Welcome to Certified', 'description', 'Verify your product authenticity'),
    jsonb_build_object('type', 'store_location', 'title', 'Store Location', 'description', 'Where did you purchase this product?'),
    jsonb_build_object('type', 'account_creation', 'title', 'Create Account', 'description', 'Optional: Create an account for full access', 'optional', true),
    jsonb_build_object('type', 'authentication', 'title', 'Verification', 'description', 'Checking product authenticity...'),
    jsonb_build_object('type', 'content', 'title', 'Product Information', 'description', 'Access detailed product information')
  )
) WHERE flow_config IS NULL OR NOT flow_config ? 'stages';