import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DesignTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  config: any;
  is_default: boolean;
}

export function useDesignTemplate(templateId?: string) {
  const [template, setTemplate] = useState<DesignTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (templateId) {
      fetchTemplate(templateId);
    } else {
      // Get default template
      fetchDefaultTemplate();
    }
  }, [templateId]);

  const fetchTemplate = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('design_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setTemplate(data);
    } catch (error) {
      console.error('Error fetching design template:', error);
      // Fallback to default template
      fetchDefaultTemplate();
    } finally {
      setLoading(false);
    }
  };

  const fetchDefaultTemplate = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('design_templates')
        .select('*')
        .eq('is_default', true)
        .limit(1)
        .single();

      if (error) throw error;
      setTemplate(data);
    } catch (error) {
      console.error('Error fetching default template:', error);
      setTemplate(null);
    } finally {
      setLoading(false);
    }
  };

  const getTemplateClasses = (component: 'header' | 'section' | 'card' | 'button' | 'text') => {
    if (!template) return '';

    const config = template.config;
    
    switch (component) {
      case 'header':
        switch (config.headerStyle) {
          case 'gradient':
            return 'bg-gradient-to-r from-primary to-secondary text-primary-foreground';
          case 'bold-gradient':
            return 'bg-gradient-to-br from-primary via-accent to-primary text-primary-foreground';
          case 'dark-gradient':
            return 'bg-gradient-to-r from-gray-900 to-primary text-primary-foreground';
          case 'minimal':
            return 'bg-background border-b border-border text-foreground';
          default:
            return 'bg-primary text-primary-foreground';
        }

      case 'section':
        switch (config.sectionBackground) {
          case 'subtle-gradient':
            return 'bg-gradient-to-b from-background to-muted/50';
          case 'brand-primary':
            return 'bg-primary text-primary-foreground';
          case 'dark':
            return 'bg-gray-900 text-white';
          case 'white':
            return 'bg-white text-foreground';
          default:
            return 'bg-background';
        }

      case 'card':
        switch (config.cardStyle) {
          case 'glass':
            return 'bg-white/10 backdrop-blur-sm border border-white/20 shadow-lg';
          case 'bordered':
            return 'bg-card border border-primary/20 shadow-sm';
          case 'contrast':
            return 'bg-background text-foreground border border-primary shadow-md';
          case 'minimal':
            return 'bg-background border-l-4 border-l-primary';
          case 'dark-glass':
            return 'bg-gray-800/50 backdrop-blur-sm border border-primary/30 shadow-xl';
          default:
            return 'bg-card border border-border shadow-sm';
        }

      case 'button':
        switch (config.buttonStyle) {
          case 'gradient':
            return 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90';
          case 'bold':
            return 'bg-primary hover:bg-primary/90 text-primary-foreground font-semibold';
          case 'outline':
            return 'border border-primary text-primary hover:bg-primary hover:text-primary-foreground';
          case 'glow':
            return 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30';
          default:
            return 'bg-primary hover:bg-primary/90 text-primary-foreground';
        }

      case 'text':
        switch (config.textColors) {
          case 'high-contrast':
            return 'text-foreground font-medium';
          case 'corporate':
            return 'text-muted-foreground';
          case 'subtle':
            return 'text-muted-foreground/80';
          case 'dark-theme':
            return 'text-gray-100';
          default:
            return 'text-foreground';
        }

      default:
        return '';
    }
  };

  const getBorderRadius = () => {
    if (!template) return 'rounded-md';
    
    switch (template.config.borderRadius) {
      case 'rounded':
        return 'rounded-lg';
      case 'minimal':
        return 'rounded-sm';
      case 'sharp':
        return 'rounded-none';
      default:
        return 'rounded-md';
    }
  };

  const getShadowClass = () => {
    if (!template) return 'shadow-sm';
    
    switch (template.config.shadows) {
      case 'elevated':
        return 'shadow-lg';
      case 'subtle':
        return 'shadow-sm';
      case 'strong':
        return 'shadow-xl';
      case 'glow':
        return 'shadow-lg shadow-primary/20';
      case 'none':
        return '';
      default:
        return 'shadow-sm';
    }
  };

  return {
    template,
    loading,
    getTemplateClasses,
    getBorderRadius,
    getShadowClass,
  };
}