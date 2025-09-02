import { supabase } from '@/integrations/supabase/client';

export async function loadFlowForCampaign(campaignId: string) {
  console.log('🔍 loadFlowForCampaign: Loading flow for campaign:', campaignId);
  
  // Fetch the single flow row by campaign_id (limit 1)
  const { data: flowRow, error: flowErr } = await supabase
    .from('flows')
    .select('id, published_snapshot, flow_config, latest_published_version, name')
    .eq('campaign_id', campaignId)
    .maybeSingle();
  
  if (flowErr) {
    console.error('🔍 loadFlowForCampaign: Error fetching flow:', flowErr);
    throw new Error('Flow not found: ' + flowErr.message);
  }
  
  if (!flowRow) {
    console.error('🔍 loadFlowForCampaign: No flow found for campaign:', campaignId);
    throw new Error('Flow not found for campaign');
  }

  console.log('🔍 loadFlowForCampaign: Flow row found:', {
    id: flowRow.id,
    name: flowRow.name,
    hasPublishedSnapshot: !!flowRow.published_snapshot,
    hasFlowConfig: !!flowRow.flow_config,
    latestVersion: flowRow.latest_published_version
  });

  let payload: any = null;
  let mode = 'unknown';

  // Build payload using precedence: published_snapshot first, then flow_config
  if (flowRow.published_snapshot) {
    console.log('🔍 loadFlowForCampaign: Using published_snapshot');
    payload = flowRow.published_snapshot;
    mode = 'published';
  } else if (flowRow.flow_config) {
    console.log('🔍 loadFlowForCampaign: Using flow_config as fallback');
    payload = flowRow.flow_config;
    mode = 'draft';
  } else {
    console.warn('🔍 loadFlowForCampaign: No published_snapshot or flow_config found');
    payload = null;
    mode = 'empty';
  }

  // If payload is a string, JSON.parse it
  if (typeof payload === 'string') {
    console.log('🔍 loadFlowForCampaign: Parsing string payload');
    try {
      payload = JSON.parse(payload);
    } catch (parseErr) {
      console.error('🔍 loadFlowForCampaign: Failed to parse JSON payload:', parseErr);
      throw new Error('Invalid flow data format');
    }
  }

  // Normalize: ensure payload.pages is an array
  if (!payload) {
    payload = { pages: [] };
  } else if (!payload.pages || !Array.isArray(payload.pages)) {
    console.warn('🔍 loadFlowForCampaign: payload.pages is not an array, normalizing...');
    console.log('🔍 loadFlowForCampaign: Available payload keys:', Object.keys(payload || {}));
    payload.pages = [];
  }

  console.log('🔍 loadFlowForCampaign: Final payload pages length:', payload.pages.length);

  // If after this pages.length === 0, log the keys for debugging
  if (payload.pages.length === 0) {
    console.warn('🔍 loadFlowForCampaign: Empty pages array detected!');
    console.log('🔍 loadFlowForCampaign: Payload structure:', {
      keys: Object.keys(payload || {}),
      payload: payload
    });
    
    // Try to find pages in alternative locations
    if (payload.flow && Array.isArray(payload.flow)) {
      console.log('🔍 loadFlowForCampaign: Found pages in payload.flow, using as fallback');
      payload.pages = payload.flow;
    } else if (payload.content && Array.isArray(payload.content)) {
      console.log('🔍 loadFlowForCampaign: Found pages in payload.content, using as fallback');
      payload.pages = payload.content;
    }
  }

  return {
    mode,
    flow: payload,
    flowId: flowRow.id,
    flowName: flowRow.name
  };
}