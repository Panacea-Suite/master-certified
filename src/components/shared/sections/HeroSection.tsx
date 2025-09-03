import React from 'react';
import { SectionComponent } from '../SectionRegistry';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';

export const HeroSection: SectionComponent = ({ section }) => {
  const { getTemplateClasses } = useTemplateStyle();
  const paddingValue = `${(section.config?.padding ?? 4) * 0.25}rem`;
  
  const getSectionClassName = () => {
    let classes = getTemplateClasses('section');
    return classes.trim();
  };
  
  return (
    <div 
      className={`${getSectionClassName()} ${section.config?.align === 'center' ? 'text-center' : ''}`}
      style={{ padding: paddingValue }}
    >
      {section.config?.title && (
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {section.config.title}
        </h1>
      )}
      {section.config?.subtitle && (
        <h2 className="text-lg font-medium text-muted-foreground mb-2">
          {section.config.subtitle}
        </h2>
      )}
      {section.config?.description && (
        <p className="text-sm text-muted-foreground">
          {section.config.description}
        </p>
      )}
    </div>
  );
};