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
  
  console.log('LoginStepSection rendering with config:', config);
  
  return (
    <div 
      className={`login-step-section ${getSectionClassName()}`}
      style={{ padding: paddingValue }}
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