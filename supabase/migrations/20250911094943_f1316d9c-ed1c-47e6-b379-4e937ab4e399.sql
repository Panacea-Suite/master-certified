-- =====================================================
-- TEAM_USERS TABLE RLS POLICIES
-- =====================================================

-- SELECT: Users can view team members if they have access to the team
CREATE POLICY "rls_team_users_select" ON public.team_users
FOR SELECT
USING (
  -- Master admins can see all team memberships
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  -- Brand owners can see team members in their brands
  (EXISTS (
    SELECT 1 FROM public.teams t 
    JOIN public.brands b ON b.id = t.brand_id
    WHERE t.id = team_users.team_id AND b.user_id = auth.uid()
  ))
  OR
  -- Team members can see other members in their teams
  (EXISTS (
    SELECT 1 FROM public.team_users tu 
    WHERE tu.team_id = team_users.team_id AND tu.user_id = auth.uid()
  ))
);

-- INSERT: Brand owners, team admins, and master admins can add team members
CREATE POLICY "rls_team_users_insert" ON public.team_users
FOR INSERT
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  (EXISTS (
    SELECT 1 FROM public.teams t 
    JOIN public.brands b ON b.id = t.brand_id
    WHERE t.id = team_users.team_id AND b.user_id = auth.uid()
  ))
  OR
  (EXISTS (
    SELECT 1 FROM public.team_users tu 
    WHERE tu.team_id = team_users.team_id AND tu.user_id = auth.uid() AND tu.role = 'admin'
  ))
);

-- UPDATE: Brand owners, team admins, and master admins can update team memberships
CREATE POLICY "rls_team_users_update" ON public.team_users
FOR UPDATE
USING (
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  (EXISTS (
    SELECT 1 FROM public.teams t 
    JOIN public.brands b ON b.id = t.brand_id
    WHERE t.id = team_users.team_id AND b.user_id = auth.uid()
  ))
  OR
  (EXISTS (
    SELECT 1 FROM public.team_users tu 
    WHERE tu.team_id = team_users.team_id AND tu.user_id = auth.uid() AND tu.role = 'admin'
  ))
);

-- DELETE: Brand owners, team admins, and master admins can remove team members
CREATE POLICY "rls_team_users_delete" ON public.team_users
FOR DELETE
USING (
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  (EXISTS (
    SELECT 1 FROM public.teams t 
    JOIN public.brands b ON b.id = t.brand_id
    WHERE t.id = team_users.team_id AND b.user_id = auth.uid()
  ))
  OR
  (EXISTS (
    SELECT 1 FROM public.team_users tu 
    WHERE tu.team_id = team_users.team_id AND tu.user_id = auth.uid() AND tu.role = 'admin'
  ))
);

-- =====================================================
-- CAMPAIGNS TABLE RLS POLICIES
-- =====================================================

-- SELECT: Users can view campaigns if they have brand/team access, plus public access for customer flows
CREATE POLICY "rls_campaigns_select" ON public.campaigns
FOR SELECT
USING (
  -- Master admins can see all campaigns
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  -- Brand owners can see their brand's campaigns
  (EXISTS (
    SELECT 1 FROM public.brands b 
    WHERE b.id = campaigns.brand_id AND b.user_id = auth.uid()
  ))
  OR
  -- Team members can see campaigns in their brand
  (EXISTS (
    SELECT 1 FROM public.team_users tu 
    JOIN public.teams t ON t.id = tu.team_id
    WHERE t.brand_id = campaigns.brand_id AND tu.user_id = auth.uid()
  ))
  OR
  -- Public access for customer flows (unauthenticated users)
  (auth.uid() IS NULL)
);

-- INSERT: Brand owners, team members with edit permissions, and master admins can create campaigns
CREATE POLICY "rls_campaigns_insert" ON public.campaigns
FOR INSERT
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  (EXISTS (
    SELECT 1 FROM public.brands b 
    WHERE b.id = campaigns.brand_id AND b.user_id = auth.uid()
  ))
  OR
  (EXISTS (
    SELECT 1 FROM public.team_users tu 
    JOIN public.teams t ON t.id = tu.team_id
    WHERE t.brand_id = campaigns.brand_id AND tu.user_id = auth.uid() 
    AND tu.role IN ('admin', 'member')
  ))
);

-- UPDATE: Brand owners, team members with edit permissions, and master admins can update campaigns
CREATE POLICY "rls_campaigns_update" ON public.campaigns
FOR UPDATE
USING (
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  (EXISTS (
    SELECT 1 FROM public.brands b 
    WHERE b.id = campaigns.brand_id AND b.user_id = auth.uid()
  ))
  OR
  (EXISTS (
    SELECT 1 FROM public.team_users tu 
    JOIN public.teams t ON t.id = tu.team_id
    WHERE t.brand_id = campaigns.brand_id AND tu.user_id = auth.uid() 
    AND tu.role IN ('admin', 'member')
  ))
);

-- DELETE: Brand owners, team admins, and master admins can delete campaigns
CREATE POLICY "rls_campaigns_delete" ON public.campaigns
FOR DELETE
USING (
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  (EXISTS (
    SELECT 1 FROM public.brands b 
    WHERE b.id = campaigns.brand_id AND b.user_id = auth.uid()
  ))
  OR
  (EXISTS (
    SELECT 1 FROM public.team_users tu 
    JOIN public.teams t ON t.id = tu.team_id
    WHERE t.brand_id = campaigns.brand_id AND tu.user_id = auth.uid() 
    AND tu.role = 'admin'
  ))
);