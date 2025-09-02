import { supabase } from '@/integrations/supabase/client';

export async function loadFlowForCampaign(campaignId: string) {
  console.log('🔍 loadFlowForCampaign: Loading flow for campaign:', campaignId);
  
  // Get flow for this campaign
  const { data: flowRow, error: flowErr } = await supabase
    .from('flows')
    .select('id, published_snapshot, latest_published_version, flow_config')
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
    hasPublishedSnapshot: !!flowRow.published_snapshot,
    hasFlowConfig: !!flowRow.flow_config,
    latestVersion: flowRow.latest_published_version
  });

  // Prefer published snapshot
  if (flowRow.published_snapshot) {
    console.log('🔍 loadFlowForCampaign: Using published_snapshot');
    return { mode: 'published', flow: flowRow.published_snapshot };
  }

  // Fallback to flow_config if available
  if (flowRow.flow_config) {
    console.log('🔍 loadFlowForCampaign: Using flow_config as fallback');
    return { mode: 'draft', flow: flowRow.flow_config };
  }

  // Last resort: build from flow_content records
  console.log('🔍 loadFlowForCampaign: Falling back to flow_content records');
  const { data: draft, error: draftErr } = await supabase
    .from('flow_content')
    .select('*')
    .eq('flow_id', flowRow.id)
    .order('order_index', { ascending: true });

  if (draftErr) {
    console.error('🔍 loadFlowForCampaign: Error fetching flow_content:', draftErr);
    throw draftErr;
  }

  if (!draft || draft.length === 0) {
    console.warn('🔍 loadFlowForCampaign: No flow_content records found, returning empty structure');
    return {
      mode: 'empty',
      flow: { version: 0, pages: [] }
    };
  }

  console.log('🔍 loadFlowForCampaign: Using flow_content records:', draft.length, 'records');
  return {
    mode: 'draft',
    flow: { version: 0, pages: draft ?? [] }
  };
}