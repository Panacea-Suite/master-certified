-- Fix infinite recursion in team_users policies by simplifying them
-- Drop existing problematic policies
DROP POLICY IF EXISTS "rls_team_users_select" ON public.team_users;
DROP POLICY IF EXISTS "rls_team_users_insert" ON public.team_users;
DROP POLICY IF EXISTS "rls_team_users_update" ON public.team_users;
DROP POLICY IF EXISTS "rls_team_users_delete" ON public.team_users;

-- Create simpler, non-recursive policies for team_users
CREATE POLICY "team_users_select_policy" 
ON public.team_users 
FOR SELECT 
USING (
  -- Master admins can see all
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  )
  OR
  -- Brand owners can see their brand's team users
  EXISTS (
    SELECT 1 FROM public.brands b 
    JOIN public.teams t ON t.brand_id = b.id 
    WHERE t.id = team_users.team_id AND b.user_id = auth.uid()
  )
  OR
  -- Users can see themselves in any team
  team_users.user_id = auth.uid()
);

CREATE POLICY "team_users_insert_policy" 
ON public.team_users 
FOR INSERT 
WITH CHECK (
  -- Master admins can add anyone
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  )
  OR
  -- Brand owners can add users to their teams
  EXISTS (
    SELECT 1 FROM public.brands b 
    JOIN public.teams t ON t.brand_id = b.id 
    WHERE t.id = team_users.team_id AND b.user_id = auth.uid()
  )
);

CREATE POLICY "team_users_update_policy" 
ON public.team_users 
FOR UPDATE 
USING (
  -- Master admins can update any
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  )
  OR
  -- Brand owners can update their team users
  EXISTS (
    SELECT 1 FROM public.brands b 
    JOIN public.teams t ON t.brand_id = b.id 
    WHERE t.id = team_users.team_id AND b.user_id = auth.uid()
  )
);

CREATE POLICY "team_users_delete_policy" 
ON public.team_users 
FOR DELETE 
USING (
  -- Master admins can delete any
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() AND p.role = 'master_admin'
  )
  OR
  -- Brand owners can remove users from their teams
  EXISTS (
    SELECT 1 FROM public.brands b 
    JOIN public.teams t ON t.brand_id = b.id 
    WHERE t.id = team_users.team_id AND b.user_id = auth.uid()
  )
);

-- Fix ambiguous user_id reference in admin_get_all_brands function
CREATE OR REPLACE FUNCTION public.admin_get_all_brands()
RETURNS TABLE(id uuid, name text, user_id uuid, created_at timestamp with time zone, updated_at timestamp with time zone, user_email text, user_display_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if user is master_admin
  IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'master_admin') THEN
    RAISE EXCEPTION 'Access denied: only master admins can view all brands';
  END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.name,
    b.user_id,
    b.created_at,
    b.updated_at,
    p.email,
    p.display_name
  FROM public.brands b
  JOIN public.profiles p ON p.user_id = b.user_id  -- Qualify the user_id reference
  ORDER BY b.created_at DESC;
END;
$$;