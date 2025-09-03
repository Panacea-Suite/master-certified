import React from 'react';
import { CheckCircle } from 'lucide-react';
import { SectionComponent } from '../SectionRegistry';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';

export const FeaturesSection: SectionComponent = ({ section }) => {
  const { getTemplateClasses } = useTemplateStyle();
  const paddingClass = `p-${section.config?.padding ?? 4}`;
  
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
    <div className={`features-section ${getSectionClassName()} ${paddingClass}`}>
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