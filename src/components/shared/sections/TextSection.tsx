import React from 'react';
import { SectionComponent } from '../SectionRegistry';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';

export const TextSection: SectionComponent = ({ section }) => {
  const { getTemplateClasses } = useTemplateStyle();
  const { config } = section;
  const paddingClass = `p-${section.config?.padding ?? 4}`;
  
  const getSectionClassName = () => {
    let classes = config?.dropShadow ? getTemplateClasses('card') : getTemplateClasses('card').replace(/shadow-\w+/g, '');
    
    classes = classes
      .replace(/\bbg-[^\s]+/g, '')
      .replace(/\bborder[^\s]*/g, '')
      .replace(/\bbackdrop-blur[^\s]*/g, '')
      .replace(/\bfrom-[^\s]+\b|\bto-[^\s]+\b|\bvia-[^\s]+\b/g, '');
    
    return classes.trim();
  };
  
  const formatContent = (content: string) => {
    if (!content) return 'Click to edit text...';
    
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className={`text-section ${getSectionClassName()} ${paddingClass}`}>
      <div 
        className="prose prose-sm max-w-none"
        style={{ 
          fontSize: `${config.fontSize || 16}px`,
          fontWeight: config.fontWeight || 'normal',
          textAlign: config.align || 'left',
          color: config.textColor || 'inherit',
          backgroundColor: config.backgroundColor || 'transparent'
        }}
        dangerouslySetInnerHTML={{ __html: formatContent(config.content) }}
      />
    </div>
  );
};