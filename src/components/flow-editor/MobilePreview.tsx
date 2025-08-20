import React, { useState } from 'react';
import { PageSection } from './PageSection';
import { PanaceaFooter } from '@/components/PanaceaFooter';
export interface DeviceSpec {
  name: string;
  displayName: string;
  width: number;
  height: number;
}
import { useTemplateStyle } from '@/components/TemplateStyleProvider';
import { FlowHeader } from './FlowHeader';

interface SectionData {
  id: string;
  type: string;
  order: number;
  config: any;
  children?: SectionData[][];
}

interface MobilePreviewProps {
  sections: SectionData[];
  selectedSectionId?: string;
  onSelectSection?: (section: SectionData) => void;
  onAddSection?: (sectionType: string, position?: number, parentId?: string, columnIndex?: number) => void;
  backgroundColor?: string;
  globalHeader?: {
    showHeader: boolean;
    brandName: string;
    logoUrl: string;
    backgroundColor: string;
    logoSize: string;
  };
  footerConfig?: {
    backgroundColor: string;
    logoSize?: number;
  };
  deviceSpec?: DeviceSpec;
}

export const MobilePreview: React.FC<MobilePreviewProps> = ({ 
  sections, 
  selectedSectionId,
  onSelectSection,
  onAddSection,
  backgroundColor = '#ffffff',
  globalHeader = {
    showHeader: true,
    brandName: 'Brand',
    logoUrl: '',
    backgroundColor: '#ffffff',
    logoSize: '60'
  },
  footerConfig,
  deviceSpec = { name: 'iphone13', displayName: 'iPhone 13', width: 390, height: 844 }
}) => {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const { getTemplateClasses, getBorderRadius, getShadowClass } = useTemplateStyle();

  // Calculate device dimensions and scaling
  const deviceWidth = deviceSpec.width;
  const deviceHeight = deviceSpec.height;
  const scale = Math.min(375 / deviceWidth, 667 / deviceHeight); // Scale to fit in original container size
  const scaledWidth = deviceWidth * scale;
  const scaledHeight = deviceHeight * scale;

  const getLogoSize = (size: string) => {
    // If it's a number string (px value), use it directly
    if (/^\d+$/.test(size)) {
      return `${size}px`;
    }
    // Fallback for legacy size names
    switch (size) {
      case 'small':
        return '32px';
      case 'large':
        return '56px';
      case 'medium':
      default:
        return '48px';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(index);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only clear drag over if we're leaving the entire drop zone
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const sectionType = e.dataTransfer.getData('text/plain');
    if (sectionType && onAddSection) {
      onAddSection(sectionType, index);
    }
    setDragOverIndex(null);
  };

  if (sections.length === 0) {
    return (
      <div 
        className="bg-white rounded-3xl shadow-xl border border-gray-200 flex flex-col overflow-hidden"
        style={{ 
          width: `${scaledWidth}px`, 
          height: `${scaledHeight}px`,
          '--device-width-px': `${deviceWidth}px` 
        } as React.CSSProperties}
      >
        {/* Global Header with Brand Logo */}
        {globalHeader.showHeader && (
          <FlowHeader globalHeader={globalHeader} />
        )}

        {/* Empty Content - fills the curved area */}
        <div 
          className="flex-1 text-center space-y-4 p-8 flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 m-4 rounded-2xl"
          style={{ backgroundColor }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverIndex(0);
          }}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 0)}
        >
          <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center">
            📄
          </div>
          <div>
            <h3 className="font-medium text-lg">Empty Page</h3>
            <p className="text-muted-foreground text-sm">
              Drag sections from the palette to build your page
            </p>
          </div>
          {dragOverIndex === 0 && (
            <div className="w-full h-8 bg-primary/20 border-2 border-dashed border-primary rounded animate-pulse">
              <div className="text-xs text-primary text-center pt-1">Drop here to add section</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-3xl shadow-xl border border-gray-200 flex flex-col overflow-hidden"
      style={{ 
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        '--device-width-px': `${deviceWidth}px` 
      } as React.CSSProperties}
    >
      {/* Global Header with Brand Logo */}
      {globalHeader.showHeader && (
        <FlowHeader globalHeader={globalHeader} />
      )}

      {/* Content */}
      <div className={`flex-1 flex flex-col min-h-0 justify-between ${backgroundColor ? '' : getTemplateClasses('section')}`} style={{ backgroundColor, backgroundImage: backgroundColor ? 'none' : undefined }}>
        {/* Drop zone at top - minimal height to prevent gaps */}
        <div
          className={`transition-all ${dragOverIndex === 0 ? 'h-8 bg-primary/20 border-y-2 border-dashed border-primary' : 'h-0'}`}
          onDragOver={(e) => handleDragOver(e, 0)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 0)}
        >
          {dragOverIndex === 0 && (
            <div className="text-xs text-primary text-center pt-1">Drop here</div>
          )}
        </div>

        <div className="flex-1 min-h-0">
          {sections
            .sort((a, b) => a.order - b.order)
            .map((section, index) => (
              <React.Fragment key={section.id}>
                <PageSection
                  section={section}
                  isSelected={section.id === selectedSectionId}
                  onSelect={() => onSelectSection?.(section)}
                  onDelete={() => {}}
                  onAddSection={onAddSection}
                  isPreview={true}
                />
                
                {/* Drop zone between sections - minimal height to prevent gaps */}
                <div
                  className={`transition-all ${dragOverIndex === index + 1 ? 'h-8 bg-primary/20 border-y-2 border-dashed border-primary' : 'h-0'}`}
                  onDragOver={(e) => handleDragOver(e, index + 1)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index + 1)}
                >
                  {dragOverIndex === index + 1 && (
                    <div className="text-xs text-primary text-center pt-1">Drop here</div>
                  )}
                </div>
              </React.Fragment>
            ))}
        </div>
        
        {/* Panacea Footer - only if no footer section present - sticks to bottom */}
        {sections.every((s) => s.type !== 'footer') && (
          <div className="mt-auto shrink-0">
            {footerConfig ? (
              <PanaceaFooter 
                backgroundColor={footerConfig.backgroundColor === 'transparent' ? undefined : footerConfig.backgroundColor} 
                logoSize={footerConfig.logoSize} 
              />
            ) : (
              <PanaceaFooter />
            )}
          </div>
        )}
      </div>
    </div>
  );
};