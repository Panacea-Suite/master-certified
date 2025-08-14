import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Palette, Check } from 'lucide-react';
import { toast } from 'sonner';

interface DesignTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  config: any;
  is_default: boolean;
}

interface DesignTemplateSelectorProps {
  selectedTemplateId?: string;
  onTemplateSelect: (templateId: string) => void;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function DesignTemplateSelector({ 
  selectedTemplateId, 
  onTemplateSelect, 
  brandColors 
}: DesignTemplateSelectorProps) {
  const [templates, setTemplates] = useState<DesignTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('design_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching design templates:', error);
      toast.error('Failed to load design templates');
    } finally {
      setLoading(false);
    }
  };

  const getPreviewStyle = (template: DesignTemplate) => {
    const config = template.config;
    const primary = brandColors?.primary || 'hsl(221.2 83.2% 53.3%)';
    const secondary = brandColors?.secondary || 'hsl(210 40% 98%)';
    const accent = brandColors?.accent || 'hsl(210 40% 98%)';

    // Create preview styles based on template config
    const baseStyle: React.CSSProperties = {
      '--template-primary': primary,
      '--template-secondary': secondary,
      '--template-accent': accent,
    } as React.CSSProperties;

    if (config.headerStyle === 'gradient') {
      baseStyle.background = `linear-gradient(135deg, ${primary}, ${secondary})`;
    } else if (config.headerStyle === 'bold-gradient') {
      baseStyle.background = `linear-gradient(45deg, ${primary}, ${accent})`;
    } else if (config.headerStyle === 'dark-gradient') {
      baseStyle.background = `linear-gradient(135deg, #1a1a1a, ${primary})`;
    } else {
      baseStyle.background = primary;
    }

    return baseStyle;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="h-24 bg-muted rounded-t-lg"></div>
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Choose Design Template</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedTemplateId === template.id 
                ? 'ring-2 ring-primary shadow-lg' 
                : 'hover:shadow-md'
            }`}
            onClick={() => onTemplateSelect(template.id)}
          >
            {/* Preview Section */}
            <div 
              className="h-24 rounded-t-lg relative overflow-hidden"
              style={getPreviewStyle(template)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
              <div className="absolute bottom-2 left-3 right-3">
                <div className="text-white text-sm font-medium truncate">
                  Flow Preview
                </div>
                <div className="flex gap-1 mt-1">
                  <div className="w-12 h-2 bg-white/30 rounded"></div>
                  <div className="w-8 h-2 bg-white/20 rounded"></div>
                </div>
              </div>
              {selectedTemplateId === template.id && (
                <div className="absolute top-2 right-2">
                  <div className="bg-white rounded-full p-1">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                </div>
              )}
            </div>

            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <div className="flex gap-1">
                  {template.is_default && (
                    <Badge variant="secondary" className="text-xs">
                      Popular
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs capitalize">
                    {template.category}
                  </Badge>
                </div>
              </div>
              <CardDescription className="text-sm">
                {template.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}