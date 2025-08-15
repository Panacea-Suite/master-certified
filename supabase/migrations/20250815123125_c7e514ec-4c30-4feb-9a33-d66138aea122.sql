-- Update the DELETE policy for flows table to allow deleting templates
DROP POLICY IF EXISTS "Users can delete flows of their campaigns" ON flows;

-- Create updated policy that allows deleting both regular flows and templates
CREATE POLICY "Users can delete flows of their campaigns or templates" 
ON flows 
FOR DELETE 
USING (
  -- Allow deleting templates created by the user
  (is_template = true AND created_by = auth.uid())
  OR
  -- Allow deleting regular flows with valid campaign_id
  (EXISTS ( SELECT 1
     FROM (campaigns c
       JOIN brands b ON ((b.id = c.brand_id)))
    WHERE ((c.id = flows.campaign_id) AND (b.user_id = auth.uid()))))
);