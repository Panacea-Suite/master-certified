import React from 'react';
import { Package } from 'lucide-react';
import { SectionComponent } from '../SectionRegistry';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';

export const ProductShowcaseSection: SectionComponent = ({ section }) => {
  const { getTemplateClasses } = useTemplateStyle();
  const { config } = section;
  
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
    <div className={`product-showcase-section ${getSectionClassName()}`}>
      <div className={`p-6 rounded-lg ${config?.backgroundColor === 'primary' ? 'bg-primary/10' : 'bg-muted'}`}>
        <div className="flex justify-center">
          <div className="w-32 h-32 bg-muted border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground" />
          </div>
        </div>
        {config?.caption && (
          <p className="text-center text-sm text-muted-foreground mt-3">
            {config.caption}
          </p>
        )}
      </div>
    </div>
  );
};