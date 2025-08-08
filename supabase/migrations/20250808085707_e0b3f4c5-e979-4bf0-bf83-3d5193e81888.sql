-- Create brands table
CREATE TABLE public.brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  brand_colors JSONB,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flows table
CREATE TABLE public.flows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  flow_config JSONB,
  redirect_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create batches table
CREATE TABLE public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  qr_code_count INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create qr_codes table
CREATE TABLE public.qr_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  qr_url TEXT NOT NULL,
  unique_code TEXT NOT NULL UNIQUE,
  scans INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brands
CREATE POLICY "Users can view their own brands" 
ON public.brands 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own brands" 
ON public.brands 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brands" 
ON public.brands 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brands" 
ON public.brands 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for campaigns
CREATE POLICY "Users can view campaigns of their brands" 
ON public.campaigns 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.brands 
  WHERE brands.id = campaigns.brand_id 
  AND brands.user_id = auth.uid()
));

CREATE POLICY "Users can create campaigns for their brands" 
ON public.campaigns 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.brands 
  WHERE brands.id = campaigns.brand_id 
  AND brands.user_id = auth.uid()
));

CREATE POLICY "Users can update campaigns of their brands" 
ON public.campaigns 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.brands 
  WHERE brands.id = campaigns.brand_id 
  AND brands.user_id = auth.uid()
));

CREATE POLICY "Users can delete campaigns of their brands" 
ON public.campaigns 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.brands 
  WHERE brands.id = campaigns.brand_id 
  AND brands.user_id = auth.uid()
));

-- Create RLS policies for flows
CREATE POLICY "Users can view flows of their campaigns" 
ON public.flows 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.campaigns c
  JOIN public.brands b ON b.id = c.brand_id
  WHERE c.id = flows.campaign_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Users can create flows for their campaigns" 
ON public.flows 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.campaigns c
  JOIN public.brands b ON b.id = c.brand_id
  WHERE c.id = flows.campaign_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Users can update flows of their campaigns" 
ON public.flows 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.campaigns c
  JOIN public.brands b ON b.id = c.brand_id
  WHERE c.id = flows.campaign_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Users can delete flows of their campaigns" 
ON public.flows 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.campaigns c
  JOIN public.brands b ON b.id = c.brand_id
  WHERE c.id = flows.campaign_id 
  AND b.user_id = auth.uid()
));

-- Create RLS policies for batches
CREATE POLICY "Users can view batches of their campaigns" 
ON public.batches 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.campaigns c
  JOIN public.brands b ON b.id = c.brand_id
  WHERE c.id = batches.campaign_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Users can create batches for their campaigns" 
ON public.batches 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.campaigns c
  JOIN public.brands b ON b.id = c.brand_id
  WHERE c.id = batches.campaign_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Users can update batches of their campaigns" 
ON public.batches 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.campaigns c
  JOIN public.brands b ON b.id = c.brand_id
  WHERE c.id = batches.campaign_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Users can delete batches of their campaigns" 
ON public.batches 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.campaigns c
  JOIN public.brands b ON b.id = c.brand_id
  WHERE c.id = batches.campaign_id 
  AND b.user_id = auth.uid()
));

-- Create RLS policies for qr_codes
CREATE POLICY "Users can view QR codes of their batches" 
ON public.qr_codes 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.batches bt
  JOIN public.campaigns c ON c.id = bt.campaign_id
  JOIN public.brands b ON b.id = c.brand_id
  WHERE bt.id = qr_codes.batch_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Users can create QR codes for their batches" 
ON public.qr_codes 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.batches bt
  JOIN public.campaigns c ON c.id = bt.campaign_id
  JOIN public.brands b ON b.id = c.brand_id
  WHERE bt.id = qr_codes.batch_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Users can update QR codes of their batches" 
ON public.qr_codes 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.batches bt
  JOIN public.campaigns c ON c.id = bt.campaign_id
  JOIN public.brands b ON b.id = c.brand_id
  WHERE bt.id = qr_codes.batch_id 
  AND b.user_id = auth.uid()
));

CREATE POLICY "Users can delete QR codes of their batches" 
ON public.qr_codes 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.batches bt
  JOIN public.campaigns c ON c.id = bt.campaign_id
  JOIN public.brands b ON b.id = c.brand_id
  WHERE bt.id = qr_codes.batch_id 
  AND b.user_id = auth.uid()
));

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_brands_updated_at
BEFORE UPDATE ON public.brands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flows_updated_at
BEFORE UPDATE ON public.flows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_batches_updated_at
BEFORE UPDATE ON public.batches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_qr_codes_updated_at
BEFORE UPDATE ON public.qr_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();