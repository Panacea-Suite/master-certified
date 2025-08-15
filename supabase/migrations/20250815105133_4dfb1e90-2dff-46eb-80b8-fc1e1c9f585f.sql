-- Fix the flows INSERT policy to include WITH CHECK condition
DROP POLICY IF EXISTS "Users can create flows for their campaigns" ON flows;

CREATE POLICY "Users can create flows for their campaigns" 
ON flows 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM campaigns c
    JOIN brands b ON (b.id = c.brand_id)
    WHERE c.id = flows.campaign_id 
    AND b.user_id = auth.uid()
  )
);