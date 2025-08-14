import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ComponentPalette } from './flow-editor/ComponentPalette';
import { MobilePreview } from './flow-editor/MobilePreview';
import { FlowComponent } from './flow-editor/FlowComponent';
import { ComponentEditor } from './flow-editor/ComponentEditor';
import { Smartphone, Save, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FlowTemplate {
  id: string;
  name: string;
  template_category: string;
  flow_config: any;
  created_by: string | null;
}

interface FlowEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (flowData: any) => void;
  templateToEdit?: FlowTemplate | null;
}

interface FlowComponentData {
  id: string;
  type: string;
  order: number;
  config: any;
}

export const FlowEditor: React.FC<FlowEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  templateToEdit
}) => {
  const [flowName, setFlowName] = useState(templateToEdit?.name || 'Untitled Flow');
  const [components, setComponents] = useState<FlowComponentData[]>(
    templateToEdit?.flow_config?.components || []
  );
  const [selectedComponent, setSelectedComponent] = useState<FlowComponentData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        
        const reorderedItems = arrayMove(items, oldIndex, newIndex);
        
        // Update order indices
        return reorderedItems.map((item, index) => ({
          ...item,
          order: index
        }));
      });
    }

    setActiveId(null);
  }, []);

  const handleAddComponent = (componentType: string) => {
    const newComponent: FlowComponentData = {
      id: `${componentType}-${Date.now()}`,
      type: componentType,
      order: components.length,
      config: getDefaultConfig(componentType)
    };

    setComponents(prev => [...prev, newComponent]);
    setSelectedComponent(newComponent);
    toast.success('Component added to flow');
  };

  const handleDeleteComponent = (componentId: string) => {
    setComponents(prev => prev.filter(c => c.id !== componentId));
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }
    toast.success('Component removed');
  };

  const handleUpdateComponent = (componentId: string, newConfig: any) => {
    setComponents(prev => 
      prev.map(c => 
        c.id === componentId 
          ? { ...c, config: { ...c.config, ...newConfig } }
          : c
      )
    );
    
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(prev => 
        prev ? { ...prev, config: { ...prev.config, ...newConfig } } : null
      );
    }
  };

  const handleSave = async () => {
    if (!flowName.trim()) {
      toast.error('Please enter a flow name');
      return;
    }

    setIsSaving(true);
    
    try {
      const flowConfig = {
        components: components.sort((a, b) => a.order - b.order),
        theme: templateToEdit?.flow_config?.theme || {
          primaryColor: '#3b82f6',
          backgroundColor: '#ffffff',
          fontFamily: 'Inter'
        },
        settings: templateToEdit?.flow_config?.settings || {
          showProgress: true,
          allowBack: true,
          autoSave: true
        }
      };

      // If editing an existing template, create a new flow based on it
      if (templateToEdit) {
        const { data: { user } } = await supabase.auth.getUser();
        
        const flowData = {
          name: flowName,
          flow_config: flowConfig,
          is_template: false,
          created_by: user?.id || null,
          template_category: null,
          campaign_id: null // Will be set when creating campaign
        };

        onSave(flowData);
      } else {
        // Creating new flow from scratch
        const flowData = {
          name: flowName,
          flow_config: flowConfig,
          is_template: false,
          template_category: null,
          campaign_id: null
        };

        onSave(flowData);
      }

      toast.success('Flow saved successfully');
    } catch (error) {
      console.error('Error saving flow:', error);
      toast.error('Failed to save flow');
    } finally {
      setIsSaving(false);
    }
  };

  const getDefaultConfig = (componentType: string) => {
    const configs = {
      welcome: {
        title: 'Welcome!',
        subtitle: 'Thanks for scanning our QR code',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        showLogo: true,
        buttonText: 'Get Started'
      },
      registration_form: {
        title: 'Tell us about yourself',
        fields: [
          { name: 'email', type: 'email', required: true, label: 'Email Address' },
          { name: 'name', type: 'text', required: true, label: 'Full Name' }
        ],
        buttonText: 'Continue',
        backgroundColor: '#ffffff'
      },
      content_display: {
        title: 'Content Title',
        content: 'Your content goes here...',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        buttonText: 'Continue'
      },
      survey_form: {
        title: 'Your Feedback',
        questions: [
          { id: 'rating', type: 'rating', question: 'How satisfied are you?', required: true, scale: 5 }
        ],
        buttonText: 'Submit',
        backgroundColor: '#ffffff'
      },
      verification: {
        title: 'Verify Your Email',
        message: 'Please check your email and click the verification link.',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        buttonText: 'Resend Email'
      },
      completion: {
        title: 'Thank You!',
        message: 'Your submission has been received.',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        showConfetti: true
      }
    };

    return configs[componentType as keyof typeof configs] || {};
  };

  const activeComponent = components.find(c => c.id === activeId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
        <div className="flex h-[95vh]">
          {/* Left Panel - Component Palette */}
          <div className="w-80 border-r bg-muted/30 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="font-semibold">Flow Editor</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="flowName">Flow Name</Label>
                <Input
                  id="flowName"
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  placeholder="Enter flow name..."
                />
              </div>

              <Separator />
              
              <ComponentPalette onAddComponent={handleAddComponent} />
              
              <Separator />
              
              {/* Flow Components List */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Flow Steps</h4>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <SortableContext
                    items={components.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {components
                        .sort((a, b) => a.order - b.order)
                        .map((component) => (
                          <FlowComponent
                            key={component.id}
                            component={component}
                            isSelected={selectedComponent?.id === component.id}
                            onSelect={() => setSelectedComponent(component)}
                            onDelete={() => handleDeleteComponent(component.id)}
                          />
                        ))}
                    </div>
                  </SortableContext>

                  <DragOverlay>
                    {activeComponent ? (
                      <FlowComponent
                        component={activeComponent}
                        isSelected={false}
                        onSelect={() => {}}
                        onDelete={() => {}}
                      />
                    ) : null}
                  </DragOverlay>
                </DndContext>
              </div>
            </div>
          </div>

          {/* Center Panel - Mobile Preview */}
          <div className="flex-1 flex flex-col bg-gray-50">
            <div className="p-4 bg-white border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Mobile Preview</h3>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Flow'}
                </Button>
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-8">
              <MobilePreview 
                components={components.sort((a, b) => a.order - b.order)}
                selectedComponentId={selectedComponent?.id}
              />
            </div>
          </div>

          {/* Right Panel - Component Properties */}
          <div className="w-80 border-l bg-muted/30 p-4 overflow-y-auto">
            {selectedComponent ? (
              <ComponentEditor
                component={selectedComponent}
                onUpdate={(config) => handleUpdateComponent(selectedComponent.id, config)}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-lg bg-muted mx-auto flex items-center justify-center">
                    ⚙️
                  </div>
                  <p className="text-sm">Select a component to edit its properties</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};