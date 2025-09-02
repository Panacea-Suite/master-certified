import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Eye, Trash2, Send, Copy, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTemplateManager, SystemTemplate, Brand } from '@/hooks/useTemplateManager';
import { FlowEditor } from '@/components/FlowEditor';
import { FLOW_TEMPLATES } from '@/data/flowTemplates';
import { toast } from 'sonner';

export const SystemTemplateManager: React.FC = () => {
  const {
    systemTemplates,
    brands,
    isLoading,
    loadSystemTemplates,
    loadBrands,
    createSystemTemplate,
    updateSystemTemplate,
    publishSystemTemplate,
    deleteTemplate
  } = useTemplateManager();

  const [activeTab, setActiveTab] = useState('drafts');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<SystemTemplate | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    baseTemplate: ''
  });

  useEffect(() => {
    loadSystemTemplates();
    loadBrands();
  }, []);

  const handleCreateTemplate = async () => {
    if (!newTemplate.name.trim()) {
      toast.error('Template name is required');
      return;
    }

    // Get base template data
    const baseTemplate = FLOW_TEMPLATES.find(t => t.id === newTemplate.baseTemplate);
    if (!baseTemplate) {
      toast.error('Please select a base template');
      return;
    }

    const result = await createSystemTemplate({
      name: newTemplate.name,
      description: newTemplate.description,
      schema: baseTemplate.pages,
      content: baseTemplate
    });

    if (result.success) {
      setIsCreateDialogOpen(false);
      setNewTemplate({ name: '', description: '', baseTemplate: '' });
    }
  };

  const handleEditTemplate = async (template: SystemTemplate) => {
    // System templates should be cloned to brand templates for editing
    if (template.kind === 'system') {
      try {
        // Get user's first brand
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('You must be logged in to edit templates');
          return;
        }

        const { data: brandData } = await supabase
          .from('brands')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (!brandData) {
          toast.error('Please create a brand first before editing system templates');
          return;
        }

        // Fork the system template to a brand template
        const result = await supabase.rpc('brand_fork_system_template', {
          system_tpl_id: template.id,
          target_brand_id: brandData.id
        });

        if (result.error) throw result.error;

        toast.success(`System template "${template.name}" cloned to your brand templates for editing`);
        
        // Reload templates to show the new brand template
        await loadSystemTemplates();
      } catch (error: any) {
        console.error('Error cloning system template:', error);
        toast.error('Failed to clone system template for editing');
      }
    } else {
      // Brand templates can be edited directly
      setSelectedTemplate(template);
      setIsEditorOpen(true);
    }
  };

  const handleSaveTemplate = async (templateData: any) => {
    if (!selectedTemplate) return;

    const result = await updateSystemTemplate(selectedTemplate.id, {
      name: templateData.name, // Update the template name
      content: templateData
    });

    if (result.success) {
      setIsEditorOpen(false);
      setSelectedTemplate(null);
    }
  };

  const handlePublishTemplate = async (template: SystemTemplate) => {
    const result = await publishSystemTemplate(template.id);
    if (result.success) {
      toast.success(`Template "${template.name}" has been published and is now available to all brands`);
    }
  };

  const handleMoveToDraft = async (template: SystemTemplate) => {
    const result = await updateSystemTemplate(template.id, { status: 'draft' });
    if (result.success) {
      toast.success(`Template "${template.name}" has been moved back to draft status`);
    }
  };

  const handleDeleteTemplate = async (template: SystemTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return;
    
    await deleteTemplate(template.id);
  };

  const getStatusBadge = (status: SystemTemplate['status']) => {
    const variants = {
      draft: 'secondary',
      published: 'default',
      deprecated: 'destructive'
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const filterTemplatesByStatus = (status: SystemTemplate['status']) => {
    return systemTemplates.filter(t => t.status === status);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading templates...</div>;
  }

  if (isEditorOpen && selectedTemplate) {
    return (
      <FlowEditor
        isOpen={true}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedTemplate(null);
        }}
        onSave={handleSaveTemplate}
        templateToEdit={{
          ...selectedTemplate,
          ...selectedTemplate.content,
          id: selectedTemplate.id,
          kind: selectedTemplate.kind,
          status: selectedTemplate.status
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Templates</h1>
          <p className="text-muted-foreground">
            Manage templates that will be available to all brand accounts
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create System Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create System Template</DialogTitle>
              <DialogDescription>
                Create a new system template that will be available to all brands
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Template Name</Label>
                <Input
                  id="name"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter template description"
                />
              </div>
              
              <div>
                <Label htmlFor="baseTemplate">Base Template</Label>
                <Select
                  value={newTemplate.baseTemplate}
                  onValueChange={(value) => setNewTemplate(prev => ({ ...prev, baseTemplate: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select base template" />
                  </SelectTrigger>
                  <SelectContent>
                    {FLOW_TEMPLATES.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateTemplate} className="flex-1">
                  Create Template
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="drafts">
            Drafts ({filterTemplatesByStatus('draft').length})
          </TabsTrigger>
          <TabsTrigger value="published">
            Published ({filterTemplatesByStatus('published').length})
          </TabsTrigger>
          <TabsTrigger value="deprecated">
            Deprecated ({filterTemplatesByStatus('deprecated').length})
          </TabsTrigger>
          <TabsTrigger value="brands">
            Brands ({brands.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drafts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterTemplatesByStatus('draft').map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {getStatusBadge(template.status)}
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Clone & Edit
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handlePublishTemplate(template)}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Publish
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Version {template.version} • Created {new Date(template.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterTemplatesByStatus('published').map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {getStatusBadge(template.status)}
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Clone & Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveToDraft(template)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Move to Draft
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateSystemTemplate(template.id, { status: 'deprecated' })}
                    >
                      Deprecate
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Version {template.version} • Published {new Date(template.updated_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="deprecated" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filterTemplatesByStatus('deprecated').map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {getStatusBadge(template.status)}
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Clone & Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Version {template.version} • Deprecated {new Date(template.updated_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="brands" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <Card key={brand.id}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    {brand.name}
                  </CardTitle>
                  <CardDescription>
                    Owner: {brand.user_display_name} ({brand.user_email})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Created {new Date(brand.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};