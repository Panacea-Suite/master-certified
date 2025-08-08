-- Create storage bucket for brand logos
INSERT INTO storage.buckets (id, name, public) VALUES ('brand-logos', 'brand-logos', true);

-- Create RLS policies for brand logo uploads
CREATE POLICY "Users can view brand logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'brand-logos');

CREATE POLICY "Users can upload their own brand logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'brand-logos' 
  AND EXISTS (
    SELECT 1 FROM public.brands 
    WHERE brands.id::text = (storage.foldername(name))[1] 
    AND brands.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own brand logos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'brand-logos' 
  AND EXISTS (
    SELECT 1 FROM public.brands 
    WHERE brands.id::text = (storage.foldername(name))[1] 
    AND brands.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own brand logos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'brand-logos' 
  AND EXISTS (
    SELECT 1 FROM public.brands 
    WHERE brands.id::text = (storage.foldername(name))[1] 
    AND brands.user_id = auth.uid()
  )
);