import React, { useState, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, pointerWithin, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface EmailComponent {
  id: string;
  type: string;
  config: any;
  order: number;
}

interface EmailEditorProps {
  components: EmailComponent[];
  onComponentsChange: (components: EmailComponent[]) => void;
  onSelectComponent: (component: EmailComponent) => void;
  onAddComponent: (componentType: string) => void;
  selectedComponentId?: string;
  darkMode: boolean;
}

interface SortableComponentProps {
  component: EmailComponent;
  onSelect: (component: EmailComponent) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  darkMode: boolean;
}

const SortableComponent: React.FC<SortableComponentProps> = ({
  component,
  onSelect,
  onDelete,
  isSelected,
  darkMode
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
    opacity: isDragging ? 0.5 : 1,
  };

  const getComponentPreview = () => {
    const { config } = component;
    
    switch (component.type) {
      case 'email_header':
        return (
          <div className="text-center py-4">
            <h1 className="text-lg font-bold">
              {config.title || 'Your Brand'}
            </h1>
          </div>
        );
      case 'email_heading':
        return (
          <h2 className="text-base font-semibold py-2">
            {config.text || 'Heading Text'}
          </h2>
        );
      case 'email_text':
        return (
          <p className="text-sm py-2 text-muted-foreground">
            {config.text || 'Email text content...'}
          </p>
        );
      case 'email_button':
        return (
          <div className="py-2">
            <Button size="sm" style={{ backgroundColor: config.buttonBgColor || '#5F57FF' }}>
              {config.buttonText || 'Click Here'}
            </Button>
          </div>
        );
      case 'email_image':
        return (
          <div className="py-2 text-sm text-muted-foreground">
            📷 Image Component
          </div>
        );
      case 'email_divider':
        return (
          <div className="py-2">
            <hr className="border-muted" />
          </div>
        );
      case 'email_spacer':
        return (
          <div className="py-2 text-sm text-muted-foreground text-center">
            ↕️ Spacer ({config.height || 40}px)
          </div>
        );
      case 'email_footer':
        return (
          <div className="py-2 text-xs text-muted-foreground text-center">
            {config.footerText || 'Email footer...'}
          </div>
        );
      default:
        return (
          <div className="py-2 text-sm text-muted-foreground">
            {component.type}
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`group relative ${isSelected ? 'ring-2 ring-primary' : ''}`}
    >
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'border-primary' : ''
        }`}
        onClick={() => onSelect(component)}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {getComponentPreview()}
            </div>
            
            <div className="flex items-center gap-2 ml-2">
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(component.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              
              <div
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-2 h-4 flex flex-col justify-center items-center">
                  <div className="w-full h-0.5 bg-muted-foreground rounded mb-0.5"></div>
                  <div className="w-full h-0.5 bg-muted-foreground rounded mb-0.5"></div>
                  <div className="w-full h-0.5 bg-muted-foreground rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const EmailEditor: React.FC<EmailEditorProps> = ({
  components,
  onComponentsChange,
  onSelectComponent,
  onAddComponent,
  selectedComponentId,
  darkMode
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      <CardContent className="p-4">
        <div 
          className="min-h-[400px] border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 space-y-2"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {sortedComponents.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <p className="text-lg mb-2">📧</p>
                <p>Drag email components here to start building</p>
                <p className="text-sm mt-1">Components will appear in the order you add them</p>
              </div>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext items={sortedComponents.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {sortedComponents.map((component) => (
                  <SortableComponent
                    key={component.id}
                    component={component}
                    onSelect={onSelectComponent}
                    onDelete={handleDeleteComponent}
                    isSelected={selectedComponentId === component.id}
                    darkMode={darkMode}
                  />
                ))}
              </SortableContext>
              
              <DragOverlay>
                {activeId ? (
                  <Card className="opacity-90">
                    <CardContent className="p-3">
                      <div className="text-sm text-muted-foreground">
                        Moving component...
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </CardContent>
    </Card>
  );
};