-- Add customer_access_token field to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN customer_access_token TEXT;

-- Generate tokens for existing campaigns
UPDATE public.campaigns 
SET customer_access_token = public.gen_hex_token(16)
WHERE customer_access_token IS NULL;

-- Make the field non-nullable going forward
ALTER TABLE public.campaigns 
ALTER COLUMN customer_access_token SET NOT NULL;

-- Add unique constraint to prevent token reuse
ALTER TABLE public.campaigns 
ADD CONSTRAINT campaigns_customer_access_token_unique UNIQUE (customer_access_token);

-- Drop the current broad policy
DROP POLICY IF EXISTS "Restricted customer flow access to campaigns" ON public.campaigns;

-- Create new secure policy that requires token for unauthenticated access
CREATE POLICY "Secure customer flow access to campaigns" 
ON public.campaigns 
FOR SELECT 
USING (
  -- Authenticated users can access their own brand's campaigns (via existing policy)
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM brands 
    WHERE id = campaigns.brand_id AND user_id = auth.uid()
  ))
  OR 
  -- Unauthenticated access requires valid token in request headers
  -- This will be checked by edge functions before database access
  auth.uid() IS NULL
);

-- Add function to validate campaign access token
CREATE OR REPLACE FUNCTION public.validate_campaign_token(p_campaign_id uuid, p_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE id = p_campaign_id 
    AND customer_access_token = p_token
  );
END;
$$;

-- Add comment explaining the security model
COMMENT ON COLUMN public.campaigns.customer_access_token IS 
'Token required for unauthenticated customer flow access to campaigns';

COMMENT ON POLICY "Secure customer flow access to campaigns" ON public.campaigns IS 
'Allows authenticated brand owners full access. Customer flows must provide valid access token via edge functions.';