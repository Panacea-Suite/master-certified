-- Enable extensions
CREATE EXTENSION IF NOT EXISTS moddatetime;

-- Create enums for templates
CREATE TYPE template_kind AS ENUM ('system','brand');
CREATE TYPE template_status AS ENUM ('draft','published','deprecated');

-- Update handle_new_user function with email-based role assignment
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, role, first_name, last_name, company_name, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    CASE 
      WHEN NEW.email ILIKE ANY (ARRAY['%@panacea.ai','%@forzaindustries.com']) THEN 'master_admin'::user_role
      ELSE 'brand_admin'::user_role 
    END,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_name', ''),
    COALESCE(
      CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name'),
      split_part(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create templates table
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind template_kind NOT NULL,
  status template_status NOT NULL DEFAULT 'draft',
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_by UUID NOT NULL,
  brand_id UUID NULL REFERENCES public.brands(id),
  base_template_id UUID NULL REFERENCES public.templates(id),
  version INTEGER NOT NULL DEFAULT 1,
  schema JSONB NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for templates
CREATE UNIQUE INDEX ON public.templates (id, version);
CREATE INDEX ON public.templates (kind, status);
CREATE INDEX ON public.templates (brand_id);
CREATE INDEX ON public.templates (created_by);

-- Add updated_at trigger for templates
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update campaigns table to reference templates
ALTER TABLE public.campaigns 
  ADD COLUMN template_id UUID REFERENCES public.templates(id),
  ADD COLUMN template_version INTEGER,
  ADD COLUMN locked_template JSONB;

-- Create audit log table
CREATE TABLE public.audit_log (
  id BIGSERIAL PRIMARY KEY,
  at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor UUID NOT NULL,
  action TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id UUID NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Enable RLS on templates
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Templates RLS policies
-- System templates: everyone can SELECT published
CREATE POLICY tpl_select_system_published
ON public.templates FOR SELECT
USING (kind='system' AND status='published');

-- Brand: can select own brand templates
CREATE POLICY tpl_select_brand_own
ON public.templates FOR SELECT
USING (kind='brand' AND brand_id IN (
  SELECT id FROM public.brands WHERE user_id = auth.uid()
));

-- Admin: full select
CREATE POLICY tpl_select_admin
ON public.templates FOR SELECT
USING (EXISTS(SELECT 1 FROM public.profiles p WHERE p.user_id=auth.uid() AND p.role='master_admin'));

-- System template inserts (admin only)
CREATE POLICY tpl_insert_system_admin
ON public.templates FOR INSERT
WITH CHECK (
  kind='system' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.user_id=auth.uid() AND p.role='master_admin')
);

-- Brand template inserts
CREATE POLICY tpl_insert_brand_owner
ON public.templates FOR INSERT
WITH CHECK (
  kind='brand' AND brand_id IN (SELECT id FROM public.brands WHERE user_id=auth.uid())
);

-- System template updates (admin only)
CREATE POLICY tpl_update_system_admin
ON public.templates FOR UPDATE
USING (kind='system' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.user_id=auth.uid() AND p.role='master_admin'))
WITH CHECK (kind='system');

-- Brand template updates
CREATE POLICY tpl_update_brand_owner
ON public.templates FOR UPDATE
USING (kind='brand' AND brand_id IN (SELECT id FROM public.brands WHERE user_id=auth.uid()))
WITH CHECK (kind='brand');

-- Delete policies
CREATE POLICY tpl_delete_system_admin
ON public.templates FOR DELETE
USING (kind='system' AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.user_id=auth.uid() AND p.role='master_admin'));

CREATE POLICY tpl_delete_brand_owner
ON public.templates FOR DELETE
USING (kind='brand' AND brand_id IN (SELECT id FROM public.brands WHERE user_id=auth.uid()));

-- Enable RLS on audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log policies (admin can see all, users can see their own actions)
CREATE POLICY audit_select_admin
ON public.audit_log FOR SELECT
USING (EXISTS(SELECT 1 FROM public.profiles p WHERE p.user_id=auth.uid() AND p.role='master_admin'));

CREATE POLICY audit_select_own
ON public.audit_log FOR SELECT
USING (actor = auth.uid());

CREATE POLICY audit_insert_authenticated
ON public.audit_log FOR INSERT
WITH CHECK (actor = auth.uid());