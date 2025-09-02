import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Eye, Store, Settings2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useBrandContext } from '@/contexts/BrandContext';
import CampaignWizard from './CampaignWizard';
import { CampaignTokenManager } from './CampaignTokenManager';
import CampaignBatchView from './CampaignBatchView';
import { FlowEditor } from './FlowEditor';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  brand_id: string;
  approved_stores?: string[];
  flow_settings?: any;
  customer_access_token: string;
  final_redirect_url?: string;
  created_at: string;
  brands?: {
    id: string;
    name: string;
  };
}

// Focused view to manage the flow attached to a specific campaign
const CampaignFlowsView: React.FC<{ campaign: Campaign; onBack: () => void }> = ({ campaign, onBack }) => {
  const { toast } = useToast();
  const [flow, setFlow] = useState<any | null>(null);
  const [brandData, setBrandData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        console.log('🔍 CampaignFlowsView: Loading flow for campaign:', campaign.id);
        
        // Always load flow by campaign_id, never by name to avoid template confusion
        const { data: flowRow, error: flowErr } = await supabase
          .from('flows')
          .select('*')
          .eq('campaign_id', campaign.id)
          .is('is_template', false) // Explicitly ensure we get campaign flows only
          .maybeSingle();
          
        if (flowErr) throw flowErr;
        
        console.log('🔍 CampaignFlowsView: Found flow:', {
          flowId: flowRow?.id,
          flowName: flowRow?.name,
          campaignId: flowRow?.campaign_id,
          isTemplate: flowRow?.is_template,
          hasFlowConfig: !!flowRow?.flow_config,
          hasPublishedSnapshot: !!flowRow?.published_snapshot
        });
        
        if (active) setFlow(flowRow);

        const { data: brand, error: brandErr } = await supabase
          .from('brands')
          .select('id, name, logo_url, brand_colors')
          .eq('id', campaign.brand_id)
          .maybeSingle();
        if (!brandErr && active) setBrandData(brand);
      } catch (e: any) {
        console.error('🔍 Error loading campaign flow:', e);
        toast({ title: 'Error', description: 'Failed to load campaign flow', variant: 'destructive' });
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [campaign.id, campaign.brand_id, toast]);

  const handleSave = async (updated: any) => {
    try {
      if (!flow) return;
      
      console.log('🔍 Saving flow for campaign:', campaign.id, 'Flow ID:', flow.id);
      
      // Create the flow snapshot for immediate publishing
      const flowSnapshot = {
        pages: updated.flow_config?.pages || [],
        globalHeader: updated.flow_config?.globalHeader || {},
        footerConfig: updated.flow_config?.footerConfig || {},
        design_template_id: updated.flow_config?.design_template_id,
        theme: updated.flow_config?.theme || {},
        settings: updated.flow_config?.settings || {},
        name: updated.name,
        publishedAt: new Date().toISOString()
      };

      // Save flow_config and automatically set published_snapshot
      const { error: flowError } = await supabase
        .from('flows')
        .update({
          name: updated.name,
          flow_config: updated.flow_config,
          published_snapshot: flowSnapshot,
          latest_published_version: (flow.latest_published_version || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', flow.id);
      
      if (flowError) throw flowError;

      // Create/update flow_content records for each page
      if (updated.flow_config?.pages) {
        console.log('🔍 Creating flow_content records for', updated.flow_config.pages.length, 'pages');
        
        // Delete existing flow_content records
        await supabase
          .from('flow_content')
          .delete()
          .eq('flow_id', flow.id);

        // Insert new flow_content records
        const contentRecords = updated.flow_config.pages.map((page: any, index: number) => ({
          flow_id: flow.id,
          title: page.name || `Page ${index + 1}`,
          content_type: 'page',
          content: page as any, // Cast to Json type
          order_index: page.order || index
        }));

        const { error: contentError } = await supabase
          .from('flow_content')
          .insert(contentRecords);
        
        if (contentError) {
          console.error('🔍 Error creating flow_content:', contentError);
          // Don't throw - flow_config is saved, this is just backup
        } else {
          console.log('🔍 Created', contentRecords.length, 'flow_content records');
        }
      }

        // VERIFICATION STEP: Re-fetch the flow to confirm persistence
        console.log('🔍 CampaignManager: Verifying save by re-fetching flow...');
        const { data: verificationFlow, error: fetchError } = await supabase
          .from('flows')
          .select('id, flow_config, published_snapshot, latest_published_version, campaign_id')
          .eq('id', flow.id)
          .single();

        if (fetchError) {
          console.error('🔍 CampaignManager: Error verifying save:', fetchError);
          throw new Error('Save verification failed: ' + fetchError.message);
        }

        // Verify flow_config.pages structure with safe type casting
        const verifiedFlowConfig = verificationFlow.flow_config as any;
        const savedPages = (verifiedFlowConfig && Array.isArray(verifiedFlowConfig.pages)) ? verifiedFlowConfig.pages : [];
        const totalSections = savedPages.reduce((total: number, page: any) => {
          return total + (page.sections?.length || 0);
        }, 0);

        console.log('🔍 CampaignManager: Save verification results:', {
          flowId: verificationFlow.id,
          campaignId: verificationFlow.campaign_id,
          pagesCount: savedPages.length,
          totalSections: totalSections,
          hasPublishedSnapshot: !!verificationFlow.published_snapshot,
          latestVersion: verificationFlow.latest_published_version
        });

        if (savedPages.length === 0) {
          throw new Error('Save verification failed: No pages found in saved flow_config');
        }

        const updatedFlow = { 
          ...flow, 
          ...updated, 
          published_snapshot: flowSnapshot,
          latest_published_version: (flow.latest_published_version || 0) + 1
        };
        setFlow(updatedFlow);
        
        console.log('🔍 CampaignManager: Campaign flow auto-published successfully');
        toast({ title: 'Saved & Published', description: `✅ ${savedPages.length} pages, ${totalSections} sections. Flow is now live!` });
    } catch (e: any) {
      console.error('🔍 Error saving flow:', e);
      toast({ title: 'Error', description: e.message || 'Failed to save flow', variant: 'destructive' });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading flow...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flow Management</h1>
          <p className="text-muted-foreground mt-2">Campaign: {campaign.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>Back to Campaigns</Button>
          <Button variant="default" onClick={() => { window.location.hash = `#/flow/run/${campaign.id}?debugFlow=1`; }}>Open Customer View</Button>
        </div>
      </div>

      {!flow ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <div className="space-y-2">
              <p>No flow found for this campaign.</p>
              <p className="text-sm">Campaign ID: {campaign.id}</p>
              <p className="text-xs opacity-60">Looking for flows where campaign_id = {campaign.id} and is_template = false</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Campaign Flow Context Banner */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="py-3">
              <div className="flex items-center justify-between text-sm">
                <div className="space-y-1">
                  <div className="font-medium text-blue-900">
                    📝 Editing Campaign Flow: {flow.name}
                  </div>
                  <div className="text-blue-700">
                    Flow ID: {flow.id} • Campaign: {campaign.name} • Auto-publishes on save
                  </div>
                </div>
                <div className="text-xs text-blue-600 space-y-1">
                  <div>✅ Loaded by campaign_id</div>
                  <div>⚡ Changes go live immediately</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <FlowEditor
            isOpen={editorOpen}
            onClose={() => setEditorOpen(false)}
            onSave={handleSave}
            templateToEdit={flow}
            brandData={brandData}
          />
        </div>
      )}
    </div>
  );
};

const CampaignManager = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [showTokenManager, setShowTokenManager] = useState(false);
  const [selectedCampaignForBatches, setSelectedCampaignForBatches] = useState<Campaign | null>(null);
  const [selectedCampaignForFlows, setSelectedCampaignForFlows] = useState<Campaign | null>(null);
  const { currentBrand, availableBrands, isLoading: brandLoading, refreshBrands } = useBrandContext();
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Debug logging
  console.log('🔍 CampaignManager Debug:', {
    currentBrandId: currentBrand?.id,
    selectedBrandIdFromStorage: localStorage.getItem('selectedBrandId'),
    availableBrandsCount: availableBrands.length,
    campaignsCount: campaigns.length
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    // Re-query campaigns when current brand changes
    if (currentBrand) {
      fetchCampaigns();
    } else {
      setCampaigns([]);
    }
  }, [currentBrand]);

  const fetchCampaigns = async () => {
    if (!currentBrand) {
      setCampaigns([]);
      console.log('🔍 No currentBrand, clearing campaigns');
      return;
    }

    try {
      console.log('🔍 Fetching campaigns for brand:', currentBrand.id);
      // Fetch campaigns for the current brand only
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select(`
          *,
          brands (
            id,
            name
          )
        `)
        .eq('brand_id', currentBrand.id)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;
      console.log('🔍 Campaigns fetched:', campaignsData?.length || 0, 'campaigns for brand', currentBrand.id);
      setCampaigns(campaignsData || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to fetch campaigns",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  const deleteCampaign = async (campaignId: string) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      setCampaigns(campaigns.filter(campaign => campaign.id !== campaignId));
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    }
  };

  const handleTokenUpdate = (campaignId: string, newToken: string) => {
    setCampaigns(prev => 
      prev.map(campaign => 
        campaign.id === campaignId 
          ? { ...campaign, customer_access_token: newToken }
          : campaign
      )
    );
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading campaigns...</div>;
  }

  if (showWizard) {
    return (
      <CampaignWizard
        currentBrand={currentBrand}
        onComplete={() => {
          setShowWizard(false);
          fetchCampaigns();
        }}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  if (showTokenManager) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customer Access Tokens</h1>
            <p className="text-muted-foreground mt-2">
              Manage security tokens for customer flow access
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowTokenManager(false)}>
            Back to Campaigns
          </Button>
        </div>
        <CampaignTokenManager 
          campaigns={campaigns}
          onTokenUpdate={handleTokenUpdate}
        />
      </div>
    );
  }

  if (selectedCampaignForFlows) {
    return (
      <CampaignFlowsView
        campaign={selectedCampaignForFlows}
        onBack={() => setSelectedCampaignForFlows(null)}
      />
    );
  }

  if (selectedCampaignForBatches) {
    return (
      <CampaignBatchView
        campaign={selectedCampaignForBatches}
        onBack={() => setSelectedCampaignForBatches(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Debug Banner */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
        <div className="font-medium text-yellow-800 mb-1">🔍 Debug Info (temp):</div>
        <div className="text-yellow-700 space-y-1">
          <div>Current Brand: {currentBrand?.id || 'None'} ({currentBrand?.name || 'No name'})</div>
          <div>Storage Brand ID: {localStorage.getItem('selectedBrandId') || 'None'}</div>
          <div>Available Brands: {availableBrands.length}</div>
          <div>Campaigns Shown: {campaigns.length}</div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Campaign Management</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setShowTokenManager(true)}
            disabled={!currentBrand || campaigns.length === 0}
            title={!currentBrand ? 'Create a brand first' : campaigns.length === 0 ? 'No campaigns to manage' : undefined}
          >
            Manage Access Tokens
          </Button>
          <Button 
            onClick={() => setShowWizard(true)}
            disabled={!currentBrand}
            title={!currentBrand ? 'Create a brand first' : undefined}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>


      {/* Campaigns List */}
      <div className="grid gap-4">
        {availableBrands.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Store className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No brands yet</h3>
                  <p className="text-muted-foreground max-w-md">
                    Create your first brand to start a campaign. You'll need to set up your brand details, logo, and approved stores.
                  </p>
                </div>
                <Button onClick={() => window.location.hash = '#brand-settings'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Brand
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                No campaigns created yet. Create your first campaign to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{campaign.name}</CardTitle>
                    <CardDescription>
                      Brand: {campaign.brands?.name} • Created {new Date(campaign.created_at).toLocaleDateString()}
                    </CardDescription>
                    {campaign.approved_stores && campaign.approved_stores.length > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <Store className="w-4 h-4 text-muted-foreground" />
                        <div className="flex gap-1 flex-wrap">
                          {campaign.approved_stores.slice(0, 3).map((store, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {store}
                            </Badge>
                          ))}
                          {campaign.approved_stores.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{campaign.approved_stores.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                    {campaign.description && (
                      <p className="text-sm text-muted-foreground mt-2">{campaign.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteCampaign(campaign.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button 
                    variant="default"
                    onClick={() => setSelectedCampaignForBatches(campaign)}
                  >
                    View Batches
                  </Button>
                   <Button 
                     variant="outline"
                     onClick={() => setSelectedCampaignForFlows(campaign)}
                   >
                     <Settings2 className="w-4 h-4 mr-2" />
                     Manage Flows
                   </Button>
                  <Button variant="outline">
                    Campaign Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CampaignManager;