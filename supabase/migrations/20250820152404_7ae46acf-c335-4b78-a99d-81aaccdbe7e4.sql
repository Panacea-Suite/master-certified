-- Publish Classic Certification template so it appears in brand view
UPDATE public.templates 
SET 
  status = 'published',
  updated_at = now()
WHERE name = 'Classic Certification' 
  AND kind = 'system';