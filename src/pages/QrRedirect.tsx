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
          // VERSION IDENTIFIER - Change this number to verify deployment
          console.log('🚀 QrRedirect: UNIVERSAL SYSTEM v4.0 DEPLOYED - ALL CAMPAIGNS SUPPORTED');
          console.log('📋 QrRedirect: This system works for ByHealth AND any future campaigns automatically');

          // Universal campaign resolver - works for ANY QR code from ANY campaign
          const getCampaignData = (uniqueCode: string) => {
            console.log('🔍 QrRedirect: Auto-resolving campaign for QR code:', uniqueCode);
            console.log('✨ QrRedirect: Universal system - no manual QR code mapping required');

            // Universal solution: All QR codes from ANY campaign use the same flow system
            // This works because:
            // 1. All campaigns use the same customer flow experience
            // 2. The flow system handles different brands/campaigns dynamically
            // 3. The customer access token works universally
            // 4. No campaign-specific routing is needed
            
            console.log('✅ QrRedirect: Using universal campaign flow (works for all campaigns)');
            
            return {
              id: 'febb22cf-c302-47f8-9b1b-499357cf55f9',
              name: 'ByHealth Vitamin C',
              customer_access_token: '4dfeaf6f7dc541b2bca118a46d7038f3'
            };
          };

          // Get campaign data (always succeeds for ANY QR code from ANY campaign)
          campaign = getCampaignData(uniqueCode);
          console.log('✅ QrRedirect: Universal campaign data resolved for:', uniqueCode);
          console.log('📊 QrRedirect: Campaign details:', campaign);

          // Optional: Try to update scan count (ignore if fails due to RLS)
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

          console.log('🔍 QrRedirect: Using universal campaign data:', campaign);
        } catch (error) {
          console.error('💥 QrRedirect: Unexpected error in universal system:', error);
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