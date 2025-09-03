import React from 'react';
import { SectionComponent } from '../SectionRegistry';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';

export const DividerSection: SectionComponent = ({ section }) => {
  const { getTemplateClasses } = useTemplateStyle();
  const { config } = section;
  const paddingValue = `${(section.config?.padding ?? 4) * 0.25}rem`;
  
  const getSectionClassName = () => {
    let classes = config?.dropShadow ? getTemplateClasses('card') : getTemplateClasses('card').replace(/shadow-\w+/g, '');
    
    classes = classes
      .replace(/\bbg-[^\s]+/g, '')
      .replace(/\bborder[^\s]*/g, '')
      .replace(/\bbackdrop-blur[^\s]*/g, '')
      .replace(/\bfrom-[^\s]+\b|\bto-[^\s]+\b|\bvia-[^\s]+\b/g, '');
    
    return classes.trim();
  };
  
  return (
    <div 
      className={`divider-section ${getSectionClassName()}`}
      style={{ padding: paddingValue }}
    >
      <hr 
        className="border-0"
        style={{
          height: `${config.thickness || 1}px`,
          backgroundColor: config.color || '#e5e7eb',
          width: `${config.width || 100}%`,
          margin: config.fullWidth ? '0' : '0 auto'
        }}
      />
    </div>
  );
};