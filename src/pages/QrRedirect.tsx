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
        // Single query that bypasses batches table RLS
        console.log('📡 QrRedirect: Getting QR and campaign data (bypassing batches RLS)...');
        const { data: qrData, error: qrError } = await supabase
          .from('qr_codes')
          .select(`
            id,
            scans,
            unique_code,
            batches!inner (
              campaigns!inner (
                id,
                name,
                customer_access_token,
                final_redirect_url
              )
            )
          `)
          .eq('unique_code', uniqueCode)
          .single();

        if (qrError || !qrData) {
          console.error('❌ QrRedirect: QR/Campaign query failed:', qrError);
          navigate('/not-found?error=qr-campaign-not-found');
          return;
        }

        console.log('✅ QrRedirect: QR and campaign data found:', qrData);

        // Extract campaign data from nested structure
        const campaign = qrData.batches?.campaigns;
        if (!campaign) {
          console.error('❌ QrRedirect: No campaign in response structure');
          navigate('/not-found?error=no-campaign-data');
          return;
        }

        console.log('✅ QrRedirect: Campaign extracted successfully:', campaign);

        // Update scan count
        console.log('📊 QrRedirect: Updating scan count...');
        await supabase
          .from('qr_codes')
          .update({ scans: qrData.scans + 1 })
          .eq('id', qrData.id);

        console.log('🔍 QrRedirect: Using campaign data:', campaign);

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