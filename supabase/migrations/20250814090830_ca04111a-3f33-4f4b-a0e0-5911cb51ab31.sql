-- Fix the storage policy for brand logos to properly handle file paths
DROP POLICY IF EXISTS "Brand admins can upload their brand logos" ON storage.objects;

-- Create corrected policy that checks the brand ID from the file path
CREATE POLICY "Brand admins can upload their brand logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'brand-logos' 
  AND auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role IN ('brand_admin', 'master_admin')
  )
  AND EXISTS (
    SELECT 1 FROM public.brands 
    WHERE brands.id::text = (storage.foldername(name))[1]
    AND brands.user_id = auth.uid()
  )
);

-- Also fix the SELECT policy for consistency
DROP POLICY IF EXISTS "Brand logos are viewable by brand admins" ON storage.objects;

CREATE POLICY "Brand logos are viewable by brand admins" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'brand-logos' 
  AND (
    -- Public bucket, so allow all reads
    bucket_id = 'brand-logos'
    OR 
    -- Or if user owns the brand
    EXISTS (
      SELECT 1 FROM public.brands 
      WHERE brands.id::text = (storage.foldername(name))[1]
      AND brands.user_id = auth.uid()
    )
  )
);

-- Add UPDATE policy for existing files
CREATE POLICY "Brand admins can update their brand logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'brand-logos' 
  AND auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role IN ('brand_admin', 'master_admin')
  )
  AND EXISTS (
    SELECT 1 FROM public.brands 
    WHERE brands.id::text = (storage.foldername(name))[1]
    AND brands.user_id = auth.uid()
  )
);

-- Add DELETE policy for brand logos
CREATE POLICY "Brand admins can delete their brand logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'brand-logos' 
  AND auth.uid() IN (
    SELECT user_id FROM public.profiles WHERE role IN ('brand_admin', 'master_admin')
  )
  AND EXISTS (
    SELECT 1 FROM public.brands 
    WHERE brands.id::text = (storage.foldername(name))[1]
    AND brands.user_id = auth.uid()
  )
);