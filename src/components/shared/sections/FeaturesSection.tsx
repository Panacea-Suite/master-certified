import React from 'react';
import { CheckCircle } from 'lucide-react';
import { SectionComponent } from '../SectionRegistry';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';

export const FeaturesSection: SectionComponent = ({ section }) => {
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
    let classes = section.config?.dropShadow ? getTemplateClasses('card') : getTemplateClasses('card').replace(/shadow-\w+/g, '');
    
    classes = classes
      .replace(/\bbg-[^\s]+/g, '')
      .replace(/\bborder[^\s]*/g, '')
      .replace(/\bbackdrop-blur[^\s]*/g, '')
      .replace(/\bfrom-[^\s]+\b|\bto-[^\s]+\b|\bvia-[^\s]+\b/g, '');
    
    return classes.trim();
  };
  
  return (
    <div 
      className={`features-section ${getSectionClassName()}`}
      style={getPaddingStyle()}
    >
      <div className="space-y-3">
        {section.config?.items?.map((item: string, index: number) => (
          <div key={index} className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm text-foreground">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};