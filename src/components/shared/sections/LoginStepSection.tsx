import React from 'react';
import { SectionComponent } from '../SectionRegistry';
import { LoginStep } from '@/components/steps/LoginStep';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';

export const LoginStepSection: SectionComponent = ({ 
  section, 
  isPreview = false,
  onAuthSuccess,
  onAuthError,
  onTrackEvent
}) => {
  const { getTemplateClasses } = useTemplateStyle();
  const { config } = section;
  
  // Helper function to get padding style with backward compatibility
  const getPaddingStyle = () => {
    const paddingTop = config.paddingTop ?? config.padding ?? 1;
    const paddingRight = config.paddingRight ?? config.padding ?? 1;
    const paddingBottom = config.paddingBottom ?? config.padding ?? 1;
    const paddingLeft = config.paddingLeft ?? config.padding ?? 1;
    
    return {
      paddingTop: `${paddingTop}rem`,
      paddingRight: `${paddingRight}rem`,
      paddingBottom: `${paddingBottom}rem`,
      paddingLeft: `${paddingLeft}rem`
    };
  };
  
  const getSectionClassName = () => {
    let classes = config?.dropShadow ? getTemplateClasses('card') : getTemplateClasses('card').replace(/shadow-\w+/g, '');
    
    classes = classes
      .replace(/\bbg-[^\s]+/g, '')
      .replace(/\bborder[^\s]*/g, '')
      .replace(/\bbackdrop-blur[^\s]*/g, '')
      .replace(/\bfrom-[^\s]+\b|\bto-[^\s]+\b|\bvia-[^\s]+\b/g, '');
    
    return classes.trim();
  };
  
  console.log('LoginStepSection rendering with config:', config);
  
  return (
    <div 
      className={`login-step-section ${getSectionClassName()}`}
      style={getPaddingStyle()}
    >
      <LoginStep
        title={config.title}
        subtitle={config.subtitle}
        showEmail={isPreview ? true : config.showEmail !== false}
        showApple={isPreview ? true : config.showApple !== false}
        brandName={config.brandName || 'this brand'}
        onAuthSuccess={onAuthSuccess}
        onAuthError={onAuthError}
        onTrackEvent={onTrackEvent}
      />
    </div>
  );
};