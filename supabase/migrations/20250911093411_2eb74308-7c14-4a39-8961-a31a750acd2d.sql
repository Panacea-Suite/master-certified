-- Create team role enum
CREATE TYPE public.team_role AS ENUM ('admin', 'member', 'viewer');

-- Update team_users table to use the enum
ALTER TABLE public.team_users 
ALTER COLUMN role TYPE team_role USING role::team_role;

-- Create function to get effective role for a user in a brand context
CREATE OR REPLACE FUNCTION public.get_effective_role(p_user_id uuid, p_brand_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile RECORD;
  brand_info RECORD;
  team_membership RECORD;
  result JSONB;
BEGIN
  -- Get user profile
  SELECT role INTO user_profile FROM public.profiles WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'effective_role', 'none',
      'global_role', 'none',
      'has_access', false,
      'reason', 'user_not_found'
    );
  END IF;

  -- Master admin has access to everything
  IF user_profile.role = 'master_admin' THEN
    RETURN jsonb_build_object(
      'effective_role', 'master_admin',
      'global_role', 'master_admin',
      'has_access', true,
      'can_manage_all_brands', true,
      'can_manage_all_teams', true,
      'can_view_all', true,
      'can_edit_all', true
    );
  END IF;

  -- If no brand specified, return global role only
  IF p_brand_id IS NULL THEN
    RETURN jsonb_build_object(
      'effective_role', user_profile.role,
      'global_role', user_profile.role,
      'has_access', user_profile.role != 'customer',
      'brand_id', NULL
    );
  END IF;

  -- Check if user owns the brand
  SELECT * INTO brand_info FROM public.brands WHERE id = p_brand_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'effective_role', 'none',
      'global_role', user_profile.role,
      'has_access', false,
      'reason', 'brand_not_found',
      'brand_id', p_brand_id
    );
  END IF;

  -- Brand owner has full access to their brand
  IF brand_info.user_id = p_user_id THEN
    RETURN jsonb_build_object(
      'effective_role', 'brand_admin',
      'global_role', user_profile.role,
      'has_access', true,
      'is_brand_owner', true,
      'can_manage_brand', true,
      'can_manage_teams', true,
      'can_view_all', true,
      'can_edit_all', true,
      'brand_id', p_brand_id
    );
  END IF;

  -- Check team membership for this brand
  SELECT tu.role as team_role, t.id as team_id, t.name as team_name
  INTO team_membership
  FROM public.team_users tu
  JOIN public.teams t ON t.id = tu.team_id
  WHERE tu.user_id = p_user_id AND t.brand_id = p_brand_id
  LIMIT 1;

  IF FOUND THEN
    -- User is a team member in this brand
    result := jsonb_build_object(
      'effective_role', team_membership.team_role,
      'global_role', user_profile.role,
      'has_access', true,
      'is_team_member', true,
      'team_id', team_membership.team_id,
      'team_name', team_membership.team_name,
      'brand_id', p_brand_id
    );

    -- Add specific permissions based on team role
    CASE team_membership.team_role
      WHEN 'admin' THEN
        result := result || jsonb_build_object(
          'can_manage_team', true,
          'can_view_all', true,
          'can_edit_all', true,
          'can_invite_users', true
        );
      WHEN 'member' THEN
        result := result || jsonb_build_object(
          'can_view_all', true,
          'can_edit_campaigns', true,
          'can_edit_flows', true,
          'can_manage_team', false
        );
      WHEN 'viewer' THEN
        result := result || jsonb_build_object(
          'can_view_all', true,
          'can_edit_campaigns', false,
          'can_edit_flows', false,
          'can_manage_team', false
        );
    END CASE;

    RETURN result;
  END IF;

  -- User has no access to this brand
  RETURN jsonb_build_object(
    'effective_role', 'none',
    'global_role', user_profile.role,
    'has_access', false,
    'reason', 'not_team_member',
    'brand_id', p_brand_id
  );
END;
$$;

-- Create function to check if user can access resource
CREATE OR REPLACE FUNCTION public.can_access_resource(
  p_user_id uuid,
  p_resource_type text,
  p_resource_id uuid,
  p_action text DEFAULT 'view'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  brand_id_for_resource uuid;
  user_role_info jsonb;
BEGIN
  -- Get brand_id based on resource type
  CASE p_resource_type
    WHEN 'brand' THEN
      brand_id_for_resource := p_resource_id;
    WHEN 'team' THEN
      SELECT brand_id INTO brand_id_for_resource FROM public.teams WHERE id = p_resource_id;
    WHEN 'campaign' THEN
      SELECT brand_id INTO brand_id_for_resource FROM public.campaigns WHERE id = p_resource_id;
    WHEN 'flow' THEN
      SELECT c.brand_id INTO brand_id_for_resource 
      FROM public.flows f 
      JOIN public.campaigns c ON c.id = f.campaign_id 
      WHERE f.id = p_resource_id;
    WHEN 'batch' THEN
      SELECT c.brand_id INTO brand_id_for_resource 
      FROM public.batches b 
      JOIN public.campaigns c ON c.id = b.campaign_id 
      WHERE b.id = p_resource_id;
    ELSE
      RETURN false;
  END CASE;

  IF brand_id_for_resource IS NULL THEN
    RETURN false;
  END IF;

  -- Get effective role
  user_role_info := public.get_effective_role(p_user_id, brand_id_for_resource);

  -- Check access based on action
  CASE p_action
    WHEN 'view' THEN
      RETURN (user_role_info->>'has_access')::boolean AND 
             COALESCE((user_role_info->>'can_view_all')::boolean, false);
    WHEN 'edit' THEN
      RETURN (user_role_info->>'has_access')::boolean AND 
             (COALESCE((user_role_info->>'can_edit_all')::boolean, false) OR
              (p_resource_type IN ('campaign', 'flow') AND 
               COALESCE((user_role_info->>'can_edit_campaigns')::boolean, false)));
    WHEN 'manage' THEN
      RETURN (user_role_info->>'has_access')::boolean AND 
             (COALESCE((user_role_info->>'can_manage_all_brands')::boolean, false) OR
              COALESCE((user_role_info->>'can_manage_brand')::boolean, false) OR
              (p_resource_type = 'team' AND COALESCE((user_role_info->>'can_manage_team')::boolean, false)));
    ELSE
      RETURN false;
  END CASE;
END;
$$;

-- Create role constants as a view for easy access
CREATE OR REPLACE VIEW public.role_constants AS
SELECT 
  'master_admin' as master_admin,
  'brand_admin' as brand_admin,
  'customer' as customer,
  'admin' as team_admin,
  'member' as team_member,
  'viewer' as team_viewer;