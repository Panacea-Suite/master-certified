import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import CustomerFlowExperience from '@/components/CustomerFlowExperience';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { loadFlowForCampaign } from '@/runtime/loadFlow';
import { getHashSafeParam } from '@/lib/hashParams';
import { DebugBox } from '@/components/DebugBox';

export const CustomerFlowRun: React.FC = () => {
  const { cid: routeParamCid } = useParams();
  const location = useLocation();
  
  // Extract parameters with robust fallback strategy
  // Priority: 1) Route path param, 2) Query param cid, 3) Query param campaign_id
  const cid = routeParamCid || 
              getHashSafeParam('cid', location) || 
              getHashSafeParam('campaign_id', location);
  const qr = getHashSafeParam('qr', location);
  const ct = getHashSafeParam('ct', location);
  const debugFlow = getHashSafeParam('debugFlow', location) === '1';
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [flowData, setFlowData] = useState<any>(null);
  const [campaignData, setCampaignData] = useState<any>(null);
  const [lastRequest, setLastRequest] = useState<any>(null);
  const [lastError, setLastError] = useState<any>(null);
  
  // Debug state for the debug panel
  const [debugState, setDebugState] = useState({
    flowFound: false,
    pagesLength: 0,
    flowMode: 'unknown'
  });

  useEffect(() => {
    const loadFlowData = async () => {
      try {
        // Debug logging before any fetch
        console.log('🔍 CustomerFlowRun Debug:', { 
          routeParamCid, 
          cid, 
          qr, 
          ct, 
          location: {
            pathname: location.pathname,
            search: location.search,
            hash: location.hash
          }
        });
        
        if (!cid) {
          throw new Error('Missing campaign ID (cid) in URL parameters. Please check the URL format.');
        }

        // Validate the customer access token if provided
        if (ct) {
          console.log('🔍 Validating token:', ct);
          const tokenUrl = `validate_campaign_token(${cid}, ${ct})`;
          setLastRequest({ url: tokenUrl, status: 0 });
          
          const { data: isValid, error: tokenError } = await supabase
            .rpc('validate_campaign_token', {
              p_campaign_id: cid,
              p_token: ct
            });

          setLastRequest({ url: tokenUrl, status: tokenError ? 400 : 200, response: { isValid, error: tokenError } });

          if (tokenError) {
            throw new Error(`Token validation error: ${tokenError.message}`);
          }
          
          if (!isValid) {
            throw new Error('Invalid access token');
          }
        }

        // Fetch campaign data
        const campaignQuery = `campaigns?select=*,brands(*)&eq.id=${cid}`;
        console.log('🔍 Fetching campaign:', campaignQuery);
        setLastRequest({ url: campaignQuery, status: 0 });
        
        const { data: campaign, error: campaignError } = await supabase
          .from('campaigns')
          .select('*, brands (*)')
          .eq('id', cid)
          .single();

        setLastRequest({ 
          url: campaignQuery, 
          status: campaignError ? 400 : 200, 
          response: campaignError ? { error: campaignError } : campaign 
        });

        if (campaignError) {
          console.error('🔍 Campaign fetch error:', campaignError);
          throw new Error(`Campaign not found: ${campaignError.message}`);
        }

        if (!campaign) {
          console.error('🔍 Empty campaign response');
          throw new Error('Campaign data is empty');
        }

        console.log('🔍 Campaign loaded:', campaign);
        setCampaignData(campaign);
        
        // Load flow using runtime hardened loader
        console.log('🔍 Loading flow for campaign:', cid);
        const flowResult = await loadFlowForCampaign(cid);
        console.log('🔍 Flow result:', flowResult);

        // Extract pages for debug info with safe type checking
        let pages: any[] = [];
        if (flowResult.flow) {
          // Check if it's an object with pages property
          if (typeof flowResult.flow === 'object' && flowResult.flow !== null && 'pages' in flowResult.flow) {
            const flowObj = flowResult.flow as { pages?: any[] };
            pages = flowObj.pages || [];
          } 
          // Check if it's directly an array (flow_content format)
          else if (Array.isArray(flowResult.flow)) {
            pages = flowResult.flow;
          }
          // For other object formats, try to find pages-like structure
          else if (typeof flowResult.flow === 'object' && flowResult.flow !== null) {
            const flowObj = flowResult.flow as Record<string, any>;
            // Look for common page indicators
            if (flowObj.version !== undefined && Array.isArray(flowObj.pages)) {
              pages = flowObj.pages;
            }
          }
        }

        // Update debug state
        setDebugState({
          flowFound: !!flowResult.flow,
          pagesLength: pages.length,
          flowMode: flowResult.mode
        });

        // Create flow data with proper structure
        const flowData = {
          id: 'flow-' + cid, // Temp ID for flow data
          name: campaign.name + ' Flow',
          flow_config: flowResult.flow, // This contains either published_snapshot or draft pages
          campaign,
          qrId: qr,
          mode: flowResult.mode
        };

        console.log('🔍 Final flow data created with pages:', pages.length);
        setFlowData(flowData);

        setLoading(false);
      } catch (err) {
        console.error('🔍 Error loading flow:', err);
        const errorInfo = {
          message: err instanceof Error ? err.message : 'Failed to load flow',
          stack: err instanceof Error ? err.stack : undefined
        };
        setLastError(errorInfo);
        setError(errorInfo.message);
        
        // Update debug state even on error 
        setDebugState(prev => ({
          ...prev,
          flowFound: false,
          pagesLength: 0,
          flowMode: 'error'
        }));
        
        setLoading(false);
      }
    };

    loadFlowData();
  }, [cid, qr, ct, routeParamCid]); // Update dependencies

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
      <DebugBox
        cid={cid}
        qr={qr}
        ct={ct}
        location={location}
        lastRequest={lastRequest}
        lastError={lastError}
        flowFound={debugState.flowFound}
        pagesLength={debugState.pagesLength}
        flowMode={debugState.flowMode}
        visible={debugFlow}
      />
    </div>
  );
};