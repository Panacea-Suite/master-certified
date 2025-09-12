-- Create email_templates table for storing customizable email templates
CREATE TABLE public.email_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_type TEXT NOT NULL, -- 'signup', 'login', 'recovery', 'email_change'
  subject TEXT NOT NULL,
  preview_text TEXT,
  heading TEXT NOT NULL,
  message TEXT NOT NULL,
  button_text TEXT NOT NULL,
  footer_text TEXT,
  from_name TEXT DEFAULT 'Panacea Certified',
  from_email TEXT DEFAULT 'noreply@certified.panaceasuite.io',
  reply_to_email TEXT DEFAULT 'support@panaceasuite.io',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  
  CONSTRAINT email_templates_template_type_unique UNIQUE (template_type, is_active)
);

-- Enable RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Only master admins can manage email templates
CREATE POLICY "Master admins can view all email templates" 
ON public.email_templates 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'master_admin'
  )
);

CREATE POLICY "Master admins can create email templates" 
ON public.email_templates 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'master_admin'
  )
);

CREATE POLICY "Master admins can update email templates" 
ON public.email_templates 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'master_admin'
  )
);

CREATE POLICY "Master admins can delete email templates" 
ON public.email_templates 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'master_admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_email_templates_updated_at
BEFORE UPDATE ON public.email_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default templates
INSERT INTO public.email_templates (template_type, subject, preview_text, heading, message, button_text, footer_text) VALUES 
('signup', 'Confirm your email address', 'Confirm your email address to complete registration', 'Confirm your email', 'Click the button below to confirm your email address and complete your registration.', 'Confirm Email', 'If you didn''t create an account, you can safely ignore this email.'),
('login', 'Your magic link to sign in', 'Your magic link to sign in', 'Sign in to your account', 'Click the button below to sign in to your account.', 'Sign In', 'If you didn''t request this login link, you can safely ignore this email.'),
('recovery', 'Reset your password', 'Reset your password', 'Reset your password', 'Click the button below to reset your password.', 'Reset Password', 'If you didn''t request a password reset, you can safely ignore this email.'),
('email_change', 'Confirm your new email address', 'Confirm your new email address', 'Confirm email change', 'Click the button below to confirm your new email address.', 'Confirm New Email', 'If you didn''t request this email change, you can safely ignore this email.');