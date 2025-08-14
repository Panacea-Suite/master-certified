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
  base_url?: string;
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

  const createNewTemplate = async () => {
    if (!newFlowName.trim()) {
      toast({
        title: "Error",
        description: "Template name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get user's first brand to associate with the template
      const { data: brandData } = await supabase
        .from('brands')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (!brandData) {
        toast({
          title: "Error",
          description: "Please create a brand first before creating flow templates",
          variant: "destructive",
        });
        return;
      }

      // Create a template campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from('campaigns')
        .insert([{
          name: `${newFlowName} Template Campaign`,
          description: 'Auto-generated campaign for flow template',
          brand_id: brandData.id,
          approved_stores: ['Template Store A', 'Template Store B', 'Template Store C']
        }])
        .select('id')
        .single();

      if (campaignError) throw campaignError;

      // Create flow template with the new 5-stage structure
      const flowConfig = {
        template: true,
        version: "2.0",
        stages: [
          {
            type: "landing",
            title: "Welcome to Certified",
            description: "Verify your product authenticity",
            content: {
              welcomeText: "Welcome to our product verification system",
              features: ["Authentic product verification", "Access to product documentation", "Supply chain transparency"]
            }
          },
          {
            type: "store_location",
            title: "Store Location",
            description: "Where did you purchase this product?",
            content: {
              instruction: "Please select the store where you purchased this product"
            }
          },
          {
            type: "account_creation",
            title: "Create Account",
            description: "Optional: Create an account for full access",
            optional: true,
            content: {
              benefits: ["Save verification history", "Access exclusive content", "Get product updates"]
            }
          },
          {
            type: "authentication",
            title: "Verification",
            description: "Checking product authenticity...",
            content: {
              authenticMessage: "✅ This product is authentic",
              suspiciousMessage: "⚠️ This product requires verification"
            }
          },
          {
            type: "content",
            title: "Product Information",
            description: "Access detailed product information",
            content: {
              gatedMessage: "Create an account to view detailed product information"
            }
          }
        ]
      };

      const { data, error } = await supabase
        .from('flows')
        .insert([{
          name: newFlowName,
          campaign_id: campaignData.id,
          base_url: `${window.location.origin}/flow/${campaignData.id}`,
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
      toast({
        title: "Success",
        description: "Flow template created successfully",
      });

      // Open the flow builder immediately
      openFlowBuilder(data.id);
    } catch (error) {
      console.error('Error creating flow template:', error);
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
          base_url: flow.base_url,
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

      {/* Quick Create Template */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Flow Template</CardTitle>
          <CardDescription>
            Create a new flow template with our drag-and-drop editor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                value={newFlowName}
                onChange={(e) => setNewFlowName(e.target.value)}
                placeholder="Enter template name (e.g., Premium Product Flow)"
              />
            </div>
            <Button onClick={createNewTemplate} className="mb-0">
              <Plus className="w-4 h-4 mr-2" />
              Create & Edit Template
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            This will create a new template with the standard 5-stage flow structure and open the drag-and-drop editor.
          </p>
        </CardContent>
      </Card>

      {/* Flow Templates Library */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Flow Templates Library</h2>
          <div className="text-sm text-muted-foreground">
            {flows.length} template{flows.length !== 1 ? 's' : ''} available
          </div>
        </div>
        
        {flows.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Settings className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">No flow templates yet</h3>
                  <p className="text-muted-foreground">
                    Create your first flow template to get started with the drag-and-drop editor.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {flows.map((flow) => (
              <Card key={flow.id} className="relative">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 mb-2">
                        {flow.name}
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          Template
                        </span>
                      </CardTitle>
                      <CardDescription>
                        Campaign: {flow.campaigns?.name} • Created {new Date(flow.created_at).toLocaleDateString()}
                      </CardDescription>
                      
                      {/* Flow Stages Preview */}
                      <div className="mt-3">
                        <div className="text-sm font-medium mb-2">Flow Structure:</div>
                        <div className="flex gap-2 flex-wrap">
                          {flow.flow_config?.stages?.map((stage: any, index: number) => (
                            <div key={index} className="px-2 py-1 bg-muted rounded text-xs">
                              {index + 1}. {stage.title}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
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
                        title="Duplicate template"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openFlowBuilder(flow.id)}
                        title="Edit with drag-and-drop editor"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteFlow(flow.id)}
                        title="Delete template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="font-medium">Base URL:</span> 
                      <span className="text-muted-foreground ml-1">{flow.base_url}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => openFlowBuilder(flow.id)}
                        className="flex-1"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Edit Template
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openCustomerPreview(flow.id)}
                        className="flex-1"
                      >
                        <Smartphone className="w-4 h-4 mr-2" />
                        Preview Mobile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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