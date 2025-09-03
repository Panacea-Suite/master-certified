import React from 'react';
import { SectionComponent } from '../SectionRegistry';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';

export const CtaSection: SectionComponent = ({ section, onNavigateToPage }) => {
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
  
  const handleClick = () => {
    if (section.config?.targetPageId && onNavigateToPage) {
      onNavigateToPage(section.config.targetPageId);
    }
  };
  
  return (
    <div 
      className={`cta-section ${getSectionClassName()} flex justify-center`}
      style={getPaddingStyle()}
    >
      <button 
        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
          section.config?.size === 'lg' ? 'text-lg px-8 py-4' : 
          section.config?.size === 'sm' ? 'text-sm px-4 py-2' : ''
        }`}
        style={{
          backgroundColor: section.config?.buttonColor || (section.config?.color === 'secondary' ? 'var(--template-secondary)' : section.config?.color === 'accent' ? 'var(--template-accent)' : 'var(--template-primary)'),
          color: section.config?.textColor || '#ffffff'
        }}
        onClick={handleClick}
      >
        {section.config?.text || 'Click here'}
      </button>
    </div>
  );
};