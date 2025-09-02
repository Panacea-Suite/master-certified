import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, Edit3, Plus, Search, Trash2, TestTube2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FlowEditor } from './FlowEditor';
import { FLOW_TEMPLATES } from '@/data/flowTemplates';
import { useFlowManager } from '@/hooks/useFlowManager';
import { useAuth } from '@/hooks/useAuth';
import { TestLinkModal } from './TestLinkModal';

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
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [brandData, setBrandData] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const [testExpiresIn, setTestExpiresIn] = useState(0);
  const [creatingTestLink, setCreatingTestLink] = useState(false);

  const { toast } = useToast();
  const { profile } = useAuth();
  const { createFlowAtomic, deleteFlow, fetchFlows } = useFlowManager();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      // GUARDRAIL: Brands should never see system templates directly
      // Only master_admin can see system templates
      let systemTemps: SystemTemplate[] = [];
      
      if (profile?.role === 'master_admin') {
        console.log('🔒 Master Admin: Loading published system templates');
        // Load published system templates from the new templates table (ADMIN ONLY)
        const { data: publishedSystemTemplates } = await supabase
          .from('templates')
          .select('*')
          .eq('kind', 'system')
          .eq('status', 'published');

        systemTemps = (publishedSystemTemplates || []).map(template => {
          // Parse the content JSON safely
          let content: any = {};
          try {
            content = typeof template.content === 'string' 
              ? JSON.parse(template.content) 
              : template.content || {};
          } catch (error) {
            console.error('Error parsing template content:', error);
            content = {};
          }

          return {
            id: template.id,
            name: template.name,
            description: template.description || 'System template',
            category: 'certification', // Default category for now
            pages: content.pages || [],
            designConfig: content.designConfig || {
              backgroundStyle: 'solid' as const,
              colorScheme: 'primary' as const,
              borderStyle: 'rounded' as const,
              dividerStyle: 'line' as const,
              cardStyle: 'elevated' as const,
              spacing: 'comfortable' as const
            },
            tags: []
          };
        });
      } else {
        console.log('🔒 Brand User: System templates hidden for security');
      }

      // GUARDRAIL: Load only user's own brand templates (cloned from system templates)
      console.log('🔒 Loading user brand templates only');
      const { data: userTemps } = await supabase
        .from('flows')
        .select('*')
        .eq('is_template', true)
        .eq('is_system_template', false); // Only user/brand templates, not system templates

      setSystemTemplates(systemTemps); // Empty for brands
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
        // System template from templates table
        flowConfig = {
          pages: template.pages,
          designConfig: template.designConfig
        };
      } else {
        // Brand template - clone for campaign use
        flowConfig = template.flow_config;
      }

      // This will create an independent campaign flow (clones the template)
      await createFlowAtomic(
        `${template.name} Flow`,
        brandData.id,
        flowConfig,
        `${template.name} Campaign`
      );

      toast({
        title: "Success",
        description: "Independent campaign flow created from template successfully",
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

  const handleEditAsNew = async (template: SystemTemplate | UserTemplate) => {
    try {
      // System templates must be cloned to brand templates
      if ('pages' in template) {
        // This is a system template - clone it first
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast({
            title: "Authentication Error",
            description: "You must be logged in to edit templates",
            variant: "destructive",
          });
          return;
        }

        const { data: brandData } = await supabase
          .from('brands')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (!brandData) {
          toast({
            title: "No Brand Found",
            description: "Please create a brand first before editing system templates",
            variant: "destructive",
          });
          return;
        }

        // Clone system template from templates table
        const { data: cloneResult, error: cloneError } = await supabase
          .from('templates')
          .insert({
            kind: 'brand',
            status: 'draft',
            name: `${template.name} (Copy)`,
            description: template.description,
            created_by: user.id,
            brand_id: brandData.id,
            base_template_id: template.id,
            schema: { pages: template.pages, designConfig: template.designConfig },
            content: { pages: template.pages, designConfig: template.designConfig }
          })
          .select()
          .single();

        if (cloneError) throw cloneError;

        toast({
          title: "Template Cloned",
          description: `System template "${template.name}" has been cloned to your brand templates for editing`,
        });

        // Refresh templates to show the new brand template
        await loadTemplates();
        return;
      }

      // Brand template - can be edited directly
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to edit templates",
          variant: "destructive",
        });
        return;
      }

      const { data: brandData } = await supabase
        .from('brands')
        .select('id, name, logo_url, brand_colors')
        .eq('user_id', user.id)
        .maybeSingle();

      console.log('Brand data fetched for edit as new:', brandData);

      // Import and process template data using unified processor
      const { processTemplateData } = await import('@/utils/templateProcessor');
      const processedTemplate = processTemplateData(template);
      
      // Convert to template format that FlowEditor expects
      const editorTemplate = {
        ...template,
        flow_config: {
          pages: processedTemplate.pages,
          designConfig: processedTemplate.designConfig
        }
      };
      
      setEditTemplate(editorTemplate);
      setBrandData(brandData); // Pass brand data to FlowEditor
      setShowEditor(true);
    } catch (error) {
      console.error('Error in handleEditAsNew:', error);
      toast({
        title: "Error",
        description: "Failed to prepare template for editing",
        variant: "destructive",
      });
    }
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

  const handleTestAsUser = async (template: SystemTemplate | UserTemplate) => {
    try {
      setCreatingTestLink(true);

      // Get the user's session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create test links",
          variant: "destructive",
        });
        return;
      }

      // Only allow testing system templates
      if (!('pages' in template)) {
        toast({
          title: "Not Supported", 
          description: "Testing is only available for system templates",
          variant: "destructive",
        });
        return;
      }

      const payload = { 
        template_id: template.id,
        app_origin: window.location.origin
      };

      const response = await supabase.functions.invoke('create-test-flow-link', {
        body: payload,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        console.error('Edge function error:', response.error);
        throw new Error(`Failed to create test link: ${response.error.message || 'Unknown error'}`);
      }

      if (!response.data?.success || !response.data?.url) {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response from test link service');
      }

      const { url, expires_in } = response.data;
      setTestUrl(url);
      setTestExpiresIn(expires_in);
      setShowTestModal(true);

      toast({
        title: "Test Link Created",
        description: "Test link generated successfully",
      });

    } catch (error) {
      console.error('Error creating test link:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create test link",
        variant: "destructive",
      });
    } finally {
      setCreatingTestLink(false);
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
    <Card key={template.id} className="group hover:shadow-lg transition-all duration-200 relative">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold">{template.name}</CardTitle>
            <CardDescription className="mt-1">
              {'description' in template ? template.description : template.template_description}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!isUserTemplate && (
              <Badge variant="secondary">System</Badge>
            )}
            {isUserTemplate && (
              <Badge variant="outline">Brand Template</Badge>
            )}
            {isUserTemplate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteUserTemplate(template.id)}
                className="text-destructive hover:text-destructive h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
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
            variant="default"
            size="sm"
            onClick={() => handleUseTemplate(template)}
            className="flex-1 min-w-[120px] px-3 py-2"
          >
            <Copy className="h-4 w-4 mr-2" />
            {!isUserTemplate ? 'Clone & Use' : 'Use Template'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEditAsNew(template)}
            className="flex-1 min-w-[120px] px-3 py-2"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            {('pages' in template) ? 'Clone & Edit' : 'Edit Template'}
          </Button>

          {/* GUARDRAIL: Test button only for master_admin and system templates */}
          {profile?.role === 'master_admin' && !isUserTemplate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleTestAsUser(template)}
              disabled={creatingTestLink}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <TestTube2 className="h-4 w-4 mr-1" />
              {creatingTestLink ? 'Creating...' : 'Test as User'}
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
          <p className="text-muted-foreground">
            {profile?.role === 'master_admin' 
              ? 'Create, edit, and manage system and user templates'
              : 'Manage your brand templates (cloned from system templates)'}
          </p>
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

      <Tabs defaultValue="user" className="w-full">
        <TabsList>
          {/* GUARDRAIL: Only show system templates tab to master_admin */}
          {profile?.role === 'master_admin' && (
            <TabsTrigger value="system">
              System Templates ({filteredSystemTemplates.length})
            </TabsTrigger>
          )}
          <TabsTrigger value="user">
            My Templates ({filteredUserTemplates.length})
          </TabsTrigger>
        </TabsList>

        {/* GUARDRAIL: System templates only visible to master_admin */}
        {profile?.role === 'master_admin' && (
          <TabsContent value="system" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">System Templates</h2>
                <p className="text-sm text-muted-foreground">Published templates available to all brands</p>
              </div>
            </div>

            {filteredSystemTemplates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold mb-2">No System Templates</h3>
                    <p className="text-muted-foreground mb-4">No published system templates available</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSystemTemplates.map((template) => renderTemplateCard(template, false))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="user" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                {profile?.role === 'master_admin' ? 'User Templates' : 'My Templates'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {profile?.role === 'master_admin' 
                  ? 'Templates created by users and brands' 
                  : 'Templates you\'ve created or cloned from system templates'}
              </p>
            </div>
          </div>

          {filteredUserTemplates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">No Templates Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    {profile?.role === 'master_admin' 
                      ? 'No user templates have been created yet'
                      : 'You haven\'t created any templates yet. Clone a system template to get started.'}
                  </p>
                  {profile?.role !== 'master_admin' && (
                    <p className="text-sm text-muted-foreground">
                      💡 Ask your administrator for access to system templates to clone
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredUserTemplates.map((template) => renderTemplateCard(template, true))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Flow Editor Modal */}
      {showEditor && (
        <FlowEditor
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false);
            setEditTemplate(null);
            setBrandData(null);
          }}
          onSave={handleEditorSave}
          templateToEdit={editTemplate}
          brandData={brandData}
        />
      )}

      {/* Test Link Modal */}
      <TestLinkModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        testUrl={testUrl}
        expiresIn={testExpiresIn}
      />
    </div>
  );
};

export default TemplateManager;