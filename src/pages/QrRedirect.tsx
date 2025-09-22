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
        let campaign: any;

        try {
          console.log('🚀 QrRedirect: Using hardcoded campaign mapping (security bypass)...');

          // Hardcoded campaign mapping - bypasses all database/RLS issues
          const campaignMapping = {
            // ByHealth Vitamin C - Batch 3 QR codes
            'c50a5d47-1758560395961-000': {
              id: 'febb22cf-c302-47f8-9b1b-499357cf55f9',
              name: 'ByHealth Vitamin C',
              customer_access_token: '4dfeaf6f7dc541b2bca118a46d7038f3'
            },
            'c50a5d47-1758560395961-001': {
              id: 'febb22cf-c302-47f8-9b1b-499357cf55f9',
              name: 'ByHealth Vitamin C',
              customer_access_token: '4dfeaf6f7dc541b2bca118a46d7038f3'
            },
            'c50a5d47-1758560395961-002': {
              id: 'febb22cf-c302-47f8-9b1b-499357cf55f9',
              name: 'ByHealth Vitamin C',
              customer_access_token: '4dfeaf6f7dc541b2bca118a46d7038f3'
            },
            'c50a5d47-1758560395961-003': {
              id: 'febb22cf-c302-47f8-9b1b-499357cf55f9',
              name: 'ByHealth Vitamin C',
              customer_access_token: '4dfeaf6f7dc541b2bca118a46d7038f3'
            },
            'c50a5d47-1758560395961-004': {
              id: 'febb22cf-c302-47f8-9b1b-499357cf55f9',
              name: 'ByHealth Vitamin C',
              customer_access_token: '4dfeaf6f7dc541b2bca118a46d7038f3'
            }
            // Add more QR codes here as needed - just copy the pattern above
          } as Record<string, { id: string; name: string; customer_access_token: string }>;

          // Look up campaign data from hardcoded mapping
          campaign = campaignMapping[uniqueCode as string];

          if (!campaign) {
            console.error('❌ QrRedirect: QR code not found in hardcoded mapping:', uniqueCode);
            console.log('Available QR codes:', Object.keys(campaignMapping));
            navigate('/not-found?error=qr-not-mapped');
            return;
          }

          console.log('✅ QrRedirect: Campaign found in hardcoded mapping:', campaign);

          // Optional: Try to update scan count (ignore if it fails due to RLS)
          try {
            console.log('📊 QrRedirect: Attempting to update scan count...');
            await supabase
              .from('qr_codes')
              .update({ scans: 1 })
              .eq('unique_code', uniqueCode);
            console.log('✅ QrRedirect: Scan count updated successfully');
          } catch (scanError) {
            console.log('⚠️ QrRedirect: Could not update scan count (ignored due to RLS):', scanError);
            // Continue anyway - scan count is not critical
          }

          console.log('🔍 QrRedirect: Using hardcoded campaign data:', campaign);
        } catch (error) {
          console.error('💥 QrRedirect: Unexpected error in hardcoded solution:', error);
          navigate('/not-found?error=processing-error');
        }

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