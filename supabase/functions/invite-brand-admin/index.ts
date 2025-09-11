import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Verify the user is authenticated and is a master admin
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      throw new Error('Authentication failed')
    }

    // Check if user is master admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'master_admin') {
      throw new Error('Access denied: only master admins can invite brand admins')
    }

    // Parse request body
    const { user_email, user_id, team_id, role = 'admin' } = await req.json()

    if (!team_id) {
      throw new Error('team_id is required')
    }

    if (!user_email && !user_id) {
      throw new Error('Either user_email or user_id is required')
    }

    // Get team and brand info
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .select(`
        id,
        name,
        brand_id,
        brands!inner (
          id,
          name,
          user_id
        )
      `)
      .eq('id', team_id)
      .single()

    if (teamError || !team) {
      throw new Error('Team not found')
    }

    let targetUserId = user_id
    let targetUserEmail = user_email

    // If user_id provided, verify user exists and get their email
    if (user_id) {
      const { data: targetUser, error: userError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .eq('user_id', user_id)
        .single()

      if (userError || !targetUser) {
        throw new Error('Target user not found')
      }
      targetUserEmail = targetUser.email
    }

    // If only email provided, check if user already exists
    if (user_email && !user_id) {
      const { data: existingUser, error: existingUserError } = await supabase
        .from('profiles')
        .select('user_id, email')
        .eq('email', user_email)
        .maybeSingle()

      if (!existingUserError && existingUser) {
        targetUserId = existingUser.user_id
      }
    }

    // Check if user is already in a different brand
    if (targetUserId) {
      const { data: existingMembership, error: membershipError } = await supabase
        .from('team_users')
        .select(`
          id,
          team_id,
          teams!inner (
            brand_id,
            brands!inner (
              id,
              name
            )
          )
        `)
        .eq('user_id', targetUserId)
        .neq('teams.brand_id', team.brand_id)

      if (!membershipError && existingMembership && existingMembership.length > 0) {
        const otherBrand = existingMembership[0].teams.brands
        throw new Error(`User is already a member of another brand: ${otherBrand.name}`)
      }

      // Check if user is already in this team
      const { data: existingTeamMember, error: teamMemberError } = await supabase
        .from('team_users')
        .select('id, role')
        .eq('user_id', targetUserId)
        .eq('team_id', team_id)
        .maybeSingle()

      if (!teamMemberError && existingTeamMember) {
        return new Response(
          JSON.stringify({
            success: true,
            message: 'User is already a member of this team',
            user_id: targetUserId,
            team_id: team_id,
            role: existingTeamMember.role,
            already_member: true
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }

    let result: any = {
      success: true,
      team_id: team_id,
      role: role
    }

    if (targetUserId) {
      // User exists - add them directly to the team
      const { data: teamUser, error: teamUserError } = await supabase
        .from('team_users')
        .insert({
          team_id: team_id,
          user_id: targetUserId,
          role: role,
          invited_by: user.id
        })
        .select('id')
        .single()

      if (teamUserError) {
        console.error('Team user creation error:', teamUserError)
        throw new Error(`Failed to add user to team: ${teamUserError.message}`)
      }

      result = {
        ...result,
        user_id: targetUserId,
        team_user_id: teamUser.id,
        message: 'User successfully added to team'
      }

      console.log(`User ${targetUserId} added to team ${team_id} as ${role}`)
    } else {
      // User doesn't exist - create an invitation
      const { data: invite, error: inviteError } = await supabase
        .from('user_invites')
        .insert({
          email: targetUserEmail,
          team_id: team_id,
          brand_id: team.brand_id,
          role: role,
          invited_by: user.id
        })
        .select('id, invite_token')
        .single()

      if (inviteError) {
        console.error('Invite creation error:', inviteError)
        throw new Error(`Failed to create invitation: ${inviteError.message}`)
      }

      result = {
        ...result,
        invite_id: invite.id,
        invite_token: invite.invite_token,
        email: targetUserEmail,
        message: 'Invitation created successfully'
      }

      console.log(`Invitation created for ${targetUserEmail} to join team ${team_id} as ${role}`)
    }

    // Log the action
    await supabase
      .from('audit_log')
      .insert({
        actor: user.id,
        action: 'invite_brand_admin',
        object_type: 'team',
        object_id: team_id,
        meta: {
          target_user_id: targetUserId,
          target_email: targetUserEmail,
          role: role,
          brand_id: team.brand_id,
          team_name: team.name,
          brand_name: team.brands.name,
          invitation: !targetUserId
        }
      })

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error inviting brand admin:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})