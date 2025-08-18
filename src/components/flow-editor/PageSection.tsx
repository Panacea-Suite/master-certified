import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ColumnDropZone } from './ColumnDropZone';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';
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
  Package
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
  product_showcase: Package
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
  
  // Generate drop shadow style for all sections
  const getSectionStyle = () => {
    const shadowStyle = config.dropShadow ? {
      boxShadow: `${config.shadowOffsetX || 0}px ${config.shadowOffsetY || 4}px ${config.shadowBlur || 10}px ${config.shadowSpread || 0}px ${config.shadowColor || 'rgba(0,0,0,0.1)'}`
    } : {
      boxShadow: 'none'
    };

    return {
      backgroundColor: config.backgroundColor || undefined,
      color: config.textColor || undefined,
      border: config.backgroundColor ? 'none' : undefined,
      ...shadowStyle
    };
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
    switch (section.type) {
      case 'header':
        return (
          <div className={`header-section ${paddingClass} ${section.config?.backgroundColor === 'primary' ? 'bg-primary' : 'bg-background'}`}>
            {section.config?.logo && (
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-background/20 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">LOGO</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'hero':
        return (
          <div className={`hero-section ${paddingClass} ${section.config?.align === 'center' ? 'text-center' : ''}`}>
            {section.config?.title && (
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {section.config.title}
              </h1>
            )}
            {section.config?.subtitle && (
              <h2 className="text-lg font-medium text-muted-foreground mb-2">
                {section.config.subtitle}
              </h2>
            )}
            {section.config?.description && (
              <p className="text-sm text-muted-foreground">
                {section.config.description}
              </p>
            )}
          </div>
        );

      case 'features':
        return (
          <div 
            className={`features-section ${paddingClass} ${getSectionClassName()}`}
            style={getSectionStyle()}
          >
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

      case 'cta':
        return (
          <div 
            className={`cta-section ${paddingClass} ${getSectionClassName()} flex justify-center`}
            style={getSectionStyle()}
          >
            <button 
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                section.config?.size === 'lg' ? 'text-lg px-8 py-4' : 
                section.config?.size === 'sm' ? 'text-sm px-4 py-2' : ''
              }`}
              style={{
                backgroundColor: section.config?.buttonColor || '#3b82f6',
                color: section.config?.textColor || '#ffffff'
              }}
            >
              {section.config?.text || 'Click here'}
            </button>
          </div>
        );

      case 'product_showcase':
        return (
          <div 
            className={`product-showcase-section ${paddingClass} ${getSectionClassName()}`}
            style={getSectionStyle()}
          >
            <div className={`p-6 rounded-lg ${section.config?.backgroundColor === 'primary' ? 'bg-primary/10' : 'bg-muted'}`}>
              <div className="flex justify-center">
                <div className="w-32 h-32 bg-muted border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center">
                  <Package className="w-12 h-12 text-muted-foreground" />
                </div>
              </div>
              {section.config?.caption && (
                <p className="text-center text-sm text-muted-foreground mt-3">
                  {section.config.caption}
                </p>
              )}
            </div>
          </div>
        );

      case 'text':
        return (
          <div 
            className={`text-section ${paddingClass} ${getSectionClassName()}`}
            style={getSectionStyle()}
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
          <div 
            className={`image-section ${paddingClass} ${getSectionClassName()}`}
            style={getSectionStyle()}
          >
            <div className="space-y-2">
              {config.imageUrl ? (
                <img 
                  src={config.imageUrl} 
                  alt={config.alt || 'Section image'}
                  className={`w-full h-auto ${getBorderRadius()}`}
                  style={{ maxHeight: config.height || 'auto' }}
                />
              ) : (
                <div className={`w-full h-32 bg-muted ${getBorderRadius()} flex items-center justify-center`}>
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
        
      case 'store_selector':
        const storeOptions = config.storeOptions ? config.storeOptions.split('\n').filter(option => option.trim()) : ['Downtown Location', 'Mall Branch', 'Airport Store'];
        return (
          <div 
            className={`store-selector-section ${paddingClass}`}
            style={{ backgroundColor: config.backgroundColor || 'transparent' }}
          >
            <div className="space-y-2">
              {config.label && (
                <label 
                  className="block text-sm font-medium"
                  style={{ color: config.textColor || '#000000' }}
                >
                  {config.label}
                </label>
              )}
              <div className="relative">
                <select
                  className="w-full px-3 py-2 text-sm rounded-md border appearance-none focus:outline-none focus:ring-2 focus:ring-offset-2 bg-background z-50"
                  style={{
                    borderColor: config.borderColor || '#e5e7eb',
                    color: config.textColor || '#000000',
                    backgroundColor: config.backgroundColor || '#ffffff'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = config.focusBorderColor || '#3b82f6';
                    e.target.style.boxShadow = `0 0 0 1px ${config.focusBorderColor || '#3b82f6'}`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = config.borderColor || '#e5e7eb';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">{config.placeholder || 'Choose a store...'}</option>
                  {storeOptions.map((option, index) => (
                    <option key={index} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <ChevronDown 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 pointer-events-none"
                  style={{ color: config.textColor || '#000000' }}
                />
              </div>
            </div>
          </div>
        );
        
      case 'divider':
        return (
          <div className={`divider-section ${paddingClass} ${getSectionClassName()}`} style={getSectionStyle()}>
            <hr 
              className="border-0"
              style={{
                height: `${config.thickness || 1}px`,
                backgroundColor: config.color || '#e5e7eb',
                width: `${config.width || 100}%`,
                margin: config.fullWidth ? '0' : '0 auto'
              }}
            />
          </div>
        );
        
      case 'column':
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
        
      default:
        return (
          <div className={paddingClass}>
            <p className="text-muted-foreground">Unknown section type</p>
          </div>
        );
    }
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
          </div>
        </div>
      </Card>
    </div>
  );
};