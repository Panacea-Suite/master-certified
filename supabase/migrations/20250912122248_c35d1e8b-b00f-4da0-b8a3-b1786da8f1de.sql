-- Add email_components column to email_templates table
ALTER TABLE public.email_templates 
ADD COLUMN email_components jsonb DEFAULT '[]'::jsonb;