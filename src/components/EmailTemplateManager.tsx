import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Mail, Save, Eye, Edit, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
      setTemplates((data || []) as EmailTemplate[]);
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

  const saveTemplate = async (template: Partial<EmailTemplate>) => {
    try {
      if (selectedTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('email_templates')
          .update({
            ...template,
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
        if (template.template_type) {
          await supabase
            .from('email_templates')
            .update({ is_active: false })
            .eq('template_type', template.template_type);
        }

        const { error } = await supabase
          .from('email_templates')
          .insert({
            template_type: template.template_type!,
            subject: template.subject!,
            preview_text: template.preview_text || null,
            heading: template.heading!,
            message: template.message!,
            button_text: template.button_text!,
            footer_text: template.footer_text || null,
            from_name: template.from_name || 'Panacea Certified',
            from_email: template.from_email || 'noreply@certified.panaceasuite.io',
            reply_to_email: template.reply_to_email || 'support@panaceasuite.io',
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
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save email template",
        variant: "destructive",
      });
    }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Customize authentication email templates</p>
        </div>
        <Button
          onClick={() => {
            setSelectedTemplate(null);
            setIsEditing(true);
          }}
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
                          onClick={() => {
                            setSelectedTemplate(template);
                            setIsEditing(true);
                          }}
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
                          <Label className="text-sm font-medium">Button Text</Label>
                          <p className="text-sm text-muted-foreground">{template.button_text}</p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Message</Label>
                        <p className="text-sm text-muted-foreground">{template.message}</p>
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
                        onClick={() => {
                          setSelectedTemplate(null);
                          setIsEditing(true);
                        }}
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

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Edit Email Template' : 'Create New Email Template'}
            </DialogTitle>
          </DialogHeader>
          <TemplateEditor
            template={selectedTemplate}
            onSave={saveTemplate}
            onCancel={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface TemplateEditorProps {
  template: EmailTemplate | null;
  onSave: (template: Partial<EmailTemplate>) => void;
  onCancel: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    template_type: template?.template_type || 'signup' as const,
    subject: template?.subject || '',
    preview_text: template?.preview_text || '',
    heading: template?.heading || '',
    message: template?.message || '',
    button_text: template?.button_text || '',
    footer_text: template?.footer_text || '',
    from_name: template?.from_name || 'Panacea Certified',
    from_email: template?.from_email || 'noreply@certified.panaceasuite.io',
    reply_to_email: template?.reply_to_email || 'support@panaceasuite.io',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="template_type">Template Type</Label>
          <select
            id="template_type"
            value={formData.template_type}
            onChange={(e) => setFormData({ ...formData, template_type: e.target.value as any })}
            className="w-full px-3 py-2 border border-border rounded-md"
            disabled={!!template}
          >
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
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Confirm your email address"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="preview_text">Preview Text</Label>
        <Input
          id="preview_text"
          value={formData.preview_text}
          onChange={(e) => setFormData({ ...formData, preview_text: e.target.value })}
          placeholder="This appears in email previews"
        />
      </div>

      <div>
        <Label htmlFor="heading">Email Heading</Label>
        <Input
          id="heading"
          value={formData.heading}
          onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
          placeholder="Confirm your email"
          required
        />
      </div>

      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          placeholder="Click the button below to confirm your email address..."
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="button_text">Button Text</Label>
          <Input
            id="button_text"
            value={formData.button_text}
            onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
            placeholder="Confirm Email"
            required
          />
        </div>
        <div>
          <Label htmlFor="footer_text">Footer Text</Label>
          <Input
            id="footer_text"
            value={formData.footer_text}
            onChange={(e) => setFormData({ ...formData, footer_text: e.target.value })}
            placeholder="If you didn't create an account..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="from_name">From Name</Label>
          <Input
            id="from_name"
            value={formData.from_name}
            onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
            placeholder="Panacea Certified"
          />
        </div>
        <div>
          <Label htmlFor="from_email">From Email</Label>
          <Input
            id="from_email"
            value={formData.from_email}
            onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
            placeholder="noreply@certified.panaceasuite.io"
            type="email"
          />
        </div>
        <div>
          <Label htmlFor="reply_to_email">Reply-To Email</Label>
          <Input
            id="reply_to_email"
            value={formData.reply_to_email}
            onChange={(e) => setFormData({ ...formData, reply_to_email: e.target.value })}
            placeholder="support@panaceasuite.io"
            type="email"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          <Save className="w-4 h-4 mr-2" />
          Save Template
        </Button>
      </div>
    </form>
  );
};