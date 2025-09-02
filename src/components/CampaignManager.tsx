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
import FlowManagerBackup from './FlowManager_backup';

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Flow Management</h1>
            <p className="text-muted-foreground mt-2">
              Campaign: {selectedCampaignForFlows.name}
            </p>
          </div>
          <Button variant="outline" onClick={() => setSelectedCampaignForFlows(null)}>
            Back to Campaigns
          </Button>
        </div>
        <FlowManagerBackup />
      </div>
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