-- Create design_templates table
CREATE TABLE public.design_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.design_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for design templates (public read access for templates)
CREATE POLICY "Design templates are viewable by everyone" 
ON public.design_templates 
FOR SELECT 
USING (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_design_templates_updated_at
BEFORE UPDATE ON public.design_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default design templates
INSERT INTO public.design_templates (name, category, description, config, is_default) VALUES
('Modern Gradient', 'modern', 'Contemporary gradient design with smooth color transitions', '{
  "headerStyle": "gradient",
  "sectionBackground": "subtle-gradient",
  "cardStyle": "glass",
  "buttonStyle": "gradient",
  "textColors": "high-contrast",
  "borderRadius": "rounded",
  "shadows": "elevated"
}', true),

('Corporate Clean', 'professional', 'Clean professional design with subtle brand accents', '{
  "headerStyle": "solid",
  "sectionBackground": "light",
  "cardStyle": "bordered",
  "buttonStyle": "solid",
  "textColors": "corporate",
  "borderRadius": "minimal",
  "shadows": "subtle"
}', true),

('Bold & Vibrant', 'vibrant', 'High-impact design with bold brand colors', '{
  "headerStyle": "bold-gradient",
  "sectionBackground": "brand-primary",
  "cardStyle": "contrast",
  "buttonStyle": "bold",
  "textColors": "high-contrast",
  "borderRadius": "rounded",
  "shadows": "strong"
}', false),

('Minimalist', 'minimal', 'Clean minimal design with subtle brand touches', '{
  "headerStyle": "minimal",
  "sectionBackground": "white",
  "cardStyle": "minimal",
  "buttonStyle": "outline",
  "textColors": "subtle",
  "borderRadius": "sharp",
  "shadows": "none"
}', false),

('Premium Dark', 'dark', 'Sophisticated dark theme with brand color highlights', '{
  "headerStyle": "dark-gradient",
  "sectionBackground": "dark",
  "cardStyle": "dark-glass",
  "buttonStyle": "glow",
  "textColors": "dark-theme",
  "borderRadius": "rounded",
  "shadows": "glow"
}', false);

-- Add design_template_id to flows table
ALTER TABLE public.flows ADD COLUMN design_template_id UUID REFERENCES public.design_templates(id);