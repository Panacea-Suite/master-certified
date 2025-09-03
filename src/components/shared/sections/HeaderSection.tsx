import React from 'react';
import { SectionComponent } from '../SectionRegistry';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';

export const HeaderSection: SectionComponent = ({ section }) => {
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
    let classes = getTemplateClasses('header');
    return classes.trim();
  };
  
  return (
    <div 
      className={getSectionClassName()}
      style={getPaddingStyle()}
    >
      {section.config?.logo && (
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-background/20 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">LOGO</span>
          </div>
        </div>
      )}
    </div>
  );
};