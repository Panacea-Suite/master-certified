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

    // Extract unique code from URL path
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/')
    const uniqueCode = pathParts[pathParts.length - 1]

    if (!uniqueCode) {
      console.error('No unique code provided')
      return new Response('Invalid QR code', { status: 400, headers: corsHeaders })
    }

    console.log(`QR redirect request for code: ${uniqueCode}`)

    // Look up the QR code in the database
    const { data: qrData, error: qrError } = await supabase
      .from('qr_codes')
      .select(`
        *,
        batches (
          campaigns (
            final_redirect_url,
            flows (
              id,
              base_url
            )
          )
        )
      `)
      .eq('unique_code', uniqueCode)
      .single()

    if (qrError || !qrData) {
      console.error('QR code not found:', qrError)
      // Redirect to a default landing page
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': 'https://your-fallback-domain.com/not-found'
        }
      })
    }

    // Increment scan count
    const { error: updateError } = await supabase
      .from('qr_codes')
      .update({ scans: qrData.scans + 1 })
      .eq('id', qrData.id)

    if (updateError) {
      console.error('Failed to update scan count:', updateError)
    }

    // Check if we have a flow to redirect to
    const flow = qrData.batches?.campaigns?.flows?.[0]
    if (flow && qrData.unique_flow_url) {
      console.log(`Redirecting to flow: ${qrData.unique_flow_url}`)
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': qrData.unique_flow_url
        }
      })
    }

    // Fallback to final redirect URL if no flow
    const finalRedirectUrl = qrData.batches?.campaigns?.final_redirect_url
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

    // Ultimate fallback
    console.log('No redirect URL found, using fallback')
    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': 'https://your-fallback-domain.com/default'
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