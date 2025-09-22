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
        // Step 1: Get QR code and batch ID
        console.log('📡 QrRedirect: Step 1 - Getting QR code data...');
        const { data: qrData, error: qrError } = await supabase
          .from('qr_codes')
          .select('id, batch_id, scans, unique_code')
          .eq('unique_code', uniqueCode)
          .single();

        if (qrError || !qrData) {
          console.error('❌ QrRedirect: QR code not found:', qrError);
          navigate('/not-found?error=qr-not-found');
          return;
        }

        console.log('✅ QrRedirect: QR code found:', qrData);

        // Step 2: Get batch and campaign ID
        console.log('📡 QrRedirect: Step 2 - Getting batch data...');
        const { data: batchData, error: batchError } = await supabase
          .from('batches')
          .select('id, campaign_id')
          .eq('id', qrData.batch_id)
          .single();

        if (batchError || !batchData) {
          console.error('❌ QrRedirect: Batch not found:', batchError);
          navigate('/not-found?error=batch-not-found');
          return;
        }

        console.log('✅ QrRedirect: Batch found:', batchData);

        // Step 3: Get campaign data
        console.log('📡 QrRedirect: Step 3 - Getting campaign data...');
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('id, name, customer_access_token, final_redirect_url')
          .eq('id', batchData.campaign_id)
          .single();

        if (campaignError || !campaignData) {
          console.error('❌ QrRedirect: Campaign not found:', campaignError);
          navigate('/not-found?error=campaign-not-found');
          return;
        }

        console.log('✅ QrRedirect: Campaign found:', campaignData);

        // Step 4: Increment scan count
        console.log('📊 QrRedirect: Step 4 - Updating scan count...');
        await supabase
          .from('qr_codes')
          .update({ scans: qrData.scans + 1 })
          .eq('id', qrData.id);

        // Use campaignData directly (no extraction needed)
        const campaign = campaignData;
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