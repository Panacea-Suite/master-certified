import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has master_admin role
    const { data: hasRole, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'master_admin'
    });

    if (roleError || !hasRole) {
      return new Response(
        JSON.stringify({ error: 'Access denied: master_admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { flow_id } = await req.json();

    if (!flow_id) {
      return new Response(
        JSON.stringify({ error: 'flow_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get flow with published snapshot
    const { data: flowData, error: flowError } = await supabase
      .from('flows')
      .select(`
        id,
        name,
        published_snapshot,
        latest_published_version,
        campaign_id,
        campaigns!inner(
          brand_id,
          brands!inner(
            id,
            name,
            logo_url,
            brand_colors
          )
        )
      `)
      .eq('id', flow_id)
      .single();

    if (flowError || !flowData) {
      return new Response(
        JSON.stringify({ error: 'Flow not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!flowData.published_snapshot) {
      return new Response(
        JSON.stringify({ error: 'Flow has no published version. Please publish the flow first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const brandData = flowData.campaigns.brands;

    // Create ephemeral campaign from published flow
    const campaignName = `_Test / ${flowData.name} / ${new Date().toISOString()}`;
    
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        name: campaignName,
        description: `Ephemeral test campaign for flow: ${flowData.name}`,
        brand_id: brandData.id,
        template_version: flowData.latest_published_version,
        locked_template: flowData.published_snapshot,
        locked_design_tokens: brandData.brand_colors,
        approved_stores: ['Test Store A', 'Test Store B', 'Test Store C'],
        is_test: true
      })
      .select()
      .single();

    if (campaignError) {
      console.error('Campaign creation error:', campaignError);
      return new Response(
        JSON.stringify({ error: 'Failed to create campaign', details: campaignError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a test batch
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .insert({
        campaign_id: campaign.id,
        name: '_Test Batch',
        status: 'generated',
        qr_code_count: 1,
        generated_at: new Date().toISOString(),
        is_test: true
      })
      .select()
      .single();

    if (batchError) {
      console.error('Batch creation error:', batchError);
      return new Response(
        JSON.stringify({ error: 'Failed to create batch', details: batchError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create test QR code
    const uniqueCode = `test_flow_${crypto.randomUUID().split('-')[0]}`;
    
    const { data: qrCode, error: qrError } = await supabase
      .from('qr_codes')
      .insert({
        batch_id: batch.id,
        unique_code: uniqueCode,
        qr_url: `https://test-qr.example.com/${uniqueCode}`,
        is_test: true
      })
      .select()
      .single();

    if (qrError) {
      console.error('QR code creation error:', qrError);
      return new Response(
        JSON.stringify({ error: 'Failed to create QR code', details: qrError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        campaign_id: campaign.id,
        qr_id: qrCode.id,
        batch_id: batch.id,
        template_version: flowData.latest_published_version
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in create-ephemeral-from-flow:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});