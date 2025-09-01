import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Support session-based requests via POST body
    const method = req.method
    
    if (method === 'POST') {
      try {
        const body = await req.json()
        const sessionId = body?.session_id
        if (sessionId) {
          console.log(`Flow handler session request for session: ${sessionId}`)

          // Fetch session
          const { data: session, error: sessionError } = await supabase
            .from('flow_sessions')
            .select('id, qr_id, campaign_id')
            .eq('id', sessionId)
            .maybeSingle()

          if (sessionError || !session) {
            console.error('Session not found:', sessionError)
            return new Response('Invalid session', { status: 400, headers: corsHeaders })
          }

          // Fetch campaign with access token for validation
          const { data: campaign, error: campaignError } = await supabase
            .from('campaigns')
            .select('id, name, final_redirect_url, approved_stores, customer_access_token')
            .eq('id', session.campaign_id)
            .single()

          if (campaignError || !campaign) {
            console.error('Campaign fetch error:', campaignError)
            return new Response('Campaign not found', { status: 404, headers: corsHeaders })
          }

          // Fetch flow for campaign (most recent)
          const { data: flow, error: flowError } = await supabase
            .from('flows')
            .select('id, name, flow_config')
            .eq('campaign_id', campaign.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (flowError || !flow) {
            console.error('Flow fetch error:', flowError)
            return new Response('Flow not found for campaign', { status: 404, headers: corsHeaders })
          }

          // Fetch content (legacy)
          const { data: flowContent, error: contentError } = await supabase
            .from('flow_content')
            .select('*')
            .eq('flow_id', flow.id)
            .order('order_index')

          if (contentError) {
            console.error('Error fetching flow content:', contentError)
          }

          // Fetch QR code details if present
          let qrPayload: any = null
          if (session.qr_id) {
            const { data: qr, error: qrErr } = await supabase
              .from('qr_codes')
              .select('id, unique_code, scans')
              .eq('id', session.qr_id)
              .maybeSingle()
            if (qrErr) {
              console.warn('QR fetch warning:', qrErr)
            }
            if (qr) {
              qrPayload = { id: qr.id, unique_code: qr.unique_code, scans: qr.scans }
            }
          }

          const responseData = {
            flow: {
              id: flow.id,
              name: flow.name,
              config: flow.flow_config
            },
            campaign: {
              id: campaign.id,
              name: campaign.name,
              final_redirect_url: campaign.final_redirect_url,
              approved_stores: campaign.approved_stores
            },
            qr_code: qrPayload,
            content: flowContent || []
          }

          return new Response(JSON.stringify(responseData), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }
      } catch (e) {
        console.warn('No JSON body or failed parsing for POST request:', e)
      }
    }

    // Extract flow ID and unique code from URL path
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const flowId = pathParts[pathParts.length - 2]
    const uniqueCode = pathParts[pathParts.length - 1]
    
    // Get customer access token from headers or query params
    const accessToken = req.headers.get('x-customer-token') || url.searchParams.get('token')

    if (!flowId || !uniqueCode) {
      console.error('Missing flow ID or unique code')
      return new Response('Invalid flow URL', { status: 400, headers: corsHeaders })
    }

    console.log(`Flow handler request for flow: ${flowId}, code: ${uniqueCode}`)

    // Verify the QR code exists and belongs to this flow
    const { data: qrData, error: qrError } = await supabase
      .from('qr_codes')
      .select(`
        *,
        batches (
          campaigns (
            id,
            name,
            final_redirect_url,
            approved_stores,
            customer_access_token,
            flows!inner (
              id,
              name,
              flow_config
            )
          )
        )
      `)
      .eq('unique_code', uniqueCode)
      .eq('flow_id', flowId)
      .single()

    if (qrError || !qrData) {
      console.error('Invalid flow/QR code combination:', qrError)
      return new Response('Invalid flow link', { status: 400, headers: corsHeaders })
    }

    // Get flow content
    const { data: flowContent, error: contentError } = await supabase
      .from('flow_content')
      .select('*')
      .eq('flow_id', flowId)
      .order('order_index')

    if (contentError) {
      console.error('Error fetching flow content:', contentError)
    }

    const flow = qrData.batches?.campaigns?.flows?.[0]
    const campaign = qrData.batches?.campaigns

    // Validate customer access token for unauthenticated requests
    if (accessToken && campaign?.customer_access_token !== accessToken) {
      console.error('Invalid customer access token')
      return new Response('Unauthorized access', { status: 401, headers: corsHeaders })
    }

    // Return flow data for the frontend to render
    const responseData = {
      flow: {
        id: flow?.id,
        name: flow?.name,
        config: flow?.flow_config
      },
      campaign: {
        id: campaign?.id,
        name: campaign?.name,
        final_redirect_url: campaign?.final_redirect_url,
        approved_stores: campaign?.approved_stores
      },
      qr_code: {
        id: qrData.id,
        unique_code: qrData.unique_code,
        scans: qrData.scans
      },
      content: flowContent || []
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in flow-handler function:', error)
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    })
  }
})