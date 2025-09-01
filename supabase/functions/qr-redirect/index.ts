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
            id,
            name,
            final_redirect_url,
            customer_access_token,
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
      // Redirect to the app with an error message
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          'Location': `${new URL(req.url).origin}/#/not-found?error=qr-not-found`
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

    // Get campaign and flow data
    const campaign = qrData.batches?.campaigns
    const flow = campaign?.flows?.[0]
    
    if (campaign) {
      // Create customer flow URL with the campaign ID and access token
      const baseUrl = new URL(req.url).origin
      const flowUrl = new URL(`${baseUrl}/#/flow/run/${campaign.id}`)
      
      // Add the customer access token and unique code for tracking
      if (campaign.customer_access_token) {
        flowUrl.searchParams.set('token', campaign.customer_access_token)
      }
      flowUrl.searchParams.set('qr', uniqueCode)
      
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