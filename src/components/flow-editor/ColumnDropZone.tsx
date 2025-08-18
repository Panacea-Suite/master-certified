import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface SectionData {
  id: string;
  type: string;
  order: number;
  config: any;
  children?: SectionData[][];
}

interface ColumnDropZoneProps {
  columnIndex: number;
  sections: SectionData[];
  onAddSection?: (sectionType: string, position?: number, parentId?: string, columnIndex?: number) => void;
  parentId: string;
}

export const ColumnDropZone: React.FC<ColumnDropZoneProps> = ({
  columnIndex,
  sections,
  onAddSection,
  parentId
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sectionType = e.dataTransfer.getData('text/plain');
    if (sectionType && onAddSection) {
      onAddSection(sectionType, undefined, parentId, columnIndex);
    }
    setDragOver(false);
  };

  const renderSectionContent = (section: SectionData) => {
    const { config } = section;
    const paddingClass = `p-${config.padding || 2}`;

    switch (section.type) {
      case 'text':
        return (
          <div 
            className={`text-section ${paddingClass}`}
            style={{ 
              backgroundColor: config.backgroundColor || 'transparent',
              color: config.textColor || '#000000'
            }}
          >
            <div 
              className="prose prose-sm max-w-none"
              style={{ fontSize: `${config.fontSize || 14}px` }}
            >
              {config.content || 'Click to edit text...'}
            </div>
          </div>
        );
        
      case 'image':
        return (
          <div className={`image-section ${paddingClass}`}>
            <div className="space-y-1">
              {config.imageUrl ? (
                <img 
                  src={config.imageUrl} 
                  alt={config.alt || 'Section image'}
                  className="w-full h-auto rounded"
                  style={{ maxHeight: config.height || 'auto' }}
                />
              ) : (
                <div className="w-full h-20 bg-muted rounded flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Plus className="h-4 w-4 mx-auto mb-1" />
                    <p className="text-xs">No image</p>
                  </div>
                </div>
              )}
              {config.caption && (
                <p className="text-xs text-muted-foreground text-center">
                  {config.caption}
                </p>
              )}
            </div>
          </div>
        );
        
      case 'divider':
        return (
          <div className={`divider-section ${paddingClass}`} style={{ backgroundColor: config.backgroundColor || 'transparent' }}>
            <hr 
              className="border-0"
              style={{
                height: `${config.thickness || 1}px`,
                backgroundColor: config.color || '#e5e7eb',
                width: `${config.width || 100}%`,
                margin: '0 auto'
              }}
            />
          </div>
        );
        
      default:
        return (
          <div className={paddingClass}>
            <p className="text-muted-foreground text-xs">Unknown section</p>
          </div>
        );
    }
  };

  return (
    <div 
      className={`min-h-20 border-2 border-dashed rounded-lg transition-all ${
        dragOver 
          ? 'border-primary bg-primary/5' 
          : sections.length === 0 
            ? 'border-muted-foreground/30 bg-muted/20' 
            : 'border-transparent bg-transparent'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {sections.length === 0 ? (
        <div className="flex items-center justify-center h-20 text-muted-foreground">
          <div className="text-center">
            <Plus className="h-4 w-4 mx-auto mb-1" />
            <p className="text-xs">Drop content here</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {sections.map((section) => (
            <Card key={section.id} className="overflow-hidden">
              {renderSectionContent(section)}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};