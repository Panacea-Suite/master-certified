import React, { useState } from 'react';
import { PageSection } from './PageSection';

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
  };
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
    backgroundColor: '#ffffff'
  }
}) => {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
      <div className="w-[375px] h-[667px] bg-white rounded-3xl shadow-xl border border-gray-200 flex items-center justify-center">
        <div 
          className="text-center space-y-4 p-8 w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-3xl"
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
    <div className="w-[375px] h-[667px] bg-white rounded-3xl shadow-xl border border-gray-200 flex flex-col">
      {/* Status Bar */}
      <div className="h-6 bg-black rounded-t-3xl flex items-center justify-center">
        <div className="w-20 h-1 bg-white rounded-full"></div>
      </div>

      {/* Global Header with Brand Logo */}
      {globalHeader.showHeader && (
        <div 
          className="p-4 border-b flex items-center justify-center"
          style={{ backgroundColor: globalHeader.backgroundColor }}
        >
          {globalHeader.logoUrl ? (
            <img 
              src={globalHeader.logoUrl} 
              alt={globalHeader.brandName}
              className="h-8 max-w-24 object-contain"
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <span className="text-primary font-bold text-sm">
                  {globalHeader.brandName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="font-medium text-sm">{globalHeader.brandName}</span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ backgroundColor }}>
        {/* Drop zone at top */}
        <div
          className={`h-2 transition-all ${dragOverIndex === 0 ? 'h-8 bg-primary/20 border-y-2 border-dashed border-primary' : ''}`}
          onDragOver={(e) => handleDragOver(e, 0)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 0)}
        >
          {dragOverIndex === 0 && (
            <div className="text-xs text-primary text-center pt-1">Drop here</div>
          )}
        </div>

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
              
              {/* Drop zone between sections */}
              <div
                className={`h-2 transition-all ${dragOverIndex === index + 1 ? 'h-8 bg-primary/20 border-y-2 border-dashed border-primary' : ''}`}
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

      {/* Home Indicator */}
      <div className="h-6 flex items-center justify-center">
        <div className="w-32 h-1 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  );
};