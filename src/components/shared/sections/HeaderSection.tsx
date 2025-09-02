import React from 'react';
import { SectionComponent } from '../SectionRegistry';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';

export const HeaderSection: SectionComponent = ({ section }) => {
  const { getTemplateClasses } = useTemplateStyle();
  const paddingClass = `p-${section.config?.padding ?? 4}`;
  
  const getSectionClassName = () => {
    let classes = getTemplateClasses('header');
    return classes.trim();
  };
  
  return (
    <div className={`${getSectionClassName()} ${paddingClass}`}>
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