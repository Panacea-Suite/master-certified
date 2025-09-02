import { supabase } from '@/integrations/supabase/client';

export async function loadFlowForCampaign(campaignId: string, debug = false, trace = false, forceDraft = false) {
  console.log('🔍 loadFlowForCampaign: Loading flow for campaign:', campaignId, forceDraft ? '(forcing draft)' : '');
  
  if (debug) {
    console.log('🔍 DEBUG: Campaign ID resolved to:', campaignId, { forceDraft });
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

  // Customer Runtime: Prioritize published_snapshot, only use draft with explicit useDraft=1
  // This ensures customers ONLY see stable, published content
  if (forceDraft) {
    console.log('🔍 loadFlowForCampaign: DEBUG MODE - using draft content (useDraft=1 flag set)');
    if (flowRow.flow_config) {
      console.log('🔍 loadFlowForCampaign: Using flow_config (DRAFT mode for debugging)');
      payload = flowRow.flow_config;
      mode = 'draft-forced';
    } else if (flowRow.published_snapshot) {
      console.log('🔍 loadFlowForCampaign: No draft available, falling back to published');
      payload = flowRow.published_snapshot;
      mode = 'published-fallback';
    } else {
      console.warn('🔍 loadFlowForCampaign: No content available in either draft or published');
      payload = null;
      mode = 'empty';
    }
  } else {
    // PRODUCTION MODE: STRICT - ONLY use published_snapshot for customers
    if (flowRow.published_snapshot) {
      console.log('🔍 loadFlowForCampaign: Using published_snapshot (PRODUCTION - customers see this)');
      payload = flowRow.published_snapshot;
      mode = 'published';
    } else {
      console.warn('🔍 loadFlowForCampaign: No published content available - flow needs to be published first');
      // STRICT: Do NOT fall back to draft in production - customers should ONLY see published content
      payload = null;
      mode = 'unpublished';
    }
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

  // If after this pages.length === 0 and we're in draft mode, try flow_content fallback
  if (payload.pages.length === 0 && (forceDraft || mode === 'draft-forced')) {
    console.warn('🔍 loadFlowForCampaign: Empty pages in draft mode, trying flow_content fallback...');
    console.log('🔍 loadFlowForCampaign: Payload structure:', {
      keys: Object.keys(payload || {}),
      payload: payload
    });
    
    // Try to find pages in alternative locations first (only in draft mode)
    if (payload.flow && Array.isArray(payload.flow)) {
      console.log('🔍 loadFlowForCampaign: Found pages in payload.flow, using as fallback');
      payload.pages = payload.flow;
    } else if (payload.content && Array.isArray(payload.content)) {
      console.log('🔍 loadFlowForCampaign: Found pages in payload.content, using as fallback');
      payload.pages = payload.content;
    } else {
      // Query flow_content for latest draft as final fallback (only in draft mode)
      console.log('🔍 loadFlowForCampaign: Querying flow_content for draft fallback...');
      const { data: draftRows, error: draftErr } = await supabase
        .from('flow_content')
        .select('content, updated_at')
        .eq('flow_id', flowRow.id)
        .order('updated_at', { ascending: false });

      if (draftErr) {
        console.error('🔍 loadFlowForCampaign: Error fetching draft content:', draftErr);
      } else if (draftRows && draftRows.length > 0) {
        console.log('🔍 loadFlowForCampaign: Found', draftRows.length, 'draft content rows');
        
        // Construct pages from draft content
        const draftPages = draftRows.map((row, index) => ({
          ...(typeof row.content === 'object' && row.content ? row.content : {}),
          order: index
        }));
        
        payload = { pages: draftPages };
        mode = 'draft-fallback';
        console.log('🔍 loadFlowForCampaign: Using draft-fallback with', draftPages.length, 'pages');
      } else {
        console.warn('🔍 loadFlowForCampaign: No draft content found either');
      }
    }
  } else if (payload.pages.length === 0 && mode === 'unpublished') {
    // For unpublished flows in production mode, provide clear error
    console.error('🔍 loadFlowForCampaign: Flow is not published - customers cannot access draft content');
    throw new Error('This flow has not been published yet. Please publish the flow in the editor to make it available to customers.');
  }

  // Return comprehensive result with enhanced debug details
  return {
    flow: payload,
    flowId: flowRow.id,
    flowName: flowRow.name,
    mode: mode,
    debugDetails: {
      campaignId: campaignId,
      flowId: flowRow.id,
      flowName: flowRow.name,
      flowCampaignId: flowRow.campaign_id,
      hasPublishedSnapshot: !!flowRow.published_snapshot,
      hasFlowConfig: !!flowRow.flow_config,
      flowConfigType: typeof flowRow.flow_config,
      publishedSnapshotType: typeof flowRow.published_snapshot,
      payloadKeys: payload ? Object.keys(payload) : [],
      contentSource: mode === 'published' ? 'published_snapshot' : 
                    mode.includes('draft') ? 'flow_config' : mode,
      latestVersion: flowRow.latest_published_version,
      pagesInPayload: payload?.pages?.length || 0,
      isLiveContent: mode === 'published',
      debugMode: forceDraft,
      loadedAt: new Date().toISOString()
    }
  };
}