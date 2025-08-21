import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  console.log(`[${new Date().toISOString()}] Purge ephemeral campaigns request: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('CORS preflight request handled');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log('Environment check:', {
      supabaseUrl: supabaseUrl ? 'SET' : 'MISSING',
      supabaseServiceKey: supabaseServiceKey ? 'SET' : 'MISSING'
    });

    if (!supabaseUrl || !supabaseServiceKey) {
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

    // Parse request body to get days_old parameter (optional)
    let daysOld = 7; // default
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        if (body.days_old && typeof body.days_old === 'number') {
          daysOld = body.days_old;
        }
      } catch (e) {
        // Ignore JSON parse errors, use default
        console.log('Using default days_old:', daysOld);
      }
    }

    console.log('Cleaning up ephemeral campaigns older than', daysOld, 'days');

    // Call the cleanup function
    const { data: cleanupResult, error: cleanupError } = await supabase
      .rpc('cleanup_ephemeral_campaigns', { days_old: daysOld });

    console.log('Cleanup result:', { cleanupResult, cleanupError });

    if (cleanupError) {
      console.error('Cleanup failed:', cleanupError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to cleanup ephemeral campaigns',
          details: cleanupError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Cleanup completed successfully');
    
    const successResponse = {
      success: true,
      message: 'Ephemeral campaigns cleanup completed',
      deleted_campaigns: cleanupResult?.deleted_campaigns || 0,
      cutoff_date: cleanupResult?.cutoff_date,
      days_old: daysOld
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
    console.error('Unhandled error in purge-ephemeral-campaigns:', error);
    
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