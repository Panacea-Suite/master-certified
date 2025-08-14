import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  GripVertical, 
  Trash2, 
  Image as ImageIcon,
  Type,
  Minus
} from 'lucide-react';

interface SectionData {
  id: string;
  type: string;
  order: number;
  config: any;
}

interface PageSectionProps {
  section: SectionData;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  isPreview?: boolean;
}

const sectionIcons = {
  text: Type,
  image: ImageIcon,
  divider: Minus
};

export const PageSection: React.FC<PageSectionProps> = ({
  section,
  isSelected,
  onSelect,
  onDelete,
  isPreview = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = sectionIcons[section.type as keyof typeof sectionIcons] || Type;
  const { config } = section;
  
  const paddingClass = `p-${config.padding || 4}`;

  const renderSectionContent = () => {
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
              style={{ fontSize: `${config.fontSize || 16}px` }}
            >
              {config.content || 'Click to edit text...'}
            </div>
          </div>
        );
        
      case 'image':
        return (
          <div className={`image-section ${paddingClass}`}>
            <div className="space-y-2">
              {config.imageUrl ? (
                <img 
                  src={config.imageUrl} 
                  alt={config.alt || 'Section image'}
                  className="w-full h-auto rounded-lg"
                  style={{ maxHeight: config.height || 'auto' }}
                />
              ) : (
                <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">No image selected</p>
                  </div>
                </div>
              )}
              {config.caption && (
                <p className="text-sm text-muted-foreground text-center">
                  {config.caption}
                </p>
              )}
            </div>
          </div>
        );
        
      case 'divider':
        return (
          <div className={`divider-section ${paddingClass}`}>
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
            <p className="text-muted-foreground">Unknown section type</p>
          </div>
        );
    }
  };

  if (isPreview) {
    return (
      <div 
        className={`cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-primary/50'
        }`}
        onClick={onSelect}
      >
        {renderSectionContent()}
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        className={`cursor-pointer transition-colors ${
          isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
        }`}
        onClick={onSelect}
      >
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <Icon className="h-4 w-4 text-primary flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <span className="font-medium text-sm capitalize">
                {section.type} Section
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-destructive hover:text-destructive h-6 w-6 p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground pl-6">
            {section.type === 'text' && (config.content ? `"${config.content.substring(0, 30)}..."` : 'No content')}
            {section.type === 'image' && (config.imageUrl ? 'Image set' : 'No image')}
            {section.type === 'divider' && `${config.width || 100}% width`}
          </div>
        </div>
      </Card>
    </div>
  );
};