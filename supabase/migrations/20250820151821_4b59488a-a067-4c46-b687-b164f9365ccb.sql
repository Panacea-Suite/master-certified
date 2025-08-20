-- Update Classic Certification template status from deprecated to draft
UPDATE public.templates 
SET 
  status = 'draft',
  updated_at = now()
WHERE name = 'Classic Certification' 
  AND kind = 'system';