import { supabase } from '@/integrations/supabase/client';

export async function loadFlowForCampaign(campaignId: string, debug = false, trace = false) {
  console.log('🔍 loadFlowForCampaign: Loading flow for campaign:', campaignId);
  
  if (debug) {
    console.log('🔍 DEBUG: Campaign ID resolved to:', campaignId);
  }
  
  // Fetch the single flow row by campaign_id with specific fields for runtime
  const { data: flowRow, error: flowErr } = await supabase
    .from('flows')
    .select('id, published_snapshot, flow_config, latest_published_version, name, campaign_id')
    .eq('campaign_id', campaignId)
    .maybeSingle();
  
  // Enhanced trace logging for Supabase errors
  if (trace && flowErr) {
    console.error('[TRACE] Supabase Flow Error:', {
      code: flowErr.code,
      message: flowErr.message,
      details: flowErr.details,
      hint: flowErr.hint,
      campaignId: campaignId,
      query: `flows?select=id,published_snapshot,flow_config,latest_published_version,name,campaign_id&eq.campaign_id=${campaignId}`
    });
  }
  
  if (flowErr) {
    console.error('🔍 loadFlowForCampaign: Error fetching flow:', flowErr);
    // Enhanced error message for RLS issues
    if (flowErr.code && flowErr.code.includes('42501')) {
      throw new Error(`Permission denied accessing flow for campaign ${campaignId}. Check RLS policies for anonymous access.`);
    }
    throw new Error('Flow not found: ' + flowErr.message);
  }
  
  if (!flowRow) {
    console.error('🔍 loadFlowForCampaign: No flow found for campaign:', campaignId);
    if (trace) {
      console.error('[TRACE] No Flow Found:', {
        campaignId: campaignId,
        message: 'Flow query returned no results for this campaign ID'
      });
    }
    throw new Error('Flow not found for campaign');
  }

  // Validate campaign_id match for security
  if (flowRow.campaign_id !== campaignId) {
    console.error('🔍 loadFlowForCampaign: Campaign ID mismatch:', {
      requested: campaignId,
      actual: flowRow.campaign_id
    });
    if (trace) {
      console.error('[TRACE] Campaign ID Mismatch:', {
        requestedCampaignId: campaignId,
        actualCampaignId: flowRow.campaign_id,
        flowId: flowRow.id
      });
    }
    throw new Error('Flow campaign ID mismatch');
  }

  console.log('🔍 loadFlowForCampaign: Flow row found:', {
    id: flowRow.id,
    name: flowRow.name,
    campaignId: flowRow.campaign_id,
    hasPublishedSnapshot: !!flowRow.published_snapshot,
    hasFlowConfig: !!flowRow.flow_config,
    latestVersion: flowRow.latest_published_version
  });

  if (debug || trace) {
    console.log('🔍 DEBUG: Flow database row details:', {
      flowId: flowRow.id,
      campaignId: flowRow.campaign_id,
      requestedCampaignId: campaignId,
      hasPublishedSnapshot: !!flowRow.published_snapshot,
      hasFlowConfig: !!flowRow.flow_config,
      flowConfigType: typeof flowRow.flow_config,
      publishedSnapshotType: typeof flowRow.published_snapshot
    });
  }

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
    if (debug) {
      console.log('🔍 DEBUG: Payload was string, parsing JSON...');
    }
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

  if (debug || trace) {
    console.log('🔍 DEBUG: Final payload analysis:', {
      pagesLength: payload.pages.length,
      payloadKeys: Object.keys(payload || {}),
      mode: mode,
      campaignId: campaignId,
      flowId: flowRow.id
    });
  }

  // Enhanced trace logging for data structure analysis
  if (trace) {
    console.table({
      'Flow Data Structure Analysis': {
        campaign_id: campaignId,
        flow_id: flowRow.id,
        mode: mode,
        has_published_snapshot: !!flowRow.published_snapshot,
        has_flow_config: !!flowRow.flow_config,
        pages_count: payload.pages.length,
        payload_keys: Object.keys(payload || {}).join(', ')
      }
    });
  }

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
    flowName: flowRow.name,
    // Return debug details for diagnostic purposes
    debugDetails: (debug || trace) ? {
      flowId: flowRow.id,
      campaignId: campaignId,
      actualCampaignId: flowRow.campaign_id,
      hasPublishedSnapshot: !!flowRow.published_snapshot,
      hasFlowConfig: !!flowRow.flow_config,
      flowConfigType: typeof flowRow.flow_config,
      publishedSnapshotType: typeof flowRow.published_snapshot,
      payloadKeys: Object.keys(payload || {})
    } : undefined
  };
}