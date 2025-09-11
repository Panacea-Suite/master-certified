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
      throw new Error('Access denied: only master admins can create customer brands')
    }

    // Parse request body
    const { brand_name, logo_url, created_by_user_id, team_name } = await req.json()

    if (!brand_name) {
      throw new Error('brand_name is required')
    }

    if (!created_by_user_id) {
      throw new Error('created_by_user_id is required')
    }

    // Verify the target user exists
    const { data: targetUser, error: userError } = await supabase
      .from('profiles')
      .select('user_id, email')
      .eq('user_id', created_by_user_id)
      .single()

    if (userError || !targetUser) {
      throw new Error('Target user not found')
    }

    // Create the brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .insert({
        name: brand_name,
        logo_url: logo_url || null,
        user_id: created_by_user_id,
        approved_stores: ['Store A', 'Store B', 'Store C'] // Default approved stores
      })
      .select('id, name')
      .single()

    if (brandError) {
      console.error('Brand creation error:', brandError)
      throw new Error(`Failed to create brand: ${brandError.message}`)
    }

    // Create default team for the brand
    const defaultTeamName = team_name || 'Main Team'
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: defaultTeamName,
        brand_id: brand.id,
        created_by: created_by_user_id
      })
      .select('id, name')
      .single()

    if (teamError) {
      console.error('Team creation error:', teamError)
      // If team creation fails, we should clean up the brand
      await supabase.from('brands').delete().eq('id', brand.id)
      throw new Error(`Failed to create default team: ${teamError.message}`)
    }

    // Add the brand owner as team admin
    const { data: teamUser, error: teamUserError } = await supabase
      .from('team_users')
      .insert({
        team_id: team.id,
        user_id: created_by_user_id,
        role: 'admin',
        invited_by: user.id
      })
      .select('id')
      .single()

    if (teamUserError) {
      console.error('Team user creation error:', teamUserError)
      // Clean up brand and team if team user creation fails
      await supabase.from('teams').delete().eq('id', team.id)
      await supabase.from('brands').delete().eq('id', brand.id)
      throw new Error(`Failed to add brand owner to team: ${teamUserError.message}`)
    }

    // Log the action
    await supabase
      .from('audit_log')
      .insert({
        actor: user.id,
        action: 'create_customer_brand',
        object_type: 'brand',
        object_id: brand.id,
        meta: {
          brand_name,
          team_name: defaultTeamName,
          team_id: team.id,
          team_user_id: teamUser.id,
          owner_role: 'admin',
          target_user_id: created_by_user_id,
          target_user_email: targetUser.email
        }
      })

    console.log(`Brand and team created successfully: Brand ${brand.id}, Team ${team.id} for user ${created_by_user_id}`)

    return new Response(
      JSON.stringify({
        success: true,
        brand_id: brand.id,
        name: brand.name,
        team_id: team.id,
        team_name: team.name,
        team_user_id: teamUser.id,
        owner_role: 'admin'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error creating customer brand:', error)
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