import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Eye, Settings, Copy, Smartphone } from 'lucide-react';
import { FlowEditor } from './FlowEditor';
import { FlowTemplateSelector } from './FlowTemplateSelector';
import CustomerFlowExperience from './CustomerFlowExperience';

interface Flow {
  id: string;
  name: string;
  campaign_id?: string;
  flow_config?: any;
  base_url?: string;
  created_at: string;
  template_category?: string;
  created_by?: string | null;
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
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [previewMode, setPreviewMode] = useState<'editor' | 'customer' | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [brandData, setBrandData] = useState<{ id: string; name: string; logo_url?: string; brand_colors?: any } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchFlows();
  }, []);

  const fetchFlows = async () => {
    try {
      // Fetch flows and brand data in parallel
      const [flowsResponse, brandResponse] = await Promise.all([
        supabase
          .from('flows')
          .select(`
            *,
            campaigns (
              name
            )
          `)
          .order('created_at', { ascending: false }),
        supabase
          .from('brands')
          .select('id, name, logo_url, brand_colors')
          .maybeSingle()
      ]);

      if (flowsResponse.error) throw flowsResponse.error;
      if (brandResponse.error) throw brandResponse.error;

      setFlows(flowsResponse.data || []);
      setBrandData(brandResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
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

      // Create flow template with empty sections for drag-and-drop editor
      const flowConfig = {
        version: "3.0",
        sections: [] // Empty sections array for new page builder
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

      // Open the flow editor immediately
      openFlowEditor(data);
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

  const openFlowEditor = (flow: Flow) => {
    setSelectedFlow(flow);
    setSelectedFlowId(flow.id);
    setPreviewMode('editor');
  };

  const openTemplateSelector = () => {
    setShowTemplateSelector(true);
  };

  const openCustomerPreview = (flowId: string) => {
    setSelectedFlowId(flowId);
    setPreviewMode('customer');
  };

  const closeModals = () => {
    setSelectedFlowId(null);
    setSelectedFlow(null);
    setPreviewMode(null);
    setShowTemplateSelector(false);
  };

  const convertFlowToTemplate = (flow: Flow) => {
    return {
      id: flow.id,
      name: flow.name,
      template_category: flow.template_category || 'custom',
      flow_config: flow.flow_config,
      created_by: flow.created_by || null
    };
  };

  const handleTemplateSelect = async (template: any) => {
    if (template) {
      try {
        // Check if this is a pre-built template (has 'pages' property) or database template
        if ('pages' in template) {
          // Pre-built template from flowTemplates.ts - create a new flow in the database
          const { data: fullBrandData } = await supabase
            .from('brands')
            .select('id, name, logo_url, brand_colors')
            .limit(1)
            .maybeSingle();

          if (!fullBrandData) {
            toast({
              title: "Error",
              description: "Please create a brand first before using templates",
              variant: "destructive",
            });
            return;
          }

          // Check if there's already a campaign for this brand, or create one
          let { data: existingCampaign } = await supabase
            .from('campaigns')
            .select('id')
            .eq('brand_id', fullBrandData.id)
            .eq('name', `${template.name} Campaign`)
            .maybeSingle();

          let campaignId;
          if (existingCampaign) {
            campaignId = existingCampaign.id;
          } else {
            // Create a new campaign for the template
            const { data: campaignData, error: campaignError } = await supabase
              .from('campaigns')
              .insert([{
                name: `${template.name} Campaign`,
                description: `Campaign for ${template.name} flow`,
                brand_id: fullBrandData.id,
                approved_stores: ['Store A', 'Store B', 'Store C']
              }])
              .select('id')
              .single();

            if (campaignError) throw campaignError;
            campaignId = campaignData.id;
          }

          // Create the flow in the database
          const flowConfig = {
            pages: template.pages,
            design_template_id: null,
            globalHeader: {
              showHeader: true,
              brandName: fullBrandData?.name || 'Brand',
              logoUrl: fullBrandData?.logo_url || '',
              backgroundColor: (fullBrandData?.brand_colors as any)?.primary || '#3b82f6',
              logoSize: 'medium'
            },
            theme: {
              backgroundColor: '#ffffff'
            }
          };

          const { data: newFlow, error: flowError } = await supabase
            .from('flows')
            .insert([{
              name: template.name,
              campaign_id: campaignId,
              base_url: `${window.location.origin}/flow/${campaignId}`,
              flow_config: flowConfig
            }])
            .select(`
              *,
              campaigns (
                name
              )
            `)
            .single();

          if (flowError) throw flowError;

          // Add to flows list and open editor
          setFlows(prevFlows => [newFlow, ...prevFlows]);
          
          // Make sure we set the selected flow properly
          setSelectedFlow(newFlow);
          setSelectedFlowId(newFlow.id);
          setPreviewMode('editor');

          console.log('Created new flow from template:', newFlow);
          
          toast({
            title: "Success",
            description: "Flow created from template successfully",
          });
        } else {
          // Database template - use as is
          openFlowEditor(template);
        }
      } catch (error) {
        console.error('Error creating flow from template:', error);
        toast({
          title: "Error",
          description: "Failed to create flow from template",
          variant: "destructive",
        });
      }
    }
    setShowTemplateSelector(false);
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
              Create New Flow
            </Button>
            <Button onClick={openTemplateSelector} variant="outline" className="mb-0">
              Choose from Templates
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Create a new page using our drag-and-drop editor, or choose from pre-built templates.
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
                      
                       {/* Page Sections Preview */}
                       <div className="mt-3">
                         <div className="text-sm font-medium mb-2">Page Sections:</div>
                         <div className="flex gap-2 flex-wrap">
                           {flow.flow_config?.sections?.length > 0 ? (
                             flow.flow_config.sections.map((section: any, index: number) => (
                               <div key={index} className="px-2 py-1 bg-muted rounded text-xs">
                                 {section.type}
                               </div>
                             ))
                           ) : (
                             <div className="px-2 py-1 bg-muted rounded text-xs text-muted-foreground">
                               No sections yet
                             </div>
                           )}
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
                         onClick={() => openFlowEditor(flow)}
                         title="Edit with drag-and-drop page editor"
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
                         onClick={() => openFlowEditor(flow)}
                         className="flex-1"
                       >
                         <Settings className="w-4 h-4 mr-2" />
                         Edit Page
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

      {/* Flow Editor Modal */}
      {previewMode === 'editor' && selectedFlow && (
        <FlowEditor
          isOpen={true}
          onClose={closeModals}
          brandData={brandData}
          onSave={async (pageData) => {
            console.log('FlowManager onSave called with:', pageData);
            console.log('selectedFlow:', selectedFlow);
            console.log('selectedFlow.id:', selectedFlow?.id);
            
            try {
              // Check if we have a valid flow ID
              if (!selectedFlow?.id) {
                console.error('No valid flow ID found for saving. selectedFlow:', selectedFlow);
                toast({
                  title: "Error",
                  description: "No valid flow ID found. Please try creating a new flow.",
                  variant: "destructive",
                });
                return;
              }

              // Update the existing flow with the new data
              const { error } = await supabase
                .from('flows')
                .update({
                  name: pageData.name,
                  flow_config: pageData.flow_config,
                })
                .eq('id', selectedFlow.id);

              if (error) {
                console.error('Error updating flow:', error);
                toast({
                  title: "Error",
                  description: "Failed to save page changes",
                  variant: "destructive",
                });
                return;
              }

              console.log('Page saved successfully');
              toast({
                title: "Success", 
                description: "Page changes saved successfully",
              });
              
              fetchFlows(); // Refresh the flows list
              closeModals();
            } catch (error) {
              console.error('Error in onSave:', error);
              toast({
                title: "Error",
                description: "Failed to save page changes",
                variant: "destructive",
              });
            }
          }}
          templateToEdit={selectedFlow ? convertFlowToTemplate(selectedFlow) : null}
        />
      )}

      {/* Template Selector Modal */}
      <FlowTemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={handleTemplateSelect}
      />

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