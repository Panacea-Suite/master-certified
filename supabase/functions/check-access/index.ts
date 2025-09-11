import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RoleInfo {
  effective_role: string
  global_role: string
  has_access: boolean
  can_manage_all_brands?: boolean
  can_manage_brand?: boolean
  can_manage_team?: boolean
  can_view_all?: boolean
  can_edit_all?: boolean
  can_edit_campaigns?: boolean
  can_edit_flows?: boolean
  can_invite_users?: boolean
  is_brand_owner?: boolean
  is_team_member?: boolean
  brand_id?: string
  team_id?: string
  team_name?: string
  reason?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    // Parse request body
    const { 
      brand_id, 
      team_id, 
      resource_type, 
      resource_id, 
      action = 'view',
      check_type = 'role' // 'role' or 'resource'
    } = await req.json()

    let result: any = {
      success: true,
      user_id: user.id
    }

    if (check_type === 'resource' && resource_type && resource_id) {
      // Check access to specific resource
      const { data: hasAccess, error: accessError } = await supabase
        .rpc('can_access_resource', {
          p_user_id: user.id,
          p_resource_type: resource_type,
          p_resource_id: resource_id,
          p_action: action
        })

      if (accessError) {
        console.error('Resource access check error:', accessError)
        throw new Error(`Failed to check resource access: ${accessError.message}`)
      }

      result = {
        ...result,
        has_access: hasAccess,
        resource_type,
        resource_id,
        action,
        message: hasAccess ? 'Access granted' : 'Access denied'
      }
    } else {
      // Get effective role for brand/team context
      const { data: roleInfo, error: roleError } = await supabase
        .rpc('get_effective_role', {
          p_user_id: user.id,
          p_brand_id: brand_id || null
        })

      if (roleError) {
        console.error('Role check error:', roleError)
        throw new Error(`Failed to check user role: ${roleError.message}`)
      }

      const role: RoleInfo = roleInfo as RoleInfo

      result = {
        ...result,
        ...role,
        permissions: {
          can_manage_all_brands: role.can_manage_all_brands || false,
          can_manage_brand: role.can_manage_brand || false,
          can_manage_team: role.can_manage_team || false,
          can_view_all: role.can_view_all || false,
          can_edit_all: role.can_edit_all || false,
          can_edit_campaigns: role.can_edit_campaigns || false,
          can_edit_flows: role.can_edit_flows || false,
          can_invite_users: role.can_invite_users || false
        },
        context: {
          is_master_admin: role.effective_role === 'master_admin',
          is_brand_owner: role.is_brand_owner || false,
          is_team_member: role.is_team_member || false,
          brand_id: role.brand_id,
          team_id: role.team_id,
          team_name: role.team_name
        }
      }

      // Add specific team info if team_id provided
      if (team_id && role.has_access) {
        const { data: teamInfo, error: teamError } = await supabase
          .from('teams')
          .select(`
            id,
            name,
            brand_id,
            team_users!inner (
              role,
              user_id
            )
          `)
          .eq('id', team_id)
          .eq('team_users.user_id', user.id)
          .single()

        if (!teamError && teamInfo) {
          result.context.team_role = teamInfo.team_users.role
          result.context.team_name = teamInfo.name
          result.context.is_team_admin = teamInfo.team_users.role === 'admin'
        }
      }
    }

    console.log(`Access check for user ${user.id}: ${JSON.stringify(result)}`)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error checking access:', error)
    return new Response(
      JSON.stringify({
        success: false,
        has_access: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})