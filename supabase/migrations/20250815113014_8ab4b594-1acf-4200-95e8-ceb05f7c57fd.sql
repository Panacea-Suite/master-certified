-- Add template-specific fields to flows table
ALTER TABLE public.flows 
ADD COLUMN IF NOT EXISTS is_system_template boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS template_description text,
ADD COLUMN IF NOT EXISTS template_preview_image text,
ADD COLUMN IF NOT EXISTS template_tags text[];

-- Update RLS policies to allow public access to system templates
CREATE POLICY "Public access to system templates" 
ON public.flows 
FOR SELECT 
USING (is_system_template = true);

-- Create index for better performance when filtering templates
CREATE INDEX IF NOT EXISTS idx_flows_is_template ON public.flows(is_template);
CREATE INDEX IF NOT EXISTS idx_flows_is_system_template ON public.flows(is_system_template);

-- Add some example system templates from existing data
UPDATE public.flows 
SET is_system_template = true, 
    template_description = 'A classic certification flow template with welcome, store selection, and thank you pages'
WHERE name LIKE '%Classic%' OR name LIKE '%Certification%';