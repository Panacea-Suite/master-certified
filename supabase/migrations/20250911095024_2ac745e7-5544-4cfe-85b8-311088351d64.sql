-- =====================================================
-- FLOWS TABLE RLS POLICIES
-- =====================================================

-- SELECT: Team members can view flows, plus public access for customer experience and system templates
CREATE POLICY "rls_flows_select" ON public.flows
FOR SELECT
USING (
  -- Master admins can see all flows
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  -- System templates are publicly viewable
  (is_system_template = true)
  OR
  -- Brand owners can see flows in their brand's campaigns
  (EXISTS (
    SELECT 1 FROM public.campaigns c 
    JOIN public.brands b ON b.id = c.brand_id
    WHERE c.id = flows.campaign_id AND b.user_id = auth.uid()
  ))
  OR
  -- Team members can see flows in their brand
  (EXISTS (
    SELECT 1 FROM public.campaigns c 
    JOIN public.team_users tu ON tu.user_id = auth.uid()
    JOIN public.teams t ON t.id = tu.team_id
    WHERE c.id = flows.campaign_id AND t.brand_id = c.brand_id
  ))
  OR
  -- Public access for customer flows (unauthenticated users)
  (auth.uid() IS NULL)
  OR
  -- Template flows are accessible to their creators
  (is_template = true AND created_by = auth.uid())
);

-- INSERT: Team members with edit permissions can create flows
CREATE POLICY "rls_flows_insert" ON public.flows
FOR INSERT
WITH CHECK (
  -- Master admins can create flows
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  -- Users can create template flows
  (is_template = true AND campaign_id IS NULL AND created_by = auth.uid())
  OR
  -- Brand owners can create flows for their campaigns
  (EXISTS (
    SELECT 1 FROM public.campaigns c 
    JOIN public.brands b ON b.id = c.brand_id
    WHERE c.id = flows.campaign_id AND b.user_id = auth.uid()
  ))
  OR
  -- Team members can create flows for campaigns in their brand
  (EXISTS (
    SELECT 1 FROM public.campaigns c 
    JOIN public.team_users tu ON tu.user_id = auth.uid()
    JOIN public.teams t ON t.id = tu.team_id
    WHERE c.id = flows.campaign_id AND t.brand_id = c.brand_id 
    AND tu.role IN ('admin', 'member')
  ))
);

-- UPDATE: Team members with edit permissions can update flows
CREATE POLICY "rls_flows_update" ON public.flows
FOR UPDATE
USING (
  -- Master admins can update all flows
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  -- Template creators can update their templates
  (is_template = true AND created_by = auth.uid())
  OR
  -- Brand owners can update flows in their campaigns
  (EXISTS (
    SELECT 1 FROM public.campaigns c 
    JOIN public.brands b ON b.id = c.brand_id
    WHERE c.id = flows.campaign_id AND b.user_id = auth.uid()
  ))
  OR
  -- Team members can update flows in their brand
  (EXISTS (
    SELECT 1 FROM public.campaigns c 
    JOIN public.team_users tu ON tu.user_id = auth.uid()
    JOIN public.teams t ON t.id = tu.team_id
    WHERE c.id = flows.campaign_id AND t.brand_id = c.brand_id 
    AND tu.role IN ('admin', 'member')
  ))
);

-- DELETE: Brand owners, team admins, and flow creators can delete flows
CREATE POLICY "rls_flows_delete" ON public.flows
FOR DELETE
USING (
  -- Master admins can delete all flows
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  -- Template creators can delete their templates
  (is_template = true AND created_by = auth.uid())
  OR
  -- Brand owners can delete flows in their campaigns
  (EXISTS (
    SELECT 1 FROM public.campaigns c 
    JOIN public.brands b ON b.id = c.brand_id
    WHERE c.id = flows.campaign_id AND b.user_id = auth.uid()
  ))
  OR
  -- Team admins can delete flows in their brand
  (EXISTS (
    SELECT 1 FROM public.campaigns c 
    JOIN public.team_users tu ON tu.user_id = auth.uid()
    JOIN public.teams t ON t.id = tu.team_id
    WHERE c.id = flows.campaign_id AND t.brand_id = c.brand_id 
    AND tu.role = 'admin'
  ))
);

-- =====================================================
-- BATCHES TABLE RLS POLICIES
-- =====================================================

-- SELECT: Team members can view batches in their brand's campaigns
CREATE POLICY "rls_batches_select" ON public.batches
FOR SELECT
USING (
  -- Master admins can see all batches
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  -- Brand owners can see batches in their brand's campaigns
  (EXISTS (
    SELECT 1 FROM public.campaigns c 
    JOIN public.brands b ON b.id = c.brand_id
    WHERE c.id = batches.campaign_id AND b.user_id = auth.uid()
  ))
  OR
  -- Team members can see batches in their brand
  (EXISTS (
    SELECT 1 FROM public.campaigns c 
    JOIN public.team_users tu ON tu.user_id = auth.uid()
    JOIN public.teams t ON t.id = tu.team_id
    WHERE c.id = batches.campaign_id AND t.brand_id = c.brand_id
  ))
);

-- INSERT: Team members with edit permissions can create batches
CREATE POLICY "rls_batches_insert" ON public.batches
FOR INSERT
WITH CHECK (
  -- Master admins can create batches
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  -- Brand owners can create batches for their campaigns
  (EXISTS (
    SELECT 1 FROM public.campaigns c 
    JOIN public.brands b ON b.id = c.brand_id
    WHERE c.id = batches.campaign_id AND b.user_id = auth.uid()
  ))
  OR
  -- Team members can create batches for campaigns in their brand
  (EXISTS (
    SELECT 1 FROM public.campaigns c 
    JOIN public.team_users tu ON tu.user_id = auth.uid()
    JOIN public.teams t ON t.id = tu.team_id
    WHERE c.id = batches.campaign_id AND t.brand_id = c.brand_id 
    AND tu.role IN ('admin', 'member')
  ))
);

-- UPDATE: Team members with edit permissions can update batches
CREATE POLICY "rls_batches_update" ON public.batches
FOR UPDATE
USING (
  -- Master admins can update all batches
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  -- Brand owners can update batches in their campaigns
  (EXISTS (
    SELECT 1 FROM public.campaigns c 
    JOIN public.brands b ON b.id = c.brand_id
    WHERE c.id = batches.campaign_id AND b.user_id = auth.uid()
  ))
  OR
  -- Team members can update batches in their brand
  (EXISTS (
    SELECT 1 FROM public.campaigns c 
    JOIN public.team_users tu ON tu.user_id = auth.uid()
    JOIN public.teams t ON t.id = tu.team_id
    WHERE c.id = batches.campaign_id AND t.brand_id = c.brand_id 
    AND tu.role IN ('admin', 'member')
  ))
);

-- DELETE: Brand owners, team admins can delete batches
CREATE POLICY "rls_batches_delete" ON public.batches
FOR DELETE
USING (
  -- Master admins can delete all batches
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  -- Brand owners can delete batches in their campaigns
  (EXISTS (
    SELECT 1 FROM public.campaigns c 
    JOIN public.brands b ON b.id = c.brand_id
    WHERE c.id = batches.campaign_id AND b.user_id = auth.uid()
  ))
  OR
  -- Team admins can delete batches in their brand
  (EXISTS (
    SELECT 1 FROM public.campaigns c 
    JOIN public.team_users tu ON tu.user_id = auth.uid()
    JOIN public.teams t ON t.id = tu.team_id
    WHERE c.id = batches.campaign_id AND t.brand_id = c.brand_id 
    AND tu.role = 'admin'
  ))
);