import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Eye, Settings, Copy, Smartphone } from 'lucide-react';
import FlowBuilder from './FlowBuilder';
import CustomerFlowExperience from './CustomerFlowExperience';

interface Flow {
  id: string;
  name: string;
  campaign_id?: string;
  flow_config?: any;
  redirect_url: string;
  created_at: string;
  campaigns?: {
    name: string;
  };
}

const FlowManager = () => {
  const [flows, setFlows] = useState<Flow[]>([]);
  const [newFlowName, setNewFlowName] = useState('');
  const [newFlowRedirectUrl, setNewFlowRedirectUrl] = useState('');
  const [newFlowDescription, setNewFlowDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFlowId, setSelectedFlowId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'builder' | 'customer' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    try {
      const { data, error } = await supabase
        .from('flows')
        .select(`
          *,
          campaigns (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFlows(data || []);
    } catch (error) {
      console.error('Error fetching flows:', error);
      toast({
        title: "Error",
        description: "Failed to fetch flows",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createTemplateFlow = async () => {
    if (!newFlowName.trim()) {
      toast({
        title: "Error",
        description: "Flow name is required",
        variant: "destructive",
      });
      return;
    }

    if (!newFlowRedirectUrl.trim()) {
      toast({
        title: "Error",
        description: "Redirect URL is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const flowConfig = {
        description: newFlowDescription,
        template: true,
        version: "1.0",
        components: [
          {
            type: "header",
            content: "Product Verification"
          },
          {
            type: "product_info",
            fields: ["name", "sku", "description"]
          },
          {
            type: "verification_status",
            authentic_message: "✅ This product is authentic",
            suspicious_message: "⚠️ This product requires verification"
          },
          {
            type: "brand_info",
            show_logo: true,
            show_colors: true
          },
          {
            type: "contact_form",
            fields: ["name", "email", "message"]
          }
        ]
      };

      // Get user's first brand to associate with the flow template
      const { data: brandData } = await supabase
        .from('brands')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (!brandData) {
        toast({
          title: "Error",
          description: "Please create a brand first before creating flows",
          variant: "destructive",
        });
        return;
      }

      // Create a temporary campaign for template flows
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .insert([{
          name: `${newFlowName} Template Campaign`,
          description: 'Auto-generated campaign for flow template',
          brand_id: brandData.id
        }])
        .select('id')
        .single();

      if (campaignError) throw campaignError;

      const { data, error } = await supabase
        .from('flows')
        .insert([{
          name: newFlowName,
          campaign_id: campaignData.id,
          redirect_url: newFlowRedirectUrl,
          flow_config: flowConfig
        }])
        .select(`
          *,
          campaigns (
            name
          )
        `)
        .single();

      if (error) throw error;

      setFlows([data, ...flows]);
      setNewFlowName('');
      setNewFlowRedirectUrl('');
      setNewFlowDescription('');
      toast({
        title: "Success",
        description: "Flow template created successfully",
      });
    } catch (error) {
      console.error('Error creating flow:', error);
      toast({
        title: "Error",
        description: "Failed to create flow template",
        variant: "destructive",
      });
    }
  };

  const duplicateFlow = async (flow: Flow) => {
    try {
      // Create a new campaign for the duplicated flow
      const { data: brandData } = await supabase
        .from('brands')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (!brandData) {
        toast({
          title: "Error",
          description: "Please create a brand first",
          variant: "destructive",
        });
        return;
      }

      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .insert([{
          name: `${flow.name} Copy Campaign`,
          description: 'Auto-generated campaign for duplicated flow',
          brand_id: brandData.id
        }])
        .select('id')
        .single();

      if (campaignError) throw campaignError;

      const { data, error } = await supabase
        .from('flows')
        .insert([{
          name: `${flow.name} (Copy)`,
          campaign_id: campaignData.id,
          redirect_url: flow.redirect_url,
          flow_config: flow.flow_config
        }])
        .select(`
          *,
          campaigns (
            name
          )
        `)
        .single();

      if (error) throw error;

      setFlows([data, ...flows]);
      toast({
        title: "Success",
        description: "Flow duplicated successfully",
      });
    } catch (error) {
      console.error('Error duplicating flow:', error);
      toast({
        title: "Error",
        description: "Failed to duplicate flow",
        variant: "destructive",
      });
    }
  };

  const deleteFlow = async (flowId: string) => {
    try {
      const { error } = await supabase
        .from('flows')
        .delete()
        .eq('id', flowId);

      if (error) throw error;

      setFlows(flows.filter(flow => flow.id !== flowId));
      toast({
        title: "Success",
        description: "Flow deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting flow:', error);
      toast({
        title: "Error",
        description: "Failed to delete flow",
        variant: "destructive",
      });
    }
  };

  const openFlowBuilder = (flowId: string) => {
    setSelectedFlowId(flowId);
    setPreviewMode('builder');
  };

  const openCustomerPreview = (flowId: string) => {
    setSelectedFlowId(flowId);
    setPreviewMode('customer');
  };

  const closeModals = () => {
    setSelectedFlowId(null);
    setPreviewMode(null);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading flows...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Flow Templates</h1>
      </div>

      {/* Create Flow Template Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Flow Template</CardTitle>
          <CardDescription>
            Create reusable flow templates for your campaigns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="flowName">Flow Name</Label>
              <Input
                id="flowName"
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                placeholder="Enter flow name"
              />
            </div>
            <div>
              <Label htmlFor="redirectUrl">Default Redirect URL</Label>
              <Input
                id="redirectUrl"
                value={newFlowRedirectUrl}
                onChange={(e) => setNewFlowRedirectUrl(e.target.value)}
                placeholder="https://example.com/verify"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="flowDescription">Description (Optional)</Label>
            <Textarea
              id="flowDescription"
              value={newFlowDescription}
              onChange={(e) => setNewFlowDescription(e.target.value)}
              placeholder="Describe the purpose of this flow template"
            />
          </div>
          <Button onClick={createTemplateFlow}>
            <Plus className="w-4 h-4 mr-2" />
            Create Flow Template
          </Button>
        </CardContent>
      </Card>

      {/* Flow Templates List */}
      <div className="grid gap-4">
        {flows.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No flow templates created yet. Create your first template to get started.</p>
            </CardContent>
          </Card>
        ) : (
          flows.map((flow) => (
            <Card key={flow.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {flow.name}
                      {!flow.campaign_id && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Template
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {flow.campaigns?.name ? `Campaign: ${flow.campaigns.name} • ` : ''}
                      Created {new Date(flow.created_at).toLocaleDateString()}
                    </CardDescription>
                    {flow.flow_config?.description && (
                      <p className="text-sm text-muted-foreground mt-2">{flow.flow_config.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openCustomerPreview(flow.id)}
                      title="Preview customer experience"
                    >
                      <Smartphone className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => duplicateFlow(flow)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openFlowBuilder(flow.id)}
                      title="Edit flow builder"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteFlow(flow.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <div className="text-sm text-muted-foreground">
                    <strong>Redirect URL:</strong> {flow.redirect_url}
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => openFlowBuilder(flow.id)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Flow
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openCustomerPreview(flow.id)}
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Preview Mobile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Flow Builder Modal */}
      {previewMode === 'builder' && selectedFlowId && (
        <div className="fixed inset-0 bg-background z-50 overflow-auto">
          <FlowBuilder flowId={selectedFlowId} onClose={closeModals} />
        </div>
      )}

      {/* Customer Preview Modal */}
      {previewMode === 'customer' && selectedFlowId && (
        <div className="fixed inset-0 bg-background z-50 overflow-auto">
          <div className="p-4">
            <Button 
              variant="outline" 
              onClick={closeModals}
              className="mb-4"
            >
              Close Preview
            </Button>
            <CustomerFlowExperience 
              flowId={selectedFlowId} 
              qrCode="preview-qr-code" 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FlowManager;