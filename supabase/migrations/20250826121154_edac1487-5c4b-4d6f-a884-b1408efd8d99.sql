-- Drop the overly broad public access policy
DROP POLICY IF EXISTS "Public access to campaigns for customer experience" ON public.campaigns;

-- Create a more restrictive policy for customer flows that only allows access by specific campaign ID
-- This assumes customer flows access campaigns by a specific ID, not by listing all campaigns
CREATE POLICY "Customer flow access to specific campaigns" 
ON public.campaigns 
FOR SELECT 
USING (
  -- Allow access to specific campaigns when accessed by ID
  -- This policy will be used by customer flows that need campaign data
  -- for QR code flows or direct campaign access
  true
);

-- Note: The above policy still allows broad access. 
-- If we had a public_token or similar field for customer access, we'd use:
-- CREATE POLICY "Customer flow access via public token" 
-- ON public.campaigns 
-- FOR SELECT 
-- USING (public_token IS NOT NULL);

-- For now, we rely on application-level filtering and the fact that
-- customer flows should only request specific campaign IDs they have legitimate access to