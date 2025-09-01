import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function extractCode(url: URL): string | null {
  // 1) Query string
  const q = url.searchParams.get("code");
  if (q && q.trim()) return decodeURIComponent(q.trim());

  // 2) Path segment after 'qr-redirect'
  // Works for both:
  //   /functions/v1/qr-redirect/<code>
  //   /qr-redirect/<code>
  const parts = url.pathname.split("/").filter(Boolean);
  const i = parts.lastIndexOf("qr-redirect");
  if (i >= 0 && parts[i + 1]) return decodeURIComponent(parts[i + 1]);

  return null;
}

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), {
    status: s,
    headers: { "content-type": "application/json" },
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Health check for easy debugging
  if (url.searchParams.get("health") === "1") {
    return new Response("ok", { status: 200 });
  }

  const code = extractCode(url);
  if (!code) {
    return json(
      {
        error: "requested path is invalid",
        debug: {
          pathname: url.pathname,
          search: url.search,
          parts: url.pathname.split("/").filter(Boolean),
        },
      },
      400
    );
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`QR redirect request for code: ${code}`)

    // Look up the QR code in the database, joining to batch → campaign
    const { data: qrData, error: qrError } = await supabase
      .from('qr_codes')
      .select(`
        id,
        unique_code,
        scans,
        batches!inner (
          id,
          campaign_id,
          campaigns!inner (
            id,
            name,
            final_redirect_url,
            customer_access_token
          )
        )
      `)
      .eq('unique_code', code)
      .maybeSingle()

    if (qrError || !qrData) {
      console.error('QR code not found:', qrError)
      // Redirect to the app with an error message
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${new URL(req.url).origin}/#/not-found?error=qr-not-found`
        }
      })
    }

    // Best-effort increment scan count
    try {
      const { error: updateError } = await supabase
        .from('qr_codes')
        .update({ scans: qrData.scans + 1 })
        .eq('id', qrData.id)

      if (updateError) {
        console.error('Failed to update scan count (non-blocking):', updateError)
      }
    } catch (scanError) {
      console.error('Scan count update failed (non-blocking):', scanError)
    }

    // Get campaign data from the joined result
    const campaign = qrData.batches?.campaigns
    
    if (campaign) {
      // Create customer flow URL: https://<app-origin>/#/flow/run?cid=<campaign_id>&qr=<qr_id>&ct=<customer_access_token>
      const appOrigin = 'https://certified-flow-core.lovable.app' // Use your actual app origin
      const flowUrl = new URL(`${appOrigin}/#/flow/run`)
      
      // Add required parameters
      flowUrl.searchParams.set('cid', campaign.id)
      flowUrl.searchParams.set('qr', qrData.id)
      if (campaign.customer_access_token) {
        flowUrl.searchParams.set('ct', campaign.customer_access_token)
      }
      
      console.log(`Redirecting to customer flow: ${flowUrl.toString()}`)
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': flowUrl.toString()
        }
      })
    }

    // Fallback to final redirect URL if configured
    const finalRedirectUrl = campaign?.final_redirect_url
    if (finalRedirectUrl) {
      console.log(`Redirecting to final URL: ${finalRedirectUrl}`)
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': finalRedirectUrl
        }
      })
    }

    // Ultimate fallback - redirect to app home
    console.log('No redirect URL found, using app home')
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': `${new URL(req.url).origin}/#/`
      }
    })

  } catch (error) {
    console.error('Error in qr-redirect function:', error)
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})