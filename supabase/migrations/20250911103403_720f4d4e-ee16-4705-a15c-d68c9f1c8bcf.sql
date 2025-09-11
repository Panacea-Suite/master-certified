-- Helper functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_brand_owner_for_team(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teams t
    JOIN public.brands b ON b.id = t.brand_id
    WHERE t.id = p_team_id
      AND b.user_id = auth.uid()
  );
$$;

-- Replace team_users policies to remove joins that caused recursion
DROP POLICY IF EXISTS "team_users_select_policy" ON public.team_users;
DROP POLICY IF EXISTS "team_users_insert_policy" ON public.team_users;
DROP POLICY IF EXISTS "team_users_update_policy" ON public.team_users;
DROP POLICY IF EXISTS "team_users_delete_policy" ON public.team_users;

CREATE POLICY "team_users_select"
ON public.team_users
FOR SELECT
USING (
  public.is_master_admin()
  OR public.is_brand_owner_for_team(team_id)
  OR user_id = auth.uid()
);

CREATE POLICY "team_users_insert"
ON public.team_users
FOR INSERT
WITH CHECK (
  public.is_master_admin()
  OR public.is_brand_owner_for_team(team_id)
);

CREATE POLICY "team_users_update"
ON public.team_users
FOR UPDATE
USING (
  public.is_master_admin()
  OR public.is_brand_owner_for_team(team_id)
  OR user_id = auth.uid()
)
WITH CHECK (
  public.is_master_admin()
  OR public.is_brand_owner_for_team(team_id)
  OR user_id = auth.uid()
);

CREATE POLICY "team_users_delete"
ON public.team_users
FOR DELETE
USING (
  public.is_master_admin()
  OR public.is_brand_owner_for_team(team_id)
);
