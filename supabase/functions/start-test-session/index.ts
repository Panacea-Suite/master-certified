import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';
import * as jose from 'https://deno.land/x/jose@v5.6.3/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  console.log(`[${new Date().toISOString()}] start-test-session request: ${req.method} ${req.url}`);
  
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
    
    console.log('Environment check:', {
      supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
      supabaseServiceKey: supabaseServiceKey ? 'SET' : 'MISSING',
      testLinkSecret: testLinkSecret ? 'SET' : 'MISSING'
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

    // Parse request body
    console.log('Parsing request body...');
    const body = await req.json();
    const { token } = body;
    
    console.log('Request payload:', { hasToken: !!token });

    if (!token) {
      console.error('Missing token');
      return new Response(
        JSON.stringify({ error: 'Missing test token' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify JWT token with HMAC
    console.log('Verifying JWT token...');
    const secret = new TextEncoder().encode(testLinkSecret);
    let payload: any;
    
    try {
      const { payload: tokenPayload } = await jose.jwtVerify(token, secret);
      payload = tokenPayload;
      console.log('Token verified successfully:', { 
        mode: payload.mode, 
        campaign_id: payload.campaign_id,
        exp: payload.exp,
        created_by: payload.created_by
      });
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired test token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate token payload
    if (payload.mode !== 'test') {
      console.error('Invalid token mode:', payload.mode);
      return new Response(
        JSON.stringify({ error: 'Invalid test token mode' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!payload.campaign_id) {
      console.error('Missing campaign_id in token');
      return new Response(
        JSON.stringify({ error: 'Test token missing campaign_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!payload.qr_id) {
      console.error('Missing qr_id in token');
      return new Response(
        JSON.stringify({ error: 'Test token missing qr_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify campaign exists
    console.log('Verifying campaign exists:', payload.campaign_id);
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name, brand_id')
      .eq('id', payload.campaign_id)
      .single();

    if (campaignError || !campaign) {
      console.error('Campaign verification failed:', { campaignError, campaign });
      return new Response(
        JSON.stringify({ error: 'Campaign not found or not accessible' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Campaign verified:', campaign.name);

    // Create test flow session directly with service role
    console.log('Creating test flow session...');
    const { data: session, error: sessionError } = await supabase
      .from('flow_sessions')
      .insert({
        qr_id: payload.qr_id,
        campaign_id: payload.campaign_id,
        brand_id: campaign.brand_id,
        status: 'active',
        is_test: true,
        created_by_admin: payload.created_by
      })
      .select('id')
      .single();

    if (sessionError) {
      console.error('Failed to create test session:', sessionError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create test session',
          details: sessionError.message,
          code: sessionError.code
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Test session created successfully:', session.id);

    const successResponse = {
      success: true,
      session_id: session.id,
      campaign_id: payload.campaign_id,
      brand_id: campaign.brand_id,
      is_test: true
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
    console.error('Unhandled error in start-test-session:', error);
    
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