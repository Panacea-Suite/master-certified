import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import * as jose from 'https://deno.land/x/jose@v5.6.3/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const testLinkSecret = Deno.env.get('TEST_LINK_SECRET')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user's session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user is master_admin
    const { data: hasRole, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'master_admin' });

    if (roleError || !hasRole) {
      console.log('Role check failed:', roleError, 'hasRole:', hasRole);
      return new Response(
        JSON.stringify({ error: 'Access denied: master_admin role required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const { template_id, campaign_id } = await req.json();

    if (!template_id && !campaign_id) {
      return new Response(
        JSON.stringify({ error: 'Either template_id or campaign_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate the provided IDs exist and are accessible
    if (campaign_id) {
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name, brand_id')
        .eq('id', campaign_id)
        .single();

      if (campaignError || !campaign) {
        return new Response(
          JSON.stringify({ error: 'Campaign not found or not accessible' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    if (template_id) {
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('id, name, kind, status')
        .eq('id', template_id)
        .single();

      if (templateError || !template) {
        return new Response(
          JSON.stringify({ error: 'Template not found or not accessible' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // For system templates, ensure they're published
      if (template.kind === 'system' && template.status !== 'published') {
        return new Response(
          JSON.stringify({ error: 'System template must be published to test' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Create JWT token
    const secret = new TextEncoder().encode(testLinkSecret);
    const payload = {
      mode: 'test',
      template_id: template_id || null,
      campaign_id: campaign_id || null,
      created_by: user.id,
      exp: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    };

    const token = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(secret);

    // Generate the test URL
    const baseUrl = new URL(req.url).origin.replace('functions', 'app'); // Replace with actual app domain
    const testUrl = `${baseUrl}/flow/test?token=${token}`;

    return new Response(
      JSON.stringify({ 
        success: true,
        url: testUrl,
        expires_in: 1800 // 30 minutes in seconds
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in create-test-flow-link:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});