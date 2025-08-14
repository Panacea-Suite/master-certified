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
import { PageSection } from './flow-editor/PageSection';
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

interface SectionData {
  id: string;
  type: string;
  order: number;
  config: any;
  children?: SectionData[][];
}

export const FlowEditor: React.FC<FlowEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  templateToEdit
}) => {
  const [flowName, setFlowName] = useState(templateToEdit?.name || 'Untitled Page');
  const [sections, setSections] = useState<SectionData[]>(
    templateToEdit?.flow_config?.sections || []
  );
  const [pageSettings, setPageSettings] = useState({
    backgroundColor: templateToEdit?.flow_config?.theme?.backgroundColor || '#ffffff'
  });
  const [selectedSection, setSelectedSection] = useState<SectionData | null>(null);
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
      setSections((items) => {
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

  const handleAddSection = (sectionType: string, position?: number, parentId?: string, columnIndex?: number) => {
    const insertIndex = position !== undefined ? position : sections.length;
    
    const newSection: SectionData = {
      id: `${sectionType}-${Date.now()}`,
      type: sectionType,
      order: insertIndex,
      config: getDefaultConfig(sectionType),
      children: sectionType === 'column' ? [] : undefined
    };

    if (parentId && columnIndex !== undefined) {
      // Adding to a column
      setSections(prev => prev.map(section => {
        if (section.id === parentId) {
          if (!section.children) {
            section.children = [];
          }
          const updatedChildren = [...section.children];
          // Ensure the column array exists and is properly typed
          if (!Array.isArray(updatedChildren[columnIndex])) {
            updatedChildren[columnIndex] = [];
          }
          updatedChildren[columnIndex] = [...updatedChildren[columnIndex], newSection];
          return { ...section, children: updatedChildren };
        }
        return section;
      }));
    } else {
      // Adding to main sections
      const updatedSections = [...sections];
      updatedSections.splice(insertIndex, 0, newSection);
      
      // Reorder all sections based on their new positions
      const reorderedSections = updatedSections.map((section, index) => ({
        ...section,
        order: index
      }));
      
      setSections(reorderedSections);
    }
    
    setSelectedSection(newSection);
    toast.success('Section added to page');
  };

  const handleDeleteSection = (sectionId: string) => {
    setSections(prev => prev.filter(s => s.id !== sectionId));
    if (selectedSection?.id === sectionId) {
      setSelectedSection(null);
    }
    toast.success('Section removed');
  };

  const handleUpdateSection = (sectionId: string, newConfig: any) => {
    setSections(prev => 
      prev.map(s => 
        s.id === sectionId 
          ? { ...s, config: { ...s.config, ...newConfig } }
          : s
      )
    );
    
    if (selectedSection?.id === sectionId) {
      setSelectedSection(prev => 
        prev ? { ...prev, config: { ...prev.config, ...newConfig } } : null
      );
    }
  };

  const handleSave = async () => {
    if (!flowName.trim()) {
      toast.error('Please enter a page name');
      return;
    }

    setIsSaving(true);
    
     try {
     // Create page configuration
      let pageConfig = {
        sections: sections.sort((a, b) => a.order - b.order),
        theme: {
          primaryColor: '#3b82f6',
          backgroundColor: pageSettings.backgroundColor,
          fontFamily: 'Inter'
        },
        settings: templateToEdit?.flow_config?.settings || {
          showProgress: true,
          allowBack: true,
          autoSave: true
        }
      };

      // If editing an existing template, create a new page based on it
      if (templateToEdit) {
        const { data: { user } } = await supabase.auth.getUser();
        
        const pageData = {
          name: flowName,
          flow_config: pageConfig,
          is_template: false,
          created_by: user?.id || null,
          template_category: null,
          campaign_id: null // Will be set when creating campaign
        };

        onSave(pageData);
      } else {
        // Creating new page from scratch
        const pageData = {
          name: flowName,
          flow_config: pageConfig,
          is_template: false,
          template_category: null,
          campaign_id: null
        };

        onSave(pageData);
      }

      toast.success('Page saved successfully');
    } catch (error) {
      console.error('Error saving page:', error);
      toast.error('Failed to save page');
    } finally {
      setIsSaving(false);
    }
  };

  const getDefaultConfig = (sectionType: string) => {
    const configs = {
      text: {
        content: 'Your text content goes here...',
        fontSize: 16,
        textColor: '#000000',
        backgroundColor: 'transparent',
        padding: 4
      },
      image: {
        imageUrl: '',
        alt: '',
        caption: '',
        height: '',
        padding: 4
      },
      divider: {
        width: 100,
        thickness: 1,
        color: '#e5e7eb',
        padding: 4
      },
      column: {
        layout: '2-col-50-50',
        gap: 4,
        padding: 4,
        backgroundColor: 'transparent'
      }
    };

    return configs[sectionType as keyof typeof configs] || { padding: 4 };
  };

  const activeSection = sections.find(s => s.id === activeId);

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
                <h3 className="font-semibold">Page Builder</h3>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pageName">Page Name</Label>
                <Input
                  id="pageName"
                  value={flowName}
                  onChange={(e) => setFlowName(e.target.value)}
                  placeholder="Enter page name..."
                />
              </div>

              <Separator />
              
              {/* Page Settings */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Page Settings</h4>
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={pageSettings.backgroundColor}
                    onChange={(e) => setPageSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="h-8"
                  />
                </div>
              </div>

              <Separator />
              
              <ComponentPalette onAddComponent={handleAddSection} />
              
              <Separator />
              
              {/* Page Sections List */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-muted-foreground">Page Sections</h4>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  modifiers={[restrictToVerticalAxis]}
                >
                  <SortableContext
                    items={sections.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {sections
                        .sort((a, b) => a.order - b.order)
                        .map((section) => (
              <PageSection
                key={section.id}
                section={section}
                isSelected={selectedSection?.id === section.id}
                onSelect={() => setSelectedSection(section)}
                onDelete={() => handleDeleteSection(section.id)}
                onAddSection={handleAddSection}
              />
                        ))}
                    </div>
                  </SortableContext>

                  <DragOverlay>
                    {activeSection ? (
                      <PageSection
                        section={activeSection}
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
                  <h3 className="font-semibold">Live Preview</h3>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Page'}
                </Button>
              </div>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-8">
              <MobilePreview 
                sections={sections.sort((a, b) => a.order - b.order)}
                selectedSectionId={selectedSection?.id}
                onSelectSection={setSelectedSection}
                onAddSection={handleAddSection}
                backgroundColor={pageSettings.backgroundColor}
              />
            </div>
          </div>

          {/* Right Panel - Section Properties */}
          <div className="w-80 border-l bg-muted/30 p-4 overflow-y-auto">
            {selectedSection ? (
              <ComponentEditor
                section={selectedSection}
                onUpdate={(config) => handleUpdateSection(selectedSection.id, config)}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-lg bg-muted mx-auto flex items-center justify-center">
                    ⚙️
                  </div>
                  <p className="text-sm">Select a section to edit its properties</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};