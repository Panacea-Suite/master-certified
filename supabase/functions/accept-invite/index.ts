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

    // Parse request body
    const { invite_token, user_id } = await req.json()

    if (!invite_token) {
      throw new Error('invite_token is required')
    }

    if (!user_id) {
      throw new Error('user_id is required')
    }

    // Get invite info
    const { data: invite, error: inviteError } = await supabase
      .from('user_invites')
      .select(`
        id,
        email,
        team_id,
        brand_id,
        role,
        expires_at,
        accepted_at,
        teams!inner (
          id,
          name,
          brands!inner (
            id,
            name
          )
        )
      `)
      .eq('invite_token', invite_token)
      .single()

    if (inviteError || !invite) {
      throw new Error('Invalid or expired invitation')
    }

    if (invite.accepted_at) {
      throw new Error('Invitation has already been accepted')
    }

    if (new Date(invite.expires_at) < new Date()) {
      throw new Error('Invitation has expired')
    }

    // Verify the user exists and matches the invited email
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('user_id, email')
      .eq('user_id', user_id)
      .single()

    if (userError || !user) {
      throw new Error('User not found')
    }

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new Error('User email does not match invitation email')
    }

    // Check if user is already in a different brand
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
      .eq('user_id', user_id)
      .neq('teams.brand_id', invite.brand_id)

    if (!membershipError && existingMembership && existingMembership.length > 0) {
      const otherBrand = existingMembership[0].teams.brands
      throw new Error(`User is already a member of another brand: ${otherBrand.name}`)
    }

    // Check if user is already in this team
    const { data: existingTeamMember, error: teamMemberError } = await supabase
      .from('team_users')
      .select('id')
      .eq('user_id', user_id)
      .eq('team_id', invite.team_id)
      .maybeSingle()

    if (!teamMemberError && existingTeamMember) {
      // Mark invite as accepted and return success
      await supabase
        .from('user_invites')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invite.id)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'User is already a member of this team',
          user_id: user_id,
          team_id: invite.team_id,
          role: invite.role,
          already_member: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // Add user to team
    const { data: teamUser, error: teamUserError } = await supabase
      .from('team_users')
      .insert({
        team_id: invite.team_id,
        user_id: user_id,
        role: invite.role,
        invited_by: invite.invited_by
      })
      .select('id')
      .single()

    if (teamUserError) {
      console.error('Team user creation error:', teamUserError)
      throw new Error(`Failed to add user to team: ${teamUserError.message}`)
    }

    // Mark invitation as accepted
    const { error: updateInviteError } = await supabase
      .from('user_invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    if (updateInviteError) {
      console.error('Invite update error:', updateInviteError)
      // Non-fatal error, don't throw
    }

    // Log the action
    await supabase
      .from('audit_log')
      .insert({
        actor: user_id,
        action: 'accept_brand_invite',
        object_type: 'team',
        object_id: invite.team_id,
        meta: {
          invite_id: invite.id,
          role: invite.role,
          brand_id: invite.brand_id,
          team_name: invite.teams.name,
          brand_name: invite.teams.brands.name
        }
      })

    console.log(`User ${user_id} accepted invitation to join team ${invite.team_id} as ${invite.role}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation accepted successfully',
        user_id: user_id,
        team_id: invite.team_id,
        team_user_id: teamUser.id,
        role: invite.role,
        brand_id: invite.brand_id,
        team_name: invite.teams.name,
        brand_name: invite.teams.brands.name
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error accepting invitation:', error)
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