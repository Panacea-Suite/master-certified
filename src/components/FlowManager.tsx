import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Eye, Settings, Copy, Smartphone, AlertCircle, RefreshCw } from 'lucide-react';
import { FlowEditor } from './FlowEditor';
import { FlowTemplateSelector } from './FlowTemplateSelector';
import CustomerFlowExperience from './CustomerFlowExperience';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFlowManager, Flow } from '@/hooks/useFlowManager';
import { supabase } from '@/integrations/supabase/client';

const FlowManager = () => {
  const [newFlowName, setNewFlowName] = useState('');
  const [brandData, setBrandData] = useState<{ id: string; name: string; logo_url?: string; brand_colors?: any } | null>(null);
  
  const {
    flows,
    isLoading,
    error,
    selectedFlow,
    selectedFlowId,
    previewMode,
    showTemplateSelector,
    fetchFlows,
    createFlowAtomic,
    duplicateFlow: hookDuplicateFlow,
    deleteFlow: hookDeleteFlow,
    saveFlow,
    openFlowEditor,
    openCustomerPreview,
    openTemplateSelector,
    closeModals,
    logOperation
  } = useFlowManager();

  useEffect(() => {
    const initialize = async () => {
      const result = await fetchFlows();
      if (result.success && result.data?.brand) {
        setBrandData(result.data.brand);
      }
    };
    initialize();
  }, [fetchFlows]);

  const createNewTemplate = async () => {
    if (!newFlowName.trim()) {
      return;
    }

    if (!brandData?.id) {
      // Try to get brand data first
      const { data: brandResult } = await supabase
        .from('brands')
        .select('id, name, logo_url, brand_colors')
        .limit(1)
        .maybeSingle();

      if (!brandResult) {
        return;
      }
      setBrandData(brandResult);
    }

    const flowConfig = {
      version: "3.0",
      sections: []
    };

    const result = await createFlowAtomic(newFlowName, brandData.id, flowConfig);
    if (result.success) {
      setNewFlowName('');
    }
  };

  const handleTemplateSelect = async (template: any) => {
    if (!template) {
      closeModals();
      return;
    }

    try {
      // Check if this is a pre-built template (has 'pages' property) or database template
      if ('pages' in template) {
        // Pre-built template from flowTemplates.ts - create a new flow in the database
        if (!brandData?.id) {
          const { data: fullBrandData } = await supabase
            .from('brands')
            .select('id, name, logo_url, brand_colors')
            .limit(1)
            .maybeSingle();

          if (!fullBrandData) {
            return;
          }
          setBrandData(fullBrandData);
        }

        const flowConfig = {
          pages: template.pages,
          design_template_id: null,
          globalHeader: {
            showHeader: true,
            brandName: brandData?.name || 'Brand',
            logoUrl: brandData?.logo_url || '',
            backgroundColor: (brandData?.brand_colors as any)?.primary || '#3b82f6',
            logoSize: 'medium'
          },
          theme: {
            backgroundColor: '#ffffff'
          }
        };

        await createFlowAtomic(template.name, brandData.id, flowConfig, `${template.name} Campaign`);
      } else {
        // Database template - use as is
        openFlowEditor(template);
      }
    } catch (error) {
      console.error('Error creating flow from template:', error);
    }
    closeModals();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Loading flows...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load flows: {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchFlows()}
              className="ml-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Flow Templates</h1>
        <Button variant="outline" onClick={() => fetchFlows()} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    createNewTemplate();
                  }
                }}
              />
            </div>
            <Button onClick={createNewTemplate} disabled={!newFlowName.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Create New Flow
            </Button>
            <Button onClick={openTemplateSelector} variant="outline">
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
                        Campaign: {flow.campaign_name || 'N/A'} • Created {new Date(flow.created_at).toLocaleDateString()}
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
                        onClick={() => hookDuplicateFlow(flow)}
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
                        onClick={() => hookDeleteFlow(flow.id)}
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
            if (!selectedFlow?.id) {
              console.error('No valid flow ID found for saving');
              return;
            }

            const result = await saveFlow(selectedFlow.id, {
              name: pageData.name,
              flow_config: pageData.flow_config,
            });

            if (result.success) {
              closeModals();
            }
          }}
          templateToEdit={selectedFlow ? convertFlowToTemplate(selectedFlow) : null}
        />
      )}

      {/* Template Selector Modal */}
      <FlowTemplateSelector
        isOpen={showTemplateSelector}
        onClose={closeModals}
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