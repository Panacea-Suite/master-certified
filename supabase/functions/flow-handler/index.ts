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

    // Extract flow ID and unique code from URL path
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const flowId = pathParts[pathParts.length - 2]
    const uniqueCode = pathParts[pathParts.length - 1]

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