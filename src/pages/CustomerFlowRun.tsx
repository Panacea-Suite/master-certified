import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import CustomerFlowExperience from '@/components/CustomerFlowExperience';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const CustomerFlowRun: React.FC = () => {
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('cid'); // Get campaign ID from query params
  const qrId = searchParams.get('qr'); // Get QR ID from query params  
  const token = searchParams.get('ct'); // Get customer access token from query params
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [flowData, setFlowData] = useState<any>(null);
  const [campaignData, setCampaignData] = useState<any>(null);

  useEffect(() => {
    const loadFlowData = async () => {
      try {
        if (!campaignId) {
          throw new Error('Missing campaign ID (cid) in URL parameters');
        }

        // Validate the customer access token if provided
        if (token) {
          const { data: isValid } = await supabase
            .rpc('validate_campaign_token', {
              p_campaign_id: campaignId,
              p_token: token
            });

          if (!isValid) {
            throw new Error('Invalid access token');
          }
        }

        // Fetch campaign and flow data
        const { data: campaign, error: campaignError } = await supabase
          .from('campaigns')
          .select(`
            *,
            brands (*),
            flows (*)
          `)
          .eq('id', campaignId)
          .single();

        if (campaignError) {
          throw new Error('Campaign not found');
        }

        setCampaignData(campaign);
        
        // Use the first flow from the campaign
        const flow = campaign.flows?.[0];
        if (flow) {
          setFlowData({
            ...flow,
            campaign,
            qrId
          });
        } else {
          throw new Error('No flow found for this campaign');
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading flow:', err);
        setError(err instanceof Error ? err.message : 'Failed to load flow');
        setLoading(false);
      }
    };

    loadFlowData();
  }, [campaignId, qrId, token]); // Update dependencies

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading flow...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p>{error}</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!flowData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p>No flow data available</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CustomerFlowExperience 
        templateData={flowData.flow_config}
        brandData={campaignData?.brands}
        flowId={flowData.id}
        qrCode={flowData.qrId}
      />
    </div>
  );
};