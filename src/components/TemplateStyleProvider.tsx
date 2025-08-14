import { createContext, useContext, ReactNode } from 'react';
import { useDesignTemplate } from '@/hooks/useDesignTemplate';

interface TemplateStyleContextType {
  template: any;
  loading: boolean;
  getTemplateClasses: (component: 'header' | 'section' | 'card' | 'button' | 'text') => string;
  getBorderRadius: () => string;
  getShadowClass: () => string;
}

const TemplateStyleContext = createContext<TemplateStyleContextType | undefined>(undefined);

interface TemplateStyleProviderProps {
  children: ReactNode;
  templateId?: string;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function TemplateStyleProvider({ 
  children, 
  templateId, 
  brandColors 
}: TemplateStyleProviderProps) {
  const templateData = useDesignTemplate(templateId);

  // Inject brand colors into CSS custom properties if provided
  if (brandColors && typeof document !== 'undefined') {
    const root = document.documentElement;
    root.style.setProperty('--template-primary', brandColors.primary);
    root.style.setProperty('--template-secondary', brandColors.secondary);
    root.style.setProperty('--template-accent', brandColors.accent);
  }

  return (
    <TemplateStyleContext.Provider value={templateData}>
      {children}
    </TemplateStyleContext.Provider>
  );
}

export const useTemplateStyle = () => {
  const context = useContext(TemplateStyleContext);
  if (context === undefined) {
    throw new Error('useTemplateStyle must be used within a TemplateStyleProvider');
  }
  return context;
};