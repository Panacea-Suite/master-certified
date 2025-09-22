import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const QrRedirect: React.FC = () => {
  const { uniqueCode } = useParams<{ uniqueCode: string }>();
  const navigate = useNavigate();
  
  console.log('🎯 QrRedirect COMPONENT LOADED:', { 
    uniqueCode, 
    timestamp: new Date().toISOString(),
    fullURL: window.location.href
  });

  useEffect(() => {
    console.log('🚀 QrRedirect useEffect STARTING:', { uniqueCode });
    
    const redirectToFlow = async () => {
      console.log('🔄 QrRedirect: Starting redirect flow for:', uniqueCode);
      
      if (!uniqueCode) {
        console.log('❌ QrRedirect: No unique code, navigating to not-found');
        navigate('/not-found?error=missing-code');
        return;
      }

      try {
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
          .single();

        if (qrError || !qrData) {
          console.error('QR code not found:', qrError);
          navigate('/not-found?error=qr-not-found');
          return;
        }

        // ADD DATA STRUCTURE LOGGING
        console.log('🔍 QrRedirect: Raw data structure:', qrData);
        console.log('🔍 QrRedirect: Batches data:', qrData.batches);
        console.log('🔍 QrRedirect: Campaign data:', qrData.batches?.campaigns);

        // Increment scan count
        await supabase
          .from('qr_codes')
          .update({ scans: qrData.scans + 1 })
          .eq('id', qrData.id);

        // Get campaign data with proper extraction and logging
        let campaign = null;
        // Try different extraction methods based on data structure
        if (qrData.batches) {
          if (Array.isArray(qrData.batches) && qrData.batches.length > 0) {
            campaign = qrData.batches[0].campaigns;
          } else if (qrData.batches.campaigns) {
            campaign = qrData.batches.campaigns;
          }
        }

        console.log('🔍 QrRedirect: Extracted campaign:', campaign);

        if (campaign) {
          // Navigate to customer flow with the campaign ID and access token
          const params = new URLSearchParams();
          params.set('cid', campaign.id);
          if (campaign.customer_access_token) {
            params.set('ct', campaign.customer_access_token);
          }
          params.set('qr', uniqueCode);
          
          const flowUrl = `/flow/run?${params.toString()}`;
          console.log(`✅ QrRedirect: Redirecting to customer flow: ${flowUrl}`);
          navigate(flowUrl);
          return;
        }

        console.log('❌ QrRedirect: No campaign found in data structure');

        // Fallback to final redirect URL if configured
        const finalRedirectUrl = campaign?.final_redirect_url;
        if (finalRedirectUrl) {
          console.log(`Redirecting to final URL: ${finalRedirectUrl}`);
          window.location.href = finalRedirectUrl;
          return;
        }

        // Ultimate fallback - redirect to not-found instead of home
        console.log('❌ QrRedirect: No redirect options found, going to not-found');
        navigate('/not-found?error=no-campaign-data');

      } catch (error) {
        console.error('Error processing QR redirect:', error);
        navigate('/not-found?error=processing-error');
      }
    };

    redirectToFlow();
  }, [uniqueCode, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};