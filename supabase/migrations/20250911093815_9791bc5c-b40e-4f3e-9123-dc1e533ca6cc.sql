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