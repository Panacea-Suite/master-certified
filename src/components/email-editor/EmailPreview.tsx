import React, { useState, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, Sun, Moon, GripVertical, Trash2 } from 'lucide-react';

interface EmailComponent {
  id: string;
  type: string;
  config: any;
  order: number;
}

interface EmailPreviewProps {
  components: EmailComponent[];
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSelectComponent: (component: EmailComponent) => void;
  onComponentsChange: (components: EmailComponent[]) => void;
  onAddComponent: (componentType: string) => void;
  selectedComponentId?: string;
  templateConfig: {
    subject: string;
    previewText?: string;
    from_name: string;
    from_email: string;
  };
}

interface SortableEmailComponentProps {
  component: EmailComponent;
  darkMode: boolean;
  onSelectComponent: (component: EmailComponent) => void;
  onDeleteComponent: (id: string) => void;
  selectedComponentId?: string;
}

const SortableEmailComponent: React.FC<SortableEmailComponentProps> = ({
  component,
  darkMode,
  onSelectComponent,
  onDeleteComponent,
  selectedComponentId
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  const renderComponent = (component: EmailComponent) => {
    const { config } = component;
    const isSelected = selectedComponentId === component.id;
    
    const baseStyle = {
      padding: `${config.padding || 20}px`,
      backgroundColor: config.backgroundColor || (darkMode ? '#1a1a1a' : '#ffffff'),
      position: 'relative' as const,
      ...(isSelected && {
        outline: '2px solid #5F57FF',
        outlineOffset: '2px'
      })
    };

    const handleClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelectComponent(component);
    };

    switch (component.type) {
      case 'email_header':
        return (
          <div
            style={baseStyle}
            onClick={handleClick}
            className="group cursor-pointer transition-all hover:shadow-sm"
          >
            <div style={{ textAlign: 'center' }}>
              <h1 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: darkMode ? '#ffffff' : '#333333',
                margin: '0',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                {config.title || 'Your Brand'}
              </h1>
            </div>
            {isSelected && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  {...listeners}
                  className="p-1 bg-primary text-primary-foreground rounded cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteComponent(component.id);
                  }}
                  className="p-1 bg-destructive text-destructive-foreground rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );

      case 'email_heading':
        return (
          <div
            style={baseStyle}
            onClick={handleClick}
            className="group cursor-pointer transition-all hover:shadow-sm"
          >
            <h2 style={{
              fontSize: `${config.fontSize || '20'}px`,
              fontWeight: config.fontWeight || 'bold',
              color: config.textColor || (darkMode ? '#ffffff' : '#333333'),
              textAlign: config.textAlign || 'left',
              margin: '0',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              {config.text || 'Heading Text'}
            </h2>
            {isSelected && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  {...listeners}
                  className="p-1 bg-primary text-primary-foreground rounded cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteComponent(component.id);
                  }}
                  className="p-1 bg-destructive text-destructive-foreground rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );

      case 'email_text':
        return (
          <div
            style={baseStyle}
            onClick={handleClick}
            className="group cursor-pointer transition-all hover:shadow-sm"
          >
            <p style={{
              fontSize: `${config.fontSize || '16'}px`,
              fontWeight: config.fontWeight || 'normal',
              color: config.textColor || (darkMode ? '#cccccc' : '#333333'),
              textAlign: config.textAlign || 'left',
              margin: '0',
              lineHeight: '1.5',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
            }}>
              {config.text || 'This is your email text content. Click to edit this text and customize it for your email template.'}
            </p>
            {isSelected && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  {...listeners}
                  className="p-1 bg-primary text-primary-foreground rounded cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteComponent(component.id);
                  }}
                  className="p-1 bg-destructive text-destructive-foreground rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );

      case 'email_button':
        return (
          <div
            style={baseStyle}
            onClick={handleClick}
            className="group cursor-pointer transition-all hover:shadow-sm"
          >
            <div style={{ textAlign: config.buttonAlign || 'center' }}>
              <a
                href={config.buttonUrl || '#'}
                style={{
                  backgroundColor: config.buttonBgColor || '#5F57FF',
                  color: config.buttonTextColor || '#ffffff',
                  textDecoration: 'none',
                  padding: '12px 24px',
                  borderRadius: `${config.borderRadius || 6}px`,
                  fontSize: '16px',
                  fontWeight: 'bold',
                  display: 'inline-block',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                }}
              >
                {config.buttonText || 'Click Here'}
              </a>
            </div>
            {isSelected && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  {...listeners}
                  className="p-1 bg-primary text-primary-foreground rounded cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteComponent(component.id);
                  }}
                  className="p-1 bg-destructive text-destructive-foreground rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );

      case 'email_image':
        return (
          <div
            style={baseStyle}
            onClick={handleClick}
            className="group cursor-pointer transition-all hover:shadow-sm"
          >
            <div style={{ textAlign: config.imageAlign || 'center' }}>
              {config.imageUrl ? (
                <img
                  src={config.imageUrl}
                  alt={config.altText || ''}
                  style={{
                    maxWidth: `${config.maxWidth || 600}px`,
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    margin: config.imageAlign === 'center' ? '0 auto' : '0'
                  }}
                />
              ) : (
                <div style={{
                  width: '100%',
                  maxWidth: `${config.maxWidth || 600}px`,
                  height: '200px',
                  backgroundColor: darkMode ? '#333333' : '#f0f0f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: darkMode ? '#cccccc' : '#666666',
                  border: `2px dashed ${darkMode ? '#555555' : '#cccccc'}`,
                  margin: config.imageAlign === 'center' ? '0 auto' : '0'
                }}>
                  Add Image URL
                </div>
              )}
            </div>
            {isSelected && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  {...listeners}
                  className="p-1 bg-primary text-primary-foreground rounded cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteComponent(component.id);
                  }}
                  className="p-1 bg-destructive text-destructive-foreground rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );

      case 'email_divider':
        return (
          <div
            style={baseStyle}
            onClick={handleClick}
            className="group cursor-pointer transition-all hover:shadow-sm"
          >
            <hr style={{
              border: 'none',
              borderTop: `1px solid ${darkMode ? '#444444' : '#e5e5e5'}`,
              margin: '0'
            }} />
            {isSelected && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  {...listeners}
                  className="p-1 bg-primary text-primary-foreground rounded cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteComponent(component.id);
                  }}
                  className="p-1 bg-destructive text-destructive-foreground rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );

      case 'email_spacer':
        return (
          <div
            style={{
              ...baseStyle,
              minHeight: `${config.height || 40}px`
            }}
            onClick={handleClick}
            className="group cursor-pointer transition-all hover:shadow-sm"
          >
            {isSelected && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  {...listeners}
                  className="p-1 bg-primary text-primary-foreground rounded cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteComponent(component.id);
                  }}
                  className="p-1 bg-destructive text-destructive-foreground rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );

      case 'email_footer':
        return (
          <div
            style={baseStyle}
            onClick={handleClick}
            className="group cursor-pointer transition-all hover:shadow-sm"
          >
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: '12px',
                color: darkMode ? '#888888' : '#666666',
                margin: '0',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
              }}>
                {config.footerText || 'If you no longer wish to receive these emails, you can unsubscribe here.'}
              </p>
            </div>
            {isSelected && (
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  {...listeners}
                  className="p-1 bg-primary text-primary-foreground rounded cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteComponent(component.id);
                  }}
                  className="p-1 bg-destructive text-destructive-foreground rounded"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div
            key={component.id}
            style={baseStyle}
            onClick={handleClick}
            className="cursor-pointer transition-all"
          >
            <p style={{ color: darkMode ? '#cccccc' : '#666666', textAlign: 'center' }}>
              Unknown component: {component.type}
            </p>
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      {renderComponent(component)}
    </div>
  );
};

export const EmailPreview: React.FC<EmailPreviewProps> = ({
  components,
  darkMode,
  onToggleDarkMode,
  onSelectComponent,
  onComponentsChange,
  onAddComponent,
  selectedComponentId,
  templateConfig
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = components.findIndex((item) => item.id === active.id);
      const newIndex = components.findIndex((item) => item.id === over.id);

      const newComponents = arrayMove(components, oldIndex, newIndex).map((comp, index) => ({
        ...comp,
        order: index
      }));

      onComponentsChange(newComponents);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const componentType = e.dataTransfer.getData('text/plain');
    if (componentType && componentType.startsWith('email_')) {
      onAddComponent(componentType);
    }
  }, [onAddComponent]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDeleteComponent = (id: string) => {
    const newComponents = components
      .filter(comp => comp.id !== id)
      .map((comp, index) => ({ ...comp, order: index }));
    onComponentsChange(newComponents);
  };

  const sortedComponents = [...components].sort((a, b) => a.order - b.order);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Email Preview
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleDarkMode}
            className="flex items-center gap-2"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {darkMode ? 'Light' : 'Dark'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          className="w-full min-h-[400px] border rounded-lg overflow-hidden"
          style={{ 
            backgroundColor: darkMode ? '#000000' : '#f4f4f4',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          {/* Email Client Preview Header */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: darkMode ? '#1a1a1a' : '#ffffff',
            borderBottom: `1px solid ${darkMode ? '#333333' : '#e5e5e5'}`,
            fontSize: '14px'
          }}>
            <div style={{ 
              fontWeight: 'bold',
              color: darkMode ? '#ffffff' : '#333333',
              marginBottom: '4px'
            }}>
              {templateConfig.from_name} &lt;{templateConfig.from_email}&gt;
            </div>
            <div style={{
              color: darkMode ? '#cccccc' : '#666666',
              marginBottom: '2px'
            }}>
              {templateConfig.subject}
            </div>
            {templateConfig.previewText && (
              <div style={{
                color: darkMode ? '#888888' : '#999999',
                fontSize: '12px'
              }}>
                {templateConfig.previewText}
              </div>
            )}
          </div>

          {/* Email Content */}
          <div 
            style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: darkMode ? '#1a1a1a' : '#ffffff' }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {sortedComponents.length === 0 ? (
              <div style={{
                padding: '60px 20px',
                textAlign: 'center',
                color: darkMode ? '#666666' : '#999999'
              }}>
                <p>Drag components here to build your email template</p>
              </div>
            ) : (
              <DndContext
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                collisionDetection={closestCenter}
              >
                <SortableContext items={sortedComponents.map(c => c.id)} strategy={verticalListSortingStrategy}>
                  {sortedComponents.map((component) => (
                    <SortableEmailComponent
                      key={component.id}
                      component={component}
                      darkMode={darkMode}
                      onSelectComponent={onSelectComponent}
                      onDeleteComponent={handleDeleteComponent}
                      selectedComponentId={selectedComponentId}
                    />
                  ))}
                </SortableContext>
                
                <DragOverlay>
                  {activeId ? (
                    <div style={{
                      padding: '20px',
                      backgroundColor: darkMode ? '#2a2a2a' : '#f5f5f5',
                      border: '2px dashed #5F57FF',
                      borderRadius: '4px',
                      opacity: 0.8
                    }}>
                      Moving component...
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};