import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';

interface Brand {
  id: string;
  name: string;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  brand_id: string;
  created_at: string;
  brands?: Brand;
}

const CampaignManager = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDescription, setNewCampaignDescription] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch brands
      const { data: brandsData, error: brandsError } = await supabase
        .from('brands')
        .select('id, name')
        .order('name');

      if (brandsError) throw brandsError;
      setBrands(brandsData || []);

      // Fetch campaigns
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

    if (!selectedBrandId) {
      toast({
        title: "Error",
        description: "Please select a brand",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          name: newCampaignName,
          description: newCampaignDescription,
          brand_id: selectedBrandId
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
      setSelectedBrandId('');
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Campaign Management</h1>
      </div>

      {/* Create Campaign Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Campaign</CardTitle>
          <CardDescription>
            Create a new campaign for a specific product line
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="brandSelect">Brand</Label>
              <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          <Button onClick={createCampaign}>
            <Plus className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <div className="grid gap-4">
        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {brands.length === 0 
                  ? "Create a brand first before creating campaigns."
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