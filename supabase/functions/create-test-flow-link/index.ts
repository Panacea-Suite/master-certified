import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import * as jose from 'https://deno.land/x/jose@v5.6.3/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  console.log(`[${new Date().toISOString()}] Request received: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const testLinkSecret = Deno.env.get('TEST_LINK_SECRET');
    const appBaseUrl = Deno.env.get('APP_BASE_URL');
    
    console.log('Environment check:', {
      supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
      supabaseServiceKey: supabaseServiceKey ? 'SET' : 'MISSING',
      testLinkSecret: testLinkSecret ? 'SET' : 'MISSING',
      appBaseUrl: appBaseUrl ? 'SET' : 'MISSING'
    });

    if (!supabaseUrl || !supabaseServiceKey || !testLinkSecret) {
      console.error('Missing required environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error: missing environment variables' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('Authorization header present:', authHeader ? 'YES' : 'NO');
    
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user's session
    const token = authHeader.replace('Bearer ', '');
    console.log('Verifying user token...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication failed:', { authError, hasUser: !!user });
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('User authenticated:', { userId: user.id, email: user.email });

    // Check if user is master_admin
    console.log('Checking user role...');
    const { data: hasRole, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'master_admin' });

    console.log('Role check result:', { hasRole, roleError });

    if (roleError) {
      console.error('Role check database error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify user permissions' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!hasRole) {
      console.error('Access denied: user is not master_admin');
      return new Response(
        JSON.stringify({ error: 'Access denied: master_admin role required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    console.log('Parsing request body...');
    const body = await req.json();
    const { template_id, campaign_id } = body;
    
    console.log('Request payload:', { template_id, campaign_id });

    if (!template_id && !campaign_id) {
      console.error('Invalid payload: missing both template_id and campaign_id');
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
      console.log('Validating campaign_id:', campaign_id);
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, name, brand_id')
        .eq('id', campaign_id)
        .single();

      console.log('Campaign validation result:', { campaign, campaignError });

      if (campaignError || !campaign) {
        console.error('Campaign not found:', { campaignError, campaign });
        return new Response(
          JSON.stringify({ error: 'Campaign not found or not accessible' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      console.log('Campaign validated:', campaign.name);
    }

    if (template_id) {
      console.log('Validating template_id:', template_id);
      const { data: template, error: templateError } = await supabase
        .from('templates')
        .select('id, name, kind, status')
        .eq('id', template_id)
        .single();

      console.log('Template validation result:', { template, templateError });

      if (templateError || !template) {
        console.error('Template not found:', { templateError, template });
        return new Response(
          JSON.stringify({ error: 'Template not found or not accessible' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Template found:', { name: template.name, kind: template.kind, status: template.status });

      // For system templates, allow draft templates only for master_admin
      if (template.kind === 'system' && template.status !== 'published' && !hasRole) {
        console.error('Access denied: system template not published and user not master_admin');
        return new Response(
          JSON.stringify({ error: 'System template must be published to test, or you must be a master admin' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      console.log('Template validation passed');
    }

    // Create JWT token
    console.log('Creating JWT token...');
    const secret = new TextEncoder().encode(testLinkSecret);
    const tokenPayload = {
      mode: 'test',
      template_id: template_id || null,
      campaign_id: campaign_id || null,
      created_by: user.id,
      exp: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    };

    console.log('Token payload:', tokenPayload);

    const token = await new jose.SignJWT(tokenPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .sign(secret);

    // Generate the test URL
    console.log('Generating test URL...');
    
    // Use APP_BASE_URL if set, otherwise fallback to derived URL
    let baseUrl;
    if (appBaseUrl) {
      baseUrl = appBaseUrl;
    } else {
      // Fallback to derived URL (replace 'functions' with 'app' in the origin)
      baseUrl = new URL(req.url).origin.replace('functions', 'app');
    }
    
    const testUrl = `${baseUrl}/test-flow?token=${token}`;
    console.log('Generated test URL:', testUrl);

    console.log('Test link created successfully');
    
    const successResponse = {
      success: true,
      url: testUrl,
      expires_in: 1800 // 30 minutes in seconds
    };
    
    console.log('Sending success response:', successResponse);

    return new Response(
      JSON.stringify(successResponse),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unhandled error in create-test-flow-link:', error);
    
    let errorMessage = 'Internal server error';
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});