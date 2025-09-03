import React from 'react';
import { SectionComponent } from '../SectionRegistry';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';

export const HeroSection: SectionComponent = ({ section }) => {
  const { getTemplateClasses } = useTemplateStyle();
  
  // Helper function to get padding style with backward compatibility
  const getPaddingStyle = () => {
    const paddingTop = section.config?.paddingTop ?? section.config?.padding ?? 1;
    const paddingRight = section.config?.paddingRight ?? section.config?.padding ?? 1;
    const paddingBottom = section.config?.paddingBottom ?? section.config?.padding ?? 1;
    const paddingLeft = section.config?.paddingLeft ?? section.config?.padding ?? 1;
    
    return {
      paddingTop: `${paddingTop}rem`,
      paddingRight: `${paddingRight}rem`,
      paddingBottom: `${paddingBottom}rem`,
      paddingLeft: `${paddingLeft}rem`
    };
  };
  
  const getSectionClassName = () => {
    let classes = getTemplateClasses('section');
    return classes.trim();
  };
  
  return (
    <div 
      className={`${getSectionClassName()} ${section.config?.align === 'center' ? 'text-center' : ''}`}
      style={getPaddingStyle()}
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