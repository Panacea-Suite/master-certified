import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smartphone, Layout, CheckCircle, Users, MessageSquare, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { FlowEditor } from './FlowEditor';

interface FlowTemplate {
  id: string;
  name: string;
  template_category: string;
  flow_config: any;
  created_by: string | null;
}

interface FlowTemplateSelectorProps {
  onSelectTemplate: (template: FlowTemplate | null) => void;
  onClose: () => void;
  isOpen: boolean;
}

const categoryIcons = {
  product_launch: Layout,
  event: Users,
  survey: MessageSquare,
  custom: Plus
};

const categoryLabels = {
  product_launch: 'Product Launch',
  event: 'Event Registration', 
  survey: 'Survey & Feedback',
  custom: 'Custom Templates'
};

export const FlowTemplateSelector: React.FC<FlowTemplateSelectorProps> = ({
  onSelectTemplate,
  onClose,
  isOpen
}) => {
  const [templates, setTemplates] = useState<FlowTemplate[]>([]);
  const [userTemplates, setUserTemplates] = useState<FlowTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<FlowTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      
      // Fetch system templates (created_by is null)
      const { data: systemTemplates, error: systemError } = await supabase
        .from('flows')
        .select('*')
        .eq('is_template', true)
        .is('created_by', null);

      if (systemError) throw systemError;

      // Fetch user templates (created by current user)
      const { data: { user } } = await supabase.auth.getUser();
      let customTemplates: FlowTemplate[] = [];
      
      if (user) {
        const { data: customTemplatesData, error: customError } = await supabase
          .from('flows')
          .select('*')
          .eq('is_template', true)
          .eq('created_by', user.id);

        if (customError) throw customError;
        customTemplates = customTemplatesData || [];
      }

      setTemplates(systemTemplates || []);
      setUserTemplates(customTemplates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseTemplate = (template: FlowTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  const handleCustomizeTemplate = (template: FlowTemplate) => {
    setSelectedTemplate(template);
    setShowEditor(true);
  };

  const handleCreateFromScratch = () => {
    setSelectedTemplate(null);
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setSelectedTemplate(null);
  };

  const handleEditorSave = (flowData: any) => {
    onSelectTemplate(flowData);
    setShowEditor(false);
    onClose();
  };

  const renderTemplateCard = (template: FlowTemplate, showCustomize: boolean = true) => {
    const Icon = categoryIcons[template.template_category as keyof typeof categoryIcons] || Layout;
    const components = template.flow_config?.components || [];
    
    return (
      <Card key={template.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-5 w-5 text-primary" />
            <Badge variant="secondary" className="text-xs">
              {categoryLabels[template.template_category as keyof typeof categoryLabels] || template.template_category}
            </Badge>
          </div>
          <CardTitle className="text-lg">{template.name}</CardTitle>
          <CardDescription className="text-sm">
            {components.length} steps • Mobile optimized
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Preview of flow steps */}
            <div className="text-xs text-muted-foreground">
              <div className="space-y-1">
                {components.slice(0, 3).map((component: any, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                      <CheckCircle className="h-2 w-2 text-primary" />
                    </div>
                    <span>{component.config?.title || component.type}</span>
                  </div>
                ))}
                {components.length > 3 && (
                  <div className="text-xs text-muted-foreground ml-6">
                    +{components.length - 3} more steps
                  </div>
                )}
              </div>
            </div>

            {/* Mobile preview indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Smartphone className="h-3 w-3" />
              <span>Mobile-first design</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                size="sm" 
                onClick={() => handleUseTemplate(template)}
                className="flex-1"
              >
                Use Template
              </Button>
              {showCustomize && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleCustomizeTemplate(template)}
                  className="flex-1"
                >
                  Customize
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (showEditor) {
    return (
      <FlowEditor
        isOpen={showEditor}
        onClose={handleEditorClose}
        onSave={handleEditorSave}
        templateToEdit={selectedTemplate}
      />
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Choose a Flow Template</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="templates" className="h-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates">System Templates</TabsTrigger>
            <TabsTrigger value="custom">My Templates</TabsTrigger>
            <TabsTrigger value="create">Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                {templates.map(template => renderTemplateCard(template))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
              {userTemplates.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  <Layout className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No custom templates yet</p>
                  <p className="text-sm">Create your first template by customizing a system template</p>
                </div>
              ) : (
                userTemplates.map(template => renderTemplateCard(template, false))
              )}
            </div>
          </TabsContent>

          <TabsContent value="create" className="flex items-center justify-center h-48">
            <div className="text-center space-y-4">
              <Plus className="h-16 w-16 mx-auto text-primary opacity-50" />
              <div>
                <h3 className="text-lg font-medium">Create Custom Flow</h3>
                <p className="text-sm text-muted-foreground">
                  Start with a blank canvas and build your own flow
                </p>
              </div>
              <Button onClick={handleCreateFromScratch} size="lg">
                Start Building
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};