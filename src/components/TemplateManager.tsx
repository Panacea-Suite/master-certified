import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, Edit3, Eye, Plus, Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FlowEditor } from './FlowEditor';
import CustomerFlowExperience from './CustomerFlowExperience';
import TemplatePreview from './TemplatePreview';
import { FLOW_TEMPLATES } from '@/data/flowTemplates';
import { useFlowManager } from '@/hooks/useFlowManager';

interface SystemTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  pages: any[];
  designConfig: any;
  tags?: string[];
}

interface UserTemplate {
  id: string;
  name: string;
  template_description?: string;
  template_tags?: string[];
  flow_config: any;
  created_at: string;
  updated_at: string;
}

const TemplateManager: React.FC = () => {
  const [systemTemplates, setSystemTemplates] = useState<SystemTemplate[]>([]);
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<any>(null);
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [previewMode, setPreviewMode] = useState<'template' | 'customer' | null>(null);

  const { toast } = useToast();
  const { createFlowAtomic, deleteFlow, fetchFlows } = useFlowManager();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      // Load system templates from flowTemplates.ts
      const systemTemps = FLOW_TEMPLATES.map(template => ({
        id: template.id,
        name: template.name,
        description: template.description || 'System template',
        category: template.category || 'general',
        pages: template.pages,
        designConfig: template.designConfig,
        tags: []
      }));

      // Load system templates from database (if any)
      const { data: dbSystemTemplates } = await supabase
        .from('flows')
        .select('*')
        .eq('is_system_template', true);

      if (dbSystemTemplates) {
        const dbSystemTemps = dbSystemTemplates.map(template => {
          const flowConfig = template.flow_config as any;
          return {
            id: template.id,
            name: template.name,
            description: template.template_description || 'System template',
            category: template.template_category || 'database',
            pages: flowConfig?.pages || [],
            designConfig: flowConfig?.designConfig || {
              backgroundStyle: 'solid' as const,
              colorScheme: 'primary' as const,
              borderStyle: 'rounded' as const,
              dividerStyle: 'line' as const,
              cardStyle: 'elevated' as const,
              spacing: 'comfortable' as const
            },
            tags: template.template_tags || []
          };
        });
        systemTemps.push(...dbSystemTemps);
      }

      // Load user templates
      const { data: userTemps } = await supabase
        .from('flows')
        .select('*')
        .eq('is_template', true)
        .eq('is_system_template', false);

      setSystemTemplates(systemTemps);
      setUserTemplates(userTemps || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromScratch = () => {
    setEditTemplate(null);
    setShowEditor(true);
    setPreviewMode('template');
  };

  const handleUseTemplate = async (template: SystemTemplate | UserTemplate) => {
    try {
      // Get first brand for the user
      const { data: brandData } = await supabase
        .from('brands')
        .select('id, name, logo_url, brand_colors')
        .limit(1)
        .maybeSingle();

      if (!brandData) {
        toast({
          title: "No Brand Found",
          description: "Please create a brand first before using templates",
          variant: "destructive",
        });
        return;
      }

      let flowConfig: any;
      
      if ('pages' in template) {
        // System template from flowTemplates.ts
        flowConfig = {
          pages: template.pages,
          designConfig: template.designConfig
        };
      } else {
        // User template or database template
        flowConfig = template.flow_config;
      }

      await createFlowAtomic(
        `${template.name} Flow`,
        brandData.id,
        flowConfig,
        `${template.name} Campaign`
      );

      toast({
        title: "Success",
        description: "Flow created from template successfully",
      });
    } catch (error) {
      console.error('Error creating flow from template:', error);
      toast({
        title: "Error",
        description: "Failed to create flow from template",
        variant: "destructive",
      });
    }
  };

  const handleEditAsNew = (template: SystemTemplate | UserTemplate) => {
    setEditTemplate(template);
    setShowEditor(true);
    setPreviewMode('template');
  };

  const handlePreviewTemplate = (template: SystemTemplate | UserTemplate) => {
    setPreviewTemplate(template);
    setPreviewMode('customer');
  };

  const handleDeleteUserTemplate = async (templateId: string) => {
    try {
      await deleteFlow(templateId);
      await loadTemplates();
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handleEditorSave = async (flowData: any) => {
    try {
      // Get first brand for the user
      const { data: brandData } = await supabase
        .from('brands')
        .select('id, name, logo_url, brand_colors')
        .limit(1)
        .maybeSingle();

      if (!brandData) {
        toast({
          title: "No Brand Found", 
          description: "Please create a brand first",
          variant: "destructive",
        });
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to save templates",
          variant: "destructive",
        });
        return;
      }

      // Create template directly in flows table (not using createFlowAtomic)
      // This ensures we create a user template, not a system template
      const { data: newTemplate, error: insertError } = await supabase
        .from('flows')
        .insert({
          name: flowData.name || 'Custom Template',
          flow_config: flowData.flow_config,
          is_template: true,
          is_system_template: false, // Explicitly set as user template
          template_category: flowData.template_category || 'custom',
          template_description: flowData.description || `Custom template based on ${editTemplate?.name || 'system template'}`,
          template_tags: flowData.template_tags || [],
          created_by: user.id,
          campaign_id: null // Templates don't need campaigns
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to save template: ${insertError.message}`);
      }

      setShowEditor(false);
      setEditTemplate(null);
      await loadTemplates();

      toast({
        title: "Success",
        description: "Template saved to your templates successfully",
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const filteredSystemTemplates = systemTemplates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === 'all' || template.category === selectedCategory)
  );

  const filteredUserTemplates = userTemplates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = ['all', ...Array.from(new Set(systemTemplates.map(t => t.category)))];

  const renderTemplateCard = (template: SystemTemplate | UserTemplate, isUserTemplate = false) => (
    <Card key={template.id} className="group hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{template.name}</CardTitle>
            <CardDescription className="mt-1">
              {'description' in template ? template.description : template.template_description}
            </CardDescription>
          </div>
          {!isUserTemplate && (
            <Badge variant="secondary" className="ml-2">System</Badge>
          )}
        </div>
        
        {/* Tags */}
        {'tags' in template && template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {template.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePreviewTemplate(template)}
            className="flex-1 min-w-[100px]"
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          
          <Button
            variant="default"
            size="sm"
            onClick={() => handleUseTemplate(template)}
            className="flex-1 min-w-[100px]"
          >
            <Copy className="h-4 w-4 mr-1" />
            Use Template
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditAsNew(template)}
            className="flex-1 min-w-[100px]"
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Edit as New
          </Button>
          
          {isUserTemplate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeleteUserTemplate(template.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Template Manager</h1>
          <p className="text-muted-foreground">Create, edit, and manage your flow templates</p>
        </div>
        
        <Button onClick={handleCreateFromScratch} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create from Scratch
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="system" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="system">System Templates</TabsTrigger>
          <TabsTrigger value="my-templates">My Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="system" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSystemTemplates.length > 0 ? (
              filteredSystemTemplates.map(template => renderTemplateCard(template))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No system templates found</p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="my-templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUserTemplates.length > 0 ? (
              filteredUserTemplates.map(template => renderTemplateCard(template, true))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">
                  No custom templates yet. Create your first template by clicking "Create from Scratch" or editing an existing template.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Flow Editor Modal */}
      {showEditor && (
        <FlowEditor
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false);
            setEditTemplate(null);
          }}
          onSave={handleEditorSave}
          templateToEdit={editTemplate}
        />
      )}

      {/* Preview Modal */}
      {previewMode === 'customer' && previewTemplate && (
        // Check if this is a flowTemplates.ts template (has 'pages' property)
        'pages' in previewTemplate ? (
          <TemplatePreview 
            template={previewTemplate}
            onClose={() => {
              setPreviewTemplate(null);
              setPreviewMode(null);
            }}
          />
        ) : (
          <CustomerFlowExperience
            flowId={previewTemplate.id}
            qrCode="preview-template"
          />
        )
      )}
    </div>
  );
};

export default TemplateManager;