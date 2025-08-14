-- Add flow_id and unique_flow_url to qr_codes table to link each QR to its flow instance
ALTER TABLE public.qr_codes 
ADD COLUMN flow_id UUID,
ADD COLUMN unique_flow_url TEXT;

-- Add final_redirect_url to campaigns for the actual destination after flow completion
ALTER TABLE public.campaigns 
ADD COLUMN final_redirect_url TEXT;

-- Remove the user-editable redirect_url from flows table and add system-generated base_url
ALTER TABLE public.flows 
DROP COLUMN redirect_url,
ADD COLUMN base_url TEXT;

-- Create index for better performance on QR code lookups
CREATE INDEX idx_qr_codes_unique_code ON public.qr_codes(unique_code);
CREATE INDEX idx_qr_codes_flow_id ON public.qr_codes(flow_id);

-- Update RLS policies for new columns
-- QR codes can be viewed publicly for the redirect functionality
CREATE POLICY "Public access to QR codes for redirect" 
ON public.qr_codes 
FOR SELECT 
USING (true);

-- Flow content can be viewed publicly for customer experience
CREATE POLICY "Public access to flows for customer experience" 
ON public.flows 
FOR SELECT 
USING (true);

CREATE POLICY "Public access to flow content for customer experience" 
ON public.flow_content 
FOR SELECT 
USING (true);

CREATE POLICY "Public access to campaigns for customer experience" 
ON public.campaigns 
FOR SELECT 
USING (true);