/**
 * Unified template data processing utilities
 * Ensures Preview and Edit as New use identical data sources
 */

export interface ProcessedTemplateData {
  id: string;
  name: string;
  description: string;
  pages: any[];
  designConfig: any;
  category?: string;
  tags?: string[];
  globalHeader?: {
    showHeader: boolean;
    brandName: string;
    logoUrl: string;
    backgroundColor: string;
    logoSize: 'small' | 'medium' | 'large';
  };
}

/**
 * Processes template data into a unified format for both Preview and Edit modes
 * Handles both system templates (with 'pages' property) and user templates (with 'flow_config' property)
 */
export function processTemplateData(template: any): ProcessedTemplateData {
  const defaultDesignConfig = {
    backgroundStyle: 'solid' as const,
    colorScheme: 'primary' as const,
    borderStyle: 'rounded' as const,
    dividerStyle: 'line' as const,
    cardStyle: 'elevated' as const,
    spacing: 'comfortable' as const
  };

  // Handle system templates from flowTemplates.ts (have 'pages' property)
  if ('pages' in template) {
    return {
      id: template.id,
      name: template.name,
      description: template.description || 'System template',
      pages: template.pages,
      designConfig: template.designConfig || defaultDesignConfig,
      category: template.category,
      tags: template.tags || [],
      globalHeader: template.globalHeader
    };
  }

  // Handle user templates or database templates (have 'flow_config' property)
  if (template.flow_config) {
    const flowConfig = template.flow_config;
    return {
      id: template.id,
      name: template.name,
      description: template.template_description || template.description || 'User template',
      pages: flowConfig.pages || [],
      designConfig: flowConfig.designConfig || defaultDesignConfig,
      category: template.template_category || template.category || 'custom',
      tags: template.template_tags || template.tags || []
    };
  }

  // Fallback for unexpected template format
  console.warn('Unknown template format:', template);
  return {
    id: template.id || 'unknown',
    name: template.name || 'Unknown Template',
    description: 'Template format not recognized',
    pages: [],
    designConfig: defaultDesignConfig,
    category: 'unknown',
    tags: []
  };
}

/**
 * Converts processed template data to flow configuration format for editor
 */
export function templateToFlowConfig(processedTemplate: ProcessedTemplateData, brandData?: any): any {
  console.log('templateToFlowConfig called with:', {
    templateId: processedTemplate.id,
    templateName: processedTemplate.name,
    brandData: brandData,
    templateGlobalHeader: processedTemplate.globalHeader
  });

  // Use template's global header if provided, otherwise create default
  const defaultGlobalHeader = {
    showHeader: true,
    brandName: brandData?.name || '',
    logoUrl: brandData?.logo_url || '',
    backgroundColor: brandData?.brand_colors?.secondary || '#6B7280',
    logoSize: '60' as const
  };

  const globalHeader = processedTemplate.globalHeader 
    ? {
        ...processedTemplate.globalHeader,
        // Override with brand data if available - prioritize brand data
        brandName: brandData?.name || processedTemplate.globalHeader.brandName || '',
        logoUrl: brandData?.logo_url || processedTemplate.globalHeader.logoUrl || '',
        backgroundColor: brandData?.brand_colors?.secondary || processedTemplate.globalHeader.backgroundColor || '#6B7280'
      }
    : defaultGlobalHeader;

  console.log('Final globalHeader created:', globalHeader);

  const flowConfig = {
    pages: processedTemplate.pages,
    designConfig: processedTemplate.designConfig,
    theme: {
      backgroundColor: '#ffffff'
    },
    globalHeader
  };

  console.log('Final flow config:', flowConfig);
  return flowConfig;
}