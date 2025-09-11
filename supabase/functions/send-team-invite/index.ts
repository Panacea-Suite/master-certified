import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import React from 'npm:react@18.3.1'
import { TeamInviteEmail } from './_templates/team-invite.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

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
    const { invitee_email, team_id, role = 'member' } = await req.json()

    if (!invitee_email || !team_id) {
      throw new Error('invitee_email and team_id are required')
    }

    if (!['admin', 'member', 'viewer'].includes(role)) {
      throw new Error('Invalid role. Must be admin, member, or viewer')
    }

    // Get team and brand information
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

    // Check if user has permission to invite (brand owner, team admin, or master admin)
    const { data: roleInfo, error: roleError } = await supabase
      .rpc('get_effective_role', {
        p_user_id: user.id,
        p_brand_id: team.brand_id
      })

    if (roleError) {
      throw new Error('Failed to check user permissions')
    }

    const canInvite = roleInfo.effective_role === 'master_admin' ||
                     roleInfo.is_brand_owner ||
                     (roleInfo.is_team_member && roleInfo.effective_role === 'admin')

    if (!canInvite) {
      throw new Error('Access denied: only brand owners and team admins can invite users')
    }

    // Get inviter profile info
    const { data: inviterProfile, error: inviterError } = await supabase
      .from('profiles')
      .select('display_name, email')
      .eq('user_id', user.id)
      .single()

    if (inviterError || !inviterProfile) {
      throw new Error('Inviter profile not found')
    }

    let targetUserId: string | null = null
    let targetUserName: string | null = null

    // Check if invitee already exists
    const { data: existingUser, error: existingUserError } = await supabase
      .from('profiles')
      .select('user_id, email, display_name')
      .eq('email', invitee_email.toLowerCase())
      .maybeSingle()

    if (!existingUserError && existingUser) {
      targetUserId = existingUser.user_id
      targetUserName = existingUser.display_name

      // Check if user is already in this team
      const { data: existingMember, error: memberError } = await supabase
        .from('team_users')
        .select('id, role')
        .eq('user_id', targetUserId)
        .eq('team_id', team_id)
        .maybeSingle()

      if (!memberError && existingMember) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'User is already a member of this team',
            existing_role: existingMember.role
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      }

      // Check if user is in a different brand
      const { data: otherBrandMembership, error: otherBrandError } = await supabase
        .from('team_users')
        .select(`
          id,
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

      if (!otherBrandError && otherBrandMembership && otherBrandMembership.length > 0) {
        const otherBrand = otherBrandMembership[0].teams.brands
        throw new Error(`User is already a member of another brand: ${otherBrand.name}`)
      }

      // Add user directly to team
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
        throw new Error(`Failed to add user to team: ${teamUserError.message}`)
      }

      // Log the action
      await supabase
        .from('audit_log')
        .insert({
          actor: user.id,
          action: 'add_team_member_direct',
          object_type: 'team',
          object_id: team_id,
          meta: {
            target_user_id: targetUserId,
            target_email: invitee_email,
            role: role,
            brand_id: team.brand_id,
            team_name: team.name,
            brand_name: team.brands.name
          }
        })

      console.log(`User ${targetUserId} added directly to team ${team_id} as ${role}`)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'User added to team successfully',
          user_id: targetUserId,
          team_id: team_id,
          role: role,
          added_directly: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    // User doesn't exist - create invitation
    // Check for existing invitation
    const { data: existingInvite, error: existingInviteError } = await supabase
      .from('user_invites')
      .select('id, expires_at')
      .eq('email', invitee_email.toLowerCase())
      .eq('team_id', team_id)
      .is('accepted_at', null)
      .maybeSingle()

    if (!existingInviteError && existingInvite) {
      // Check if existing invite is still valid
      if (new Date(existingInvite.expires_at) > new Date()) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'An active invitation already exists for this email and team'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          },
        )
      } else {
        // Delete expired invite
        await supabase
          .from('user_invites')
          .delete()
          .eq('id', existingInvite.id)
      }
    }

    // Create new invitation
    const { data: invite, error: inviteError } = await supabase
      .from('user_invites')
      .insert({
        email: invitee_email.toLowerCase(),
        team_id: team_id,
        brand_id: team.brand_id,
        role: role,
        invited_by: user.id
      })
      .select('id, invite_token')
      .single()

    if (inviteError) {
      throw new Error(`Failed to create invitation: ${inviteError.message}`)
    }

    // Prepare email
    const appUrl = Deno.env.get('APP_BASE_URL') || 'https://app.example.com'
    const inviteUrl = `${appUrl}/accept-invite?token=${invite.invite_token}`

    // Render email template
    const emailHtml = await renderAsync(
      React.createElement(TeamInviteEmail, {
        invitee_name: targetUserName,
        inviter_name: inviterProfile.display_name || inviterProfile.email,
        team_name: team.name,
        brand_name: team.brands.name,
        role: role,
        invite_url: inviteUrl,
        app_url: appUrl
      })
    )

    // Send email in background
    EdgeRuntime.waitUntil(
      (async () => {
        try {
          const emailResult = await resend.emails.send({
            from: `${team.brands.name} <noreply@resend.dev>`,
            to: [invitee_email],
            subject: `You're invited to join ${team.name} at ${team.brands.name}`,
            html: emailHtml,
          })

          console.log('Invitation email sent:', emailResult)
        } catch (emailError) {
          console.error('Failed to send invitation email:', emailError)
          // Update invite record to indicate email failed
          await supabase
            .from('user_invites')
            .update({ 
              updated_at: new Date().toISOString(),
              // Could add an email_sent field to track this
            })
            .eq('id', invite.id)
        }
      })()
    )

    // Log the action
    await supabase
      .from('audit_log')
      .insert({
        actor: user.id,
        action: 'send_team_invite',
        object_type: 'team',
        object_id: team_id,
        meta: {
          target_email: invitee_email,
          role: role,
          brand_id: team.brand_id,
          team_name: team.name,
          brand_name: team.brands.name,
          invite_id: invite.id
        }
      })

    console.log(`Team invitation sent to ${invitee_email} for team ${team_id} as ${role}`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation sent successfully',
        invite_id: invite.id,
        team_id: team_id,
        role: role,
        email_sent: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error sending team invitation:', error)
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