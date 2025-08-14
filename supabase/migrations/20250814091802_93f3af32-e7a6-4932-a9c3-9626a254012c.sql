-- Drop all existing incorrect storage policies for brand-logos bucket
DROP POLICY IF EXISTS "Brand admins can upload their brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own brand logos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own brand logos" ON storage.objects;

-- Create unified and correct storage policies for brand-logos bucket
-- Policy for viewing brand logos (public access since bucket is public)
CREATE POLICY "Brand logos are publicly viewable" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'brand-logos');

-- Policy for uploading brand logos (users can only upload to their own brand folder)
CREATE POLICY "Users can upload to their brand folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'brand-logos' 
  AND EXISTS (
    SELECT 1 FROM public.brands 
    WHERE (brands.id)::text = (storage.foldername(objects.name))[1]
    AND brands.user_id = auth.uid()
  )
);

-- Policy for updating brand logos (users can only update files in their own brand folder)
CREATE POLICY "Users can update their brand logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'brand-logos' 
  AND EXISTS (
    SELECT 1 FROM public.brands 
    WHERE (brands.id)::text = (storage.foldername(objects.name))[1]
    AND brands.user_id = auth.uid()
  )
);

-- Policy for deleting brand logos (users can only delete files in their own brand folder)
CREATE POLICY "Users can delete their brand logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'brand-logos' 
  AND EXISTS (
    SELECT 1 FROM public.brands 
    WHERE (brands.id)::text = (storage.foldername(objects.name))[1]
    AND brands.user_id = auth.uid()
  )
);