import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Eye, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import CampaignWizard from './CampaignWizard';

interface Brand {
  id: string;
  name: string;
  approved_stores?: string[];
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  brand_id: string;
  approved_stores?: string[];
  flow_settings?: any;
  created_at: string;
  brands?: Brand;
}

const CampaignManager = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDescription, setNewCampaignDescription] = useState('');
  const [newStores, setNewStores] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch current user's brand
      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .select('id, name, approved_stores')
        .maybeSingle();

      if (brandError) throw brandError;
      
      if (brandData) {
        setCurrentBrand(brandData);
        // Pre-populate stores from brand settings
        setNewStores(brandData.approved_stores?.join(', ') || '');
      }

      // Fetch campaigns for current brand
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select(`
          *,
          brands (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const createCampaign = async () => {
    if (!newCampaignName.trim()) {
      toast({
        title: "Error",
        description: "Campaign name is required",
        variant: "destructive",
      });
      return;
    }

    if (!currentBrand) {
      toast({
        title: "Error",
        description: "No brand found. Please set up your brand first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const storesArray = newStores.split(',').map(s => s.trim()).filter(s => s.length > 0);

      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          name: newCampaignName,
          description: newCampaignDescription,
          brand_id: currentBrand.id,
          approved_stores: storesArray
        }])
        .select(`
          *,
          brands (
            id,
            name
          )
        `)
        .single();

      if (error) throw error;

      setCampaigns([data, ...campaigns]);
      setNewCampaignName('');
      setNewCampaignDescription('');
      // Reset stores to brand default
      setNewStores(currentBrand.approved_stores?.join(', ') || '');
      
      setShowCreateForm(false);
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
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

  if (isLoading) {
    return <div className="text-center py-8">Loading campaigns...</div>;
  }

  if (showWizard) {
    return (
      <CampaignWizard
        currentBrand={currentBrand}
        onComplete={() => {
          setShowWizard(false);
          fetchData();
        }}
        onCancel={() => setShowWizard(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Campaign Management</h1>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowWizard(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            variant="outline"
          >
            Quick Create
          </Button>
        </div>
      </div>

      {/* Create Campaign Form - Conditionally Rendered */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
            <CardDescription>
              Create a new campaign for a specific product line
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="campaignName">Campaign Name</Label>
              <Input
                id="campaignName"
                value={newCampaignName}
                onChange={(e) => setNewCampaignName(e.target.value)}
                placeholder="Enter campaign name"
              />
            </div>
            <div>
              <Label htmlFor="campaignDescription">Description (Optional)</Label>
              <Textarea
                id="campaignDescription"
                value={newCampaignDescription}
                onChange={(e) => setNewCampaignDescription(e.target.value)}
                placeholder="Enter campaign description"
              />
            </div>
            <div>
              <Label htmlFor="approvedStores">Approved Stores</Label>
              <Textarea
                id="approvedStores"
                value={newStores}
                onChange={(e) => setNewStores(e.target.value)}
                placeholder="Enter approved store names, separated by commas (e.g., Store A, Store B, Store C)"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                These stores are pre-populated from your brand settings. You can customize them for this specific campaign.
              </p>
            </div>
            <Button onClick={createCampaign}>
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Campaigns List */}
      <div className="grid gap-4">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {!currentBrand 
                  ? "Set up your brand first before creating campaigns."
                  : "No campaigns created yet. Create your first campaign to get started."
                }
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
                  <Button variant="default">
                    View Batches
                  </Button>
                  <Button variant="outline">
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