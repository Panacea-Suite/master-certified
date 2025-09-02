import { supabase } from '@/integrations/supabase/client';

export async function loadFlowForCampaign(campaignId: string) {
  // Get flow for this campaign
  const { data: flowRow, error: flowErr } = await supabase
    .from('flows')
    .select('id, published_snapshot, latest_published_version')
    .eq('campaign_id', campaignId)
    .maybeSingle();
  
  if (flowErr || !flowRow) throw new Error('Flow not found');

  // Prefer published snapshot
  if (flowRow.published_snapshot) {
    return { mode: 'published', flow: flowRow.published_snapshot };
  }

  // Fallback: build from draft so the page is never blank
  const { data: draft, error: draftErr } = await supabase
    .from('flow_content')
    .select('*')
    .eq('flow_id', flowRow.id)
    .order('order_index', { ascending: true });

  if (draftErr) throw draftErr;

  return {
    mode: 'draft',
    flow: { version: 0, pages: draft ?? [] }
  };
}