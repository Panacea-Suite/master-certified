-- Update the INSERT policy for flows table to allow templates without campaigns
DROP POLICY IF EXISTS "Users can create flows for their campaigns" ON flows;

-- Create updated policy that allows both regular flows (with campaigns) and templates (without campaigns)
CREATE POLICY "Users can create flows for their campaigns or templates" 
ON flows 
FOR INSERT 
WITH CHECK (
  -- Allow templates without campaign_id
  (is_template = true AND campaign_id IS NULL AND created_by = auth.uid())
  OR
  -- Allow regular flows with valid campaign_id
  (EXISTS ( SELECT 1
     FROM (campaigns c
       JOIN brands b ON ((b.id = c.brand_id)))
    WHERE ((c.id = flows.campaign_id) AND (b.user_id = auth.uid()))))
);