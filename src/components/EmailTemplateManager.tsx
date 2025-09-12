import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { toast } from '@/hooks/use-toast';
import { Mail, Save, Eye, Edit, Plus, Palette, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EmailComponentPalette } from './email-editor/EmailComponentPalette';
import { EmailPreview } from './email-editor/EmailPreview';
import { EmailComponentEditor } from './email-editor/EmailComponentEditor';

interface EmailComponent {
  id: string;
  type: string;
  config: any;
  order: number;
}

interface EmailTemplate {
  id: string;
  template_type: string;
  subject: string;
  preview_text: string | null;
  heading: string;
  message: string;
  button_text: string;
  footer_text: string | null;
  from_name: string;
  from_email: string;
  reply_to_email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  email_components?: EmailComponent[];
}

const templateTypes = [
  { value: 'signup' as const, label: 'Sign Up Confirmation' },
  { value: 'login' as const, label: 'Magic Link Login' },
  { value: 'recovery' as const, label: 'Password Recovery' },
  { value: 'email_change' as const, label: 'Email Change Confirmation' },
];

export const EmailTemplateManager: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<EmailComponent | null>(null);
  const [emailComponents, setEmailComponents] = useState<EmailComponent[]>([]);
  const [templateForm, setTemplateForm] = useState({
    template_type: '',
    subject: '',
    preview_text: '',
    heading: '',
    message: '',
    button_text: '',
    footer_text: '',
    from_name: 'Panacea Certified',
    from_email: 'noreply@certified.panaceasuite.io',
    reply_to_email: 'support@panaceasuite.io',
  });

  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('template_type');

      if (error) throw error;
      
      const templatesWithComponents = (data || []).map(template => ({
        ...template,
        email_components: (template as any).email_components || []
      })) as EmailTemplate[];
      
      setTemplates(templatesWithComponents);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateNextId = () => {
    return `component_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const addEmailComponent = (componentType: string) => {
    const defaultConfigs: Record<string, any> = {
      email_header: { title: 'Your Brand', padding: 20, backgroundColor: '#ffffff' },
      email_heading: { text: 'Welcome!', fontSize: '24', fontWeight: 'bold', textAlign: 'center', textColor: '#333333', padding: 16 },
      email_text: { text: 'Thank you for signing up. We\'re excited to have you on board!', fontSize: '16', textAlign: 'left', textColor: '#333333', padding: 16 },
      email_button: { buttonText: 'Get Started', buttonUrl: '#', buttonBgColor: '#5F57FF', buttonTextColor: '#ffffff', buttonAlign: 'center', borderRadius: 6, padding: 20 },
      email_image: { imageUrl: '', altText: 'Image', imageAlign: 'center', maxWidth: 600, padding: 16 },
      email_divider: { padding: 16, backgroundColor: '#ffffff' },
      email_spacer: { height: 40, padding: 0, backgroundColor: '#ffffff' },
      email_footer: { footerText: 'If you no longer wish to receive these emails, you can unsubscribe here.', padding: 20, backgroundColor: '#f8f9fa' }
    };

    const newComponent: EmailComponent = {
      id: generateNextId(),
      type: componentType,
      config: defaultConfigs[componentType] || {},
      order: emailComponents.length
    };

    setEmailComponents([...emailComponents, newComponent]);
    setSelectedComponent(newComponent);
  };

  const updateEmailComponent = (config: any) => {
    if (!selectedComponent) return;
    
    const updatedComponents = emailComponents.map(comp =>
      comp.id === selectedComponent.id ? { ...comp, config } : comp
    );
    
    setEmailComponents(updatedComponents);
    setSelectedComponent({ ...selectedComponent, config });
  };

  const saveTemplate = async () => {
    try {
      if (selectedTemplate) {
        // Update existing template with email components
        const { error } = await supabase
          .from('email_templates')
          .update({
            ...templateForm,
            email_components: emailComponents as any,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedTemplate.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Email template updated successfully",
        });
      } else {
        // Create new template - deactivate existing first
        if (templateForm.template_type) {
          await supabase
            .from('email_templates')
            .update({ is_active: false })
            .eq('template_type', templateForm.template_type);
        }

        const { error } = await supabase
          .from('email_templates')
          .insert({
            template_type: templateForm.template_type,
            subject: templateForm.subject,
            preview_text: templateForm.preview_text || null,
            heading: templateForm.heading,
            message: templateForm.message,
            button_text: templateForm.button_text,
            footer_text: templateForm.footer_text || null,
            from_name: templateForm.from_name,
            from_email: templateForm.from_email,
            reply_to_email: templateForm.reply_to_email,
            email_components: emailComponents as any,
            is_active: true,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          });

        if (error) throw error;
        toast({
          title: "Success",
          description: "Email template created successfully",
        });
      }

      loadTemplates();
      setIsEditing(false);
      setSelectedTemplate(null);
      setEmailComponents([]);
      setSelectedComponent(null);
      setTemplateForm({
        template_type: '',
        subject: '',
        preview_text: '',
        heading: '',
        message: '',
        button_text: '',
        footer_text: '',
        from_name: 'Panacea Certified',
        from_email: 'noreply@certified.panaceasuite.io',
        reply_to_email: 'support@panaceasuite.io',
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save email template",
        variant: "destructive",
      });
    }
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEmailComponents(template.email_components || []);
    setSelectedComponent(null);
    setTemplateForm({
      template_type: template.template_type,
      subject: template.subject,
      preview_text: template.preview_text || '',
      heading: template.heading,
      message: template.message,
      button_text: template.button_text,
      footer_text: template.footer_text || '',
      from_name: template.from_name,
      from_email: template.from_email,
      reply_to_email: template.reply_to_email,
    });
    setIsEditing(true);
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setEmailComponents([]);
    setSelectedComponent(null);
    setTemplateForm({
      template_type: '',
      subject: '',
      preview_text: '',
      heading: '',
      message: '',
      button_text: '',
      footer_text: '',
      from_name: 'Panacea Certified',
      from_email: 'noreply@certified.panaceasuite.io',
      reply_to_email: 'support@panaceasuite.io',
    });
    setIsEditing(true);
  };

  const generatePreview = (template: EmailTemplate) => {
    const actionUrl = "https://example.com/auth/verify?token=sample_token";
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${template.subject}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="padding: 40px 20px;">
              <h1 style="color: #333; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">
                ${template.heading}
              </h1>
              
              <p style="color: #333; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                ${template.message}
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${actionUrl}" style="background-color: #5F57FF; color: white; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-size: 16px; font-weight: 600; display: inline-block;">
                  ${template.button_text}
                </a>
              </div>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 6px;">
                <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
                  Or copy and paste this link in your browser:
                </p>
                <p style="color: #333; font-size: 14px; word-break: break-all; margin: 0; padding: 10px; background-color: #fff; border: 1px solid #e9ecef; border-radius: 4px;">
                  ${actionUrl}
                </p>
              </div>
              
              <p style="color: #898989; font-size: 12px; margin: 30px 0 0 0;">
                ${template.footer_text}
              </p>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Fullscreen editor view
  if (isEditing) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4">
            <div className="flex items-center gap-2 flex-1">
              <Palette className="w-5 h-5" />
              <span className="font-semibold">
                {selectedTemplate ? 'Edit Email Template' : 'Create New Email Template'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={saveTemplate} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Template
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedTemplate(null);
                  setEmailComponents([]);
                  setSelectedComponent(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>

        {/* Template Configuration */}
        <div className="border-b bg-muted/30 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="template_type">Template Type</Label>
              <select
                id="template_type"
                className="w-full p-2 border rounded"
                value={templateForm.template_type}
                onChange={(e) => setTemplateForm({ ...templateForm, template_type: e.target.value })}
              >
                <option value="">Select Template Type</option>
                {templateTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                placeholder="Email subject"
              />
            </div>
            <div>
              <Label htmlFor="heading">Heading</Label>
              <Input
                id="heading"
                value={templateForm.heading}
                onChange={(e) => setTemplateForm({ ...templateForm, heading: e.target.value })}
                placeholder="Email heading"
              />
            </div>
            <div>
              <Label htmlFor="preview_text">Preview Text</Label>
              <Input
                id="preview_text"
                value={templateForm.preview_text}
                onChange={(e) => setTemplateForm({ ...templateForm, preview_text: e.target.value })}
                placeholder="Preview text (optional)"
              />
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="h-full flex">
            {isPaletteCollapsed && (
              <div className="w-8 flex items-center justify-center border-r bg-background/60">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Expand components palette"
                  onClick={() => setIsPaletteCollapsed(false)}
                  className="h-8 w-8"
                  title="Expand components"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            <ResizablePanelGroup direction="horizontal" className="h-full flex-1">
              {!isPaletteCollapsed && (
                <>
                  {/* Component Palette */}
                  <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                    <div className="h-full pr-2 relative">
                      <div className="absolute right-2 top-2 z-10">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Collapse palette"
                          onClick={() => setIsPaletteCollapsed(true)}
                          className="h-8 w-8"
                          title="Collapse components"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <EmailComponentPalette onAddComponent={addEmailComponent} />
                    </div>
                  </ResizablePanel>

                  <ResizableHandle withHandle />
                </>
              )}

              {/* Email Preview */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full px-2">
                  <EmailPreview
                    components={emailComponents}
                    darkMode={darkMode}
                    onToggleDarkMode={() => setDarkMode(!darkMode)}
                    onSelectComponent={setSelectedComponent}
                    onComponentsChange={setEmailComponents}
                    onAddComponent={addEmailComponent}
                    selectedComponentId={selectedComponent?.id}
                    templateConfig={{
                      subject: templateForm.subject,
                      previewText: templateForm.preview_text,
                      from_name: templateForm.from_name,
                      from_email: templateForm.from_email,
                    }}
                  />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Component Editor */}
              <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
                <div className="h-full pl-2">
                  {selectedComponent ? (
                    <EmailComponentEditor
                      component={selectedComponent}
                      onUpdate={updateEmailComponent}
                    />
                  ) : (
                    <div className="p-6 h-full flex items-center justify-center text-center">
                      <div className="space-y-2">
                        <Palette className="w-12 h-12 mx-auto text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          Select a component to edit its properties
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Customize authentication email templates</p>
        </div>
        <Button
          onClick={handleCreateNew}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Template
        </Button>
      </div>

      <Tabs defaultValue={templates[0]?.template_type || 'signup'} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {templateTypes.map((type) => (
            <TabsTrigger key={type.value} value={type.value}>
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {templateTypes.map((type) => {
          const template = templates.find(t => t.template_type === type.value as string);
          
          return (
            <TabsContent key={type.value} value={type.value}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    {type.label}
                  </CardTitle>
                  <div className="flex gap-2">
                    {template && (
                      <>
                        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                            <DialogHeader>
                              <DialogTitle>Email Preview - {type.label}</DialogTitle>
                            </DialogHeader>
                            <div className="border rounded-lg">
                              <iframe
                                srcDoc={generatePreview(template)}
                                className="w-full h-[600px] border-none"
                                title="Email Preview"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTemplate(template)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {template ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Subject</Label>
                          <p className="text-sm text-muted-foreground">{template.subject}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Components</Label>
                          <p className="text-sm text-muted-foreground">
                            {template.email_components?.length || 0} email components
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                        <div>From: {template.from_name} &lt;{template.from_email}&gt;</div>
                        <div>Reply To: {template.reply_to_email}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No template configured for {type.label}</p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={handleCreateNew}
                      >
                        Create Template
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};