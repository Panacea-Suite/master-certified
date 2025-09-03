import React from 'react';
import { SectionComponent } from '../SectionRegistry';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';

export const TextSection: SectionComponent = ({ section, isAuthentic }) => {
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
  
  const formatContent = (content: string) => {
    if (!content) return 'Click to edit text...';
    
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/__(.*?)__/g, '<u>$1</u>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 underline">$1</a>')
      .replace(/\n/g, '<br/>');
  };

  // Check if this section should have dynamic content based on authentication status
  const getDisplayContent = () => {
    const originalContent = config.content || '';
    
    // If this section is flagged for dynamic auth content
    if (config.dynamicAuthContent) {
      if (isAuthentic === true) {
        return '✅ Authentic Product Verified!';
      } else if (isAuthentic === false) {
        return '❌ Product Authenticity Unverified';
      } else {
        // Default content while authentication is pending
        return originalContent;
      }
    }
    
    // Legacy fallback: Check if this is a thank you/completion text and override content if not authentic
    if (isAuthentic === false && (
      originalContent.toLowerCase().includes('registration complete') ||
      originalContent.toLowerCase().includes('thank you') ||
      originalContent.toLowerCase().includes('✅') ||
      originalContent.toLowerCase().includes('complete!')
    )) {
      return '❌ Product Not Authentic';
    }
    
    return originalContent;
  };

  return (
    <div 
      className={`text-section ${getSectionClassName()}`}
      style={getPaddingStyle()}
    >
      <div 
        className="prose prose-sm max-w-none"
        style={{ 
          fontSize: `${config.fontSize || 16}px`,
          fontWeight: config.fontWeight || 'normal',
          textAlign: config.align || 'left',
          color: isAuthentic === false && getDisplayContent().includes('❌') ? '#dc2626' : (config.textColor || 'inherit'),
          backgroundColor: config.backgroundColor || 'transparent'
        }}
        dangerouslySetInnerHTML={{ __html: formatContent(getDisplayContent()) }}
      />
    </div>
  );
};