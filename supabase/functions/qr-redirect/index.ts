import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function extractCode(url: URL): string | null {
  // Prefer query ?code=...
  const q = url.searchParams.get("code");
  if (q && q.trim()) return decodeURIComponent(q.trim());

  // Robust path match: works for /functions/v1/qr-redirect/<code> and /qr-redirect/<code>
  const m = url.pathname.match(/\/qr-redirect\/([^/?#]+)/);
  if (m?.[1]) return decodeURIComponent(m[1]);

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

  // --- TEMP DEBUG: returns env + QR lookup result without redirect ---
  if (url.searchParams.get("debug") === "1") {
    const SUPA_URL =
      Deno.env.get("EDGE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
    const SUPA_ANON =
      Deno.env.get("EDGE_SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
    const APP_ORIGIN =
      Deno.env.get("EDGE_APP_ORIGIN") ?? Deno.env.get("APP_PUBLIC_ORIGIN");
    const DB_BRANCH = Deno.env.get("EDGE_DB_BRANCH");

    const code =
      url.searchParams.get("code") ??
      url.pathname.split("/").filter(Boolean).pop() ??
      "";

    const db = createClient(SUPA_URL ?? "", SUPA_ANON ?? "", {
      global: {
        headers: DB_BRANCH ? { "x-supabase-branch": DB_BRANCH } : {},
      },
    });
    const { data, error } = SUPA_URL && SUPA_ANON && code
      ? await db.from("qr_codes")
          .select("id,unique_code,batch_id")
          .eq("unique_code", code)
          .maybeSingle()
      : { data: null, error: "missing env or code" };

    return new Response(
      JSON.stringify(
        {
          fingerprint: {
            url_ok: !!SUPA_URL,
            anon_prefix: SUPA_ANON ? SUPA_ANON.slice(0, 12) : null,
            app_origin: APP_ORIGIN ?? null,
            code_received: code || null,
          },
          lookup: { data, error },
        },
        null,
        2
      ),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  }
  // --- END TEMP DEBUG ---

  if (url.searchParams.get("health") === "1") return new Response("ok");

  const code = extractCode(url);

  if (!code) {
    const debug = {
      req_url: req.url,
      pathname: url.pathname,
      search: url.search,
      path_parts: url.pathname.split("/").filter(Boolean),
      note: "No code parsed from path or query",
    };
    console.error("QR code not found (no code)", debug);
    return new Response(JSON.stringify({ error: "missing_code", debug }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  console.log("Extracted QR code:", code);

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('EDGE_SUPABASE_URL') ?? Deno.env.get('SUPABASE_URL')
    const supabaseKey = Deno.env.get('EDGE_SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')
    const dbBranch = Deno.env.get('EDGE_DB_BRANCH')
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables')
      return new Response('Configuration error', { 
        status: 500, 
        headers: corsHeaders 
      })
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: dbBranch ? { "x-supabase-branch": dbBranch } : {},
      },
    })

    console.log(`QR redirect request for code: ${code}`)

    // Look up the QR code in the database, joining to batch → campaign
    const { data: qr, error } = await supabase
      .from("qr_codes")
      .select(`
        id, 
        unique_code, 
        batch_id, 
        scans, 
        batches!inner(
          campaign_id,
          campaigns!inner(
            id,
            name,
            final_redirect_url,
            customer_access_token
          )
        )
      `)
      .eq("unique_code", code)
      .single();
      
    if (error || !qr) {
      console.error(`QR not found by unique_code`, { code, error });
      const appOrigin = Deno.env.get('EDGE_APP_ORIGIN') ?? 'https://7d6ac784-8fa0-4a08-b762-40e95bd7844c.sandbox.lovable.dev';
      const fallbackUrl = new URL(`${appOrigin}/#/`);
      fallbackUrl.searchParams.set('qr_error', '1');
      fallbackUrl.searchParams.set('code', code);
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': fallbackUrl.toString(),
        }
      });
    }

    // Best-effort increment scan count
    try {
      const { error: updateError } = await supabase
        .from('qr_codes')
        .update({ scans: qr.scans + 1 })
        .eq('id', qr.id)

      if (updateError) {
        console.error('Failed to update scan count (non-blocking):', updateError)
      }
    } catch (scanError) {
      console.error('Scan count update failed (non-blocking):', scanError)
    }

    // Get campaign data from the joined result
    const campaign = qr.batches?.campaigns
    
    if (campaign) {
      // Create customer flow URL: https://<app-origin>/#/flow/run?cid=<campaign_id>&qr=<qr_id>&ct=<customer_access_token>
      const appOrigin = Deno.env.get('EDGE_APP_ORIGIN') ?? 'https://7d6ac784-8fa0-4a08-b762-40e95bd7844c.sandbox.lovable.dev'
      const flowUrl = new URL(`${appOrigin}/#/flow/run`)
      
      // Add required parameters
      flowUrl.searchParams.set('cid', campaign.id)
      flowUrl.searchParams.set('qr', qr.id)
      if (campaign.customer_access_token) {
        flowUrl.searchParams.set('ct', campaign.customer_access_token)
      }
      
      console.log(JSON.stringify({
        resolved_code: code,
        campaign_id: campaign.id,
        qr_id: qr.id,
        redirect_to: flowUrl.toString(),
      }, null, 2));
      
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