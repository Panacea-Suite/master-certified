import React from 'react';
import { Edit2, ImageIcon } from 'lucide-react';
import { SectionComponent } from '../SectionRegistry';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';

export const ImageSection: SectionComponent = ({ section, isPreview = false, onSelect }) => {
  const { getTemplateClasses, getBorderRadius } = useTemplateStyle();
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
    let classes = config?.dropShadow && section.type !== 'image' ? getTemplateClasses('card') : getTemplateClasses('card').replace(/shadow-\w+/g, '');
    
    classes = classes
      .replace(/\bbg-[^\s]+/g, '')
      .replace(/\bborder[^\s]*/g, '')
      .replace(/\bbackdrop-blur[^\s]*/g, '')
      .replace(/\bfrom-[^\s]+\b|\bto-[^\s]+\b|\bvia-[^\s]+\b/g, '');
    
    return classes.trim();
  };

  const getImageDropShadowClass = () => {
    if (!config?.dropShadow || section.type !== 'image') return '';
    
    const blur = config.shadowBlur || 10;
    if (blur <= 4) return 'drop-shadow-sm';
    if (blur <= 8) return 'drop-shadow';
    if (blur <= 16) return 'drop-shadow-lg';
    return 'drop-shadow-xl';
  };
  
  return (
    <div 
      className={`image-section ${getSectionClassName()}`}
      style={getPaddingStyle()}
    >
      <div className="space-y-2">
        {config.imageUrl ? (
          <div 
            className={`relative group ${!isPreview ? 'cursor-pointer' : ''}${config.dropShadow ? ' overflow-visible' : ''}`}
            onClick={(e) => {
              if (!isPreview && onSelect) {
                e.stopPropagation();
                onSelect();
                setTimeout(() => {
                  document.dispatchEvent(
                    new CustomEvent('lov-open-image-editor', {
                      detail: { sectionId: section.id, imageUrl: config.imageUrl },
                    })
                  );
                }, 250);
              }
            }}
          >
            <img 
              src={config.imageUrl} 
              alt={config.alt || 'Section image'}
              className={`w-full h-auto ${getBorderRadius()} select-none pointer-events-none transition-opacity ${!isPreview ? 'group-hover:opacity-80' : ''} ${getImageDropShadowClass()}`}
              style={{ 
                maxWidth: config.width ? `${config.width}px` : '100%',
                maxHeight: config.height ? `${config.height}px` : 'auto'
              }}
            />
            {!isPreview && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded">
                <div className="pointer-events-none bg-white/90 rounded-full p-2">
                  <Edit2 className="h-4 w-4 text-gray-700" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div 
            className={`w-full h-32 ${config.backgroundColor ? '' : 'bg-muted'} ${getBorderRadius()} flex items-center justify-center`}
          >
            <div className="text-center text-muted-foreground">
              <ImageIcon className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">No image selected</p>
            </div>
          </div>
        )}
        {config.caption && (
          <p 
            className="text-sm text-center"
            style={{ color: config.textColor || '#666666' }}
          >
            {config.caption}
          </p>
        )}
      </div>
    </div>
  );
};