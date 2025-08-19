-- Make flow-content bucket public for image access
UPDATE storage.buckets 
SET public = true 
WHERE name = 'flow-content';

-- Create policy to allow public read access to flow-content
CREATE POLICY "Public read access for flow content" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'flow-content');

-- Allow authenticated users to upload flow content
CREATE POLICY "Authenticated users can upload flow content" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'flow-content' AND auth.role() = 'authenticated');