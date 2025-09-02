import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import CustomerFlowExperience from '@/components/CustomerFlowExperience';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { loadFlowForCampaign } from '@/runtime/loadFlow';
import { getHashSafeParam } from '@/lib/hashParams';
import { DebugBox } from '@/components/DebugBox';

export const CustomerFlowRun: React.FC = () => {
  const location = useLocation();
  
  // Extract parameters using query string only (Pattern 2)
  // Priority: 1) Query param cid, 2) Query param campaign_id (legacy)
  const cid = getHashSafeParam('cid', location) || 
              getHashSafeParam('campaign_id', location);
  const qr = getHashSafeParam('qr', location);
  const ct = getHashSafeParam('ct', location);
  const debugFlow = getHashSafeParam('debugFlow', location) === '1';
  const trace = getHashSafeParam('trace', location) === '1';
  
  // Add trace logging for cid parsing
  if (trace && cid) {
    console.info('[FlowRun] cid', cid);
  }
  
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
    flowMode: 'unknown',
    debugDetails: undefined as any
  });

  useEffect(() => {
    const loadFlowData = async () => {
      try {
        // Trace logging for URL parameters
        if (trace) {
          console.table({
            'URL Parameters': {
              cid,
              qr,
              ct,
              pathname: location.pathname,
              search: location.search,
              hash: location.hash
            }
          });
        }
        
        // Debug logging before any fetch
        console.log('🔍 CustomerFlowRun Debug:', { 
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
          const errorMsg = 'Missing campaign ID in URL. Please check the URL format - it should include ?cid={campaign-id}';
          throw new Error(errorMsg);
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
          if (campaignError.code === 'PGRST116') {
            throw new Error(`No campaign found with ID: ${cid}. Please verify the campaign ID is correct.`);
          }
          throw new Error(`Campaign not found: ${campaignError.message}`);
        }

        if (!campaign) {
          console.error('🔍 Empty campaign response');
          throw new Error('Campaign data is empty');
        }

        console.log('🔍 Campaign loaded:', campaign);
        setCampaignData(campaign);
        
        // Trace logging for campaign fetch result
        if (trace) {
          console.table({
            'Campaign Fetch Result': {
              campaign_id: campaign.id,
              campaign_name: campaign.name,
              brand_name: campaign.brands?.name || 'No brand',
              has_published_snapshot: !!(campaign as any).published_snapshot,
              has_flow_config: !!(campaign as any).flow_config
            }
          });
        }
        
        // Load flow using runtime hardened loader
        console.log('🔍 Loading flow for campaign:', cid);
        const flowResult = await loadFlowForCampaign(cid, debugFlow);
        console.log('🔍 Flow result:', flowResult);

        // Extract pages for debug info with safe type checking
        let pages: any[] = [];
        if (flowResult.flow && flowResult.flow.pages) {
          pages = flowResult.flow.pages;
        }

        console.log('🔍 Final pages extracted:', pages.length, 'pages');
        
        // Trace logging for flow fetch result
        if (trace) {
          console.table({
            'Flow Fetch Result': {
              mode: flowResult.mode,
              flow_id: flowResult.flowId,
              flow_name: flowResult.flowName,
              pages_length: pages.length,
              published_snapshot_pages: flowResult.flow?.published_snapshot?.pages?.length || 0,
              flow_config_pages: flowResult.flow?.flow_config?.pages?.length || 0,
              is_published_mode: flowResult.mode === 'published',
              is_draft_mode: flowResult.mode === 'draft'
            }
          });
        }

        // Check for empty pages and provide detailed error
        if (pages.length === 0) {
          console.error('🔍 CustomerFlowRun: No pages found in flow!');
          console.log('🔍 CustomerFlowRun: Flow payload keys:', Object.keys(flowResult.flow || {}));
          console.log('🔍 CustomerFlowRun: Full flow payload:', flowResult.flow);
          
          // Set specific error for empty flow
          const errorMsg = `Flow found but contains no pages. Flow mode: ${flowResult.mode}. Available data keys: ${Object.keys(flowResult.flow || {}).join(', ')}. Please edit this flow in the Flow Editor to add content.`;
          throw new Error(errorMsg);
        }

        // Update debug state
        setDebugState({
          flowFound: !!flowResult.flow,
          pagesLength: pages.length,
          flowMode: flowResult.mode,
          debugDetails: flowResult.debugDetails
        });

        // Create flow data with proper structure
        const flowData = {
          id: flowResult.flowId || 'flow-' + cid,
          name: flowResult.flowName || campaign.name + ' Flow',
          flow_config: flowResult.flow, // This contains the properly parsed payload
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
          flowMode: 'error',
          debugDetails: undefined
        }));
        
        setLoading(false);
      }
    };

    loadFlowData();
  }, [cid, qr, ct]); // Update dependencies

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
      
      {/* Trace mode debug pill */}
      {trace && (
        <div className="fixed bottom-4 left-4 bg-primary text-primary-foreground px-3 py-2 rounded-full text-xs font-mono shadow-lg z-50">
          Pages: {debugState.pagesLength} | Mode: {debugState.flowMode}
        </div>
      )}
      
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
        flowDetails={debugState.debugDetails}
        visible={debugFlow}
      />
    </div>
  );
};