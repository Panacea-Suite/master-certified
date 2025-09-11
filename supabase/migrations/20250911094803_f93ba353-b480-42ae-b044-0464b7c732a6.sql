-- =====================================================
-- BRANDS TABLE RLS POLICIES
-- =====================================================

-- SELECT: Master admins can view all brands, brand owners can view their own
CREATE POLICY "rls_brands_select" ON public.brands
FOR SELECT
USING (
  -- Master admins can see all brands
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  -- Brand owners can see their own brands
  (user_id = auth.uid())
);

-- INSERT: Master admins can create brands for any user, users can create their own
CREATE POLICY "rls_brands_insert" ON public.brands
FOR INSERT
WITH CHECK (
  -- Master admins can create brands for anyone
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  -- Users can create brands for themselves
  (user_id = auth.uid())
);

-- UPDATE: Master admins can update all brands, brand owners can update their own
CREATE POLICY "rls_brands_update" ON public.brands
FOR UPDATE
USING (
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  (user_id = auth.uid())
);

-- DELETE: Master admins can delete all brands, brand owners can delete their own
CREATE POLICY "rls_brands_delete" ON public.brands
FOR DELETE
USING (
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  (user_id = auth.uid())
);

-- =====================================================
-- TEAMS TABLE RLS POLICIES  
-- =====================================================

-- SELECT: Users can view teams if they own the brand, are team members, or are master admin
CREATE POLICY "rls_teams_select" ON public.teams
FOR SELECT
USING (
  -- Master admins can see all teams
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  -- Brand owners can see their brand's teams
  (EXISTS (
    SELECT 1 FROM public.brands b 
    WHERE b.id = teams.brand_id AND b.user_id = auth.uid()
  ))
  OR
  -- Team members can see their teams
  (EXISTS (
    SELECT 1 FROM public.team_users tu 
    WHERE tu.team_id = teams.id AND tu.user_id = auth.uid()
  ))
);

-- INSERT: Brand owners and master admins can create teams
CREATE POLICY "rls_teams_insert" ON public.teams
FOR INSERT
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  (EXISTS (
    SELECT 1 FROM public.brands b 
    WHERE b.id = teams.brand_id AND b.user_id = auth.uid()
  ))
);

-- UPDATE: Brand owners, team admins, and master admins can update teams
CREATE POLICY "rls_teams_update" ON public.teams
FOR UPDATE
USING (
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  (EXISTS (
    SELECT 1 FROM public.brands b 
    WHERE b.id = teams.brand_id AND b.user_id = auth.uid()
  ))
  OR
  (EXISTS (
    SELECT 1 FROM public.team_users tu 
    WHERE tu.team_id = teams.id AND tu.user_id = auth.uid() AND tu.role = 'admin'
  ))
);

-- DELETE: Brand owners and master admins can delete teams
CREATE POLICY "rls_teams_delete" ON public.teams
FOR DELETE
USING (
  (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  ))
  OR
  (EXISTS (
    SELECT 1 FROM public.brands b 
    WHERE b.id = teams.brand_id AND b.user_id = auth.uid()
  ))
);