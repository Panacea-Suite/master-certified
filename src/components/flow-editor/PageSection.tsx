import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ColumnDropZone } from './ColumnDropZone';
import { PanaceaFooter } from '../PanaceaFooter';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';
import { SectionRenderer } from '@/components/shared/SectionRenderer';
import { 
  GripVertical, 
  Trash2, 
  Image as ImageIcon,
  Type,
  Minus,
  Columns2,
  ChevronDown,
  Layout,
  CheckCircle,
  MousePointer,
  Package,
  Edit2
} from 'lucide-react';

interface SectionData {
  id: string;
  type: string;
  order: number;
  config: any;
  children?: SectionData[][];
}

interface PageSectionProps {
  section: SectionData;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onAddSection?: (sectionType: string, position?: number, parentId?: string, columnIndex?: number) => void;
  isPreview?: boolean;
}

const sectionIcons = {
  text: Type,
  image: ImageIcon,
  store_selector: ChevronDown,
  divider: Minus,
  column: Columns2,
  header: Layout,
  hero: Type,
  features: CheckCircle,
  cta: MousePointer,
  product_showcase: Package,
  footer: Layout
};

export const PageSection: React.FC<PageSectionProps> = ({
  section,
  isSelected,
  onSelect,
  onDelete,
  onAddSection,
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

  const { getTemplateClasses, getBorderRadius, getShadowClass } = useTemplateStyle();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = sectionIcons[section.type as keyof typeof sectionIcons] || Type;
  const { config } = section;
  
  const paddingClass = `p-${config.padding ?? 4}`;
  const templateClasses = getTemplateClasses('card');
  
  // Generate drop shadow style for all sections (except images which use filter shadows)
  const getSectionStyle = () => {
    const shadowStyle = (config.dropShadow && section.type !== 'image') ? {
      boxShadow: `${config.shadowOffsetX || 0}px ${config.shadowOffsetY || 4}px ${config.shadowBlur || 10}px ${config.shadowSpread || 0}px ${config.shadowColor || 'rgba(0,0,0,0.1)'}`
    } : {
      boxShadow: 'none'
    };

    return {
      backgroundColor: config.backgroundColor || undefined,
      color: config.textColor || undefined,
      border: config.backgroundColor ? 'none' : undefined,
      padding: `${(config.padding ?? 4) * 0.25}rem`,
      ...shadowStyle
    };
  };

  // Generate filter drop shadow style for images
  const getImageFilterStyle = () => {
    return config.dropShadow ? {
      filter: `drop-shadow(${config.shadowOffsetX || 0}px ${config.shadowOffsetY || 4}px ${config.shadowBlur || 10}px ${config.shadowColor || 'rgba(0,0,0,0.1)'})`
    } : {};
  };

  const getSectionClassName = () => {
    // Start with template card classes but strip visual backgrounds/borders so sections inherit page background
    let classes = config.dropShadow 
      ? templateClasses 
      : templateClasses.replace(/shadow-\w+/g, '');

    // Remove any background, border, and backdrop blur/gradient classes to avoid lightening
    classes = classes
      .replace(/\bbg-[^\s]+/g, '')
      .replace(/\bborder[^\s]*/g, '')
      .replace(/\bbackdrop-blur[^\s]*/g, '')
      .replace(/\bfrom-[^\s]+\b|\bto-[^\s]+\b|\bvia-[^\s]+\b/g, '');
    
    return classes.trim();
  };

  const renderSectionContent = () => {
    // Delegate all section rendering to SectionRenderer, but retain column layout logic here
    if (section.type === 'column') {
      return (
        <div 
          className={`column-section ${paddingClass}`}
          style={{ backgroundColor: config.backgroundColor || 'transparent' }}
        >
          <div 
            className={`grid ${getColumnGridClass(config.layout)}`}
            style={{ gap: `${(config.gap || 4) * 0.25}rem` }}
          >
            {getColumnCount(config.layout) === 1 && (
              <ColumnDropZone 
                columnIndex={0}
                sections={Array.isArray(section.children?.[0]) ? section.children[0] : []}
                onAddSection={onAddSection}
                parentId={section.id}
              />
            )}
            {getColumnCount(config.layout) === 2 && (
              <>
                <ColumnDropZone 
                  columnIndex={0}
                  sections={Array.isArray(section.children?.[0]) ? section.children[0] : []}
                  onAddSection={onAddSection}
                  parentId={section.id}
                />
                <ColumnDropZone 
                  columnIndex={1}
                  sections={Array.isArray(section.children?.[1]) ? section.children[1] : []}
                  onAddSection={onAddSection}
                  parentId={section.id}
                />
              </>
            )}
            {getColumnCount(config.layout) === 3 && (
              <>
                <ColumnDropZone 
                  columnIndex={0}
                  sections={Array.isArray(section.children?.[0]) ? section.children[0] : []}
                  onAddSection={onAddSection}
                  parentId={section.id}
                />
                <ColumnDropZone 
                  columnIndex={1}
                  sections={Array.isArray(section.children?.[1]) ? section.children[1] : []}
                  onAddSection={onAddSection}
                  parentId={section.id}
                />
                <ColumnDropZone 
                  columnIndex={2}
                  sections={Array.isArray(section.children?.[2]) ? section.children[2] : []}
                  onAddSection={onAddSection}
                  parentId={section.id}
                />
              </>
            )}
          </div>
        </div>
      );
    }

    // All other section types delegate to SectionRenderer
    return (
      <SectionRenderer
        section={section}
        isPreview={isPreview}
        onSelect={onSelect}
        storeOptions={config.storeOptions ? config.storeOptions.split('\n').filter((option: string) => option.trim()) : []}
      />
    );
  };

  const getColumnGridClass = (layout: string) => {
    switch (layout) {
      case '1-col':
        return 'grid-cols-1';
      case '2-col-50-50':
        return 'grid-cols-2';
      case '2-col-33-67':
        return 'grid-cols-[1fr_2fr]';
      case '2-col-67-33':
        return 'grid-cols-[2fr_1fr]';
      case '3-col':
        return 'grid-cols-3';
      default:
        return 'grid-cols-2';
    }
  };

  const getColumnCount = (layout: string) => {
    switch (layout) {
      case '1-col':
        return 1;
      case '2-col-50-50':
      case '2-col-33-67':
      case '2-col-67-33':
        return 2;
      case '3-col':
        return 3;
      default:
        return 2;
    }
  };

  if (isPreview) {
    return (
      <div 
        className={`cursor-pointer transition-all ${
          isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-primary/50'
        }`}
        onClick={(e) => {
          console.log('Preview wrapper clicked, target:', e.target);
          onSelect();
        }}
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
        onClick={(e) => {
          console.log('Card clicked, target:', e.target, 'currentTarget:', e.currentTarget);
          onSelect();
        }}
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
            {section.type === 'header' && (config.logo ? 'Logo header' : 'Header section')}
            {section.type === 'hero' && (config.title ? `"${config.title.substring(0, 30)}..."` : 'Hero section')}
            {section.type === 'features' && `${config.items?.length || 0} features`}
            {section.type === 'cta' && (config.text || 'CTA button')}
            {section.type === 'product_showcase' && (config.caption || 'Product showcase')}
            {section.type === 'text' && (config.content ? `"${config.content.substring(0, 30)}..."` : 'No content')}
            {section.type === 'image' && (config.imageUrl ? 'Image set' : 'No image')}
            {section.type === 'store_selector' && (config.label || 'Store selector')}
            {section.type === 'divider' && `${config.width || 100}% width`}
            {section.type === 'column' && `${config.layout || '2-col-50-50'} layout`}
            {section.type === 'footer' && `Logo size: ${config.logoSize || 120}px`}
          </div>
        </div>
      </Card>
    </div>
  );
};