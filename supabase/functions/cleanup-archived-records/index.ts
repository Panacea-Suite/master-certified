import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.54.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('Starting cleanup of archived records older than 30 days...');
    
    // Call the database function to cleanup old archived records
    const { data, error } = await supabase.rpc('cleanup_old_archived_records');
    
    if (error) {
      console.error('Error during cleanup:', error);
      throw error;
    }
    
    console.log('Cleanup completed successfully:', data);
    
    // Log the cleanup results for monitoring
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      deleted_counts: data.deleted_counts,
      cutoff_date: data.cutoff_date
    };
    
    return new Response(
      JSON.stringify(result),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    );
  } catch (error) {
    console.error('Cleanup function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        },
        status: 500
      }
    );
  }
});