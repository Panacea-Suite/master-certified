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
import { FlowPreview } from './flow-editor/FlowPreview';
import { PageSection } from './flow-editor/PageSection';
import { ComponentEditor } from './flow-editor/ComponentEditor';
import { PageManager, PageData } from './flow-editor/PageManager';
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
  const [flowName, setFlowName] = useState(templateToEdit?.name || 'Untitled Flow');
  
  // Initialize pages from template or create mandatory pages with landing page
  const initializePages = (): PageData[] => {
    if (templateToEdit?.flow_config?.pages) {
      return templateToEdit.flow_config.pages;
    }
    
    // Create all pages including initial landing page and mandatory pages with default content
    const allPages: PageData[] = [
      {
        id: 'landing-page',
        type: 'landing',
        name: 'Landing Page',
        sections: [],
        settings: {},
        isMandatory: false,
        order: 0
      },
      {
        id: 'store-selection',
        type: 'store_selection',
        name: 'Store Selection',
        sections: [
          {
            id: 'store-title',
            type: 'text',
            order: 0,
            config: {
              content: 'Select Your Store Location',
              fontSize: 24,
              textColor: '#000000',
              backgroundColor: 'transparent',
              padding: 4
            }
          },
          {
            id: 'store-description',
            type: 'text',
            order: 1,
            config: {
              content: 'Choose the store location where you would like to pick up your order.',
              fontSize: 16,
              textColor: '#666666',
              backgroundColor: 'transparent',
              padding: 4
            }
          },
          {
            id: 'store-selector',
            type: 'store_selector',
            order: 2,
            config: {
              label: 'Store Location',
              placeholder: 'Choose a store...',
              storeOptions: 'Downtown Location\nMall Branch\nAirport Store\nSuburban Center',
              backgroundColor: '#ffffff',
              textColor: '#000000',
              borderColor: '#e5e7eb',
              focusBorderColor: '#3b82f6',
              padding: 4
            }
          }
        ],
        settings: {},
        isMandatory: true,
        order: 1
      },
      {
        id: 'login-signup',
        type: 'account_creation', 
        name: 'Login/Signup',
        sections: [
          {
            id: 'auth-title',
            type: 'text',
            order: 0,
            config: {
              content: 'Welcome Back!',
              fontSize: 24,
              textColor: '#000000',
              backgroundColor: 'transparent',
              padding: 4
            }
          },
          {
            id: 'auth-description',
            type: 'text',
            order: 1,
            config: {
              content: 'Sign in to your account or create a new one to continue.',
              fontSize: 16,
              textColor: '#666666',
              backgroundColor: 'transparent',
              padding: 4
            }
          }
        ],
        settings: {},
        isMandatory: true,
        order: 2
      },
      {
        id: 'verification',
        type: 'authentication',
        name: 'Verification',
        sections: [
          {
            id: 'verify-title',
            type: 'text',
            order: 0,
            config: {
              content: 'Verify Your Account',
              fontSize: 24,
              textColor: '#000000',
              backgroundColor: 'transparent',
              padding: 4
            }
          },
          {
            id: 'verify-description',
            type: 'text',
            order: 1,
            config: {
              content: 'Please check your email and follow the verification link to complete your registration.',
              fontSize: 16,
              textColor: '#666666',
              backgroundColor: 'transparent',
              padding: 4
            }
          }
        ],
        settings: {},
        isMandatory: true,
        order: 3
      },
      {
        id: 'thank-you',
        type: 'thank_you',
        name: 'Thank You',
        sections: [
          {
            id: 'thanks-title',
            type: 'text',
            order: 0,
            config: {
              content: 'Thank You!',
              fontSize: 24,
              textColor: '#000000',
              backgroundColor: 'transparent',
              padding: 4
            }
          },
          {
            id: 'thanks-description',
            type: 'text',
            order: 1,
            config: {
              content: 'Your registration is complete. You can now enjoy all the benefits of our service.',
              fontSize: 16,
              textColor: '#666666',
              backgroundColor: 'transparent',
              padding: 4
            }
          }
        ],
        settings: {},
        isMandatory: true,
        order: 4
      }
    ];

    // Migrate legacy single-page format to multi-page (add to landing page)
    if (templateToEdit?.flow_config?.sections) {
      allPages[0].sections = templateToEdit.flow_config.sections;
    }
    
    return allPages;
  };

  const [pages, setPages] = useState<PageData[]>(initializePages());
  const [currentPageId, setCurrentPageId] = useState<string>(pages[0]?.id || '');
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
      const currentPage = getCurrentPage();
      if (!currentPage) return;

      const sections = currentPage.sections;
      const oldIndex = sections.findIndex((item) => item.id === active.id);
      const newIndex = sections.findIndex((item) => item.id === over?.id);
      
      const reorderedItems = arrayMove(sections, oldIndex, newIndex);
      
      // Update order indices and update the current page
      const updatedSections = reorderedItems.map((item, index) => ({
        ...item,
        order: index
      }));

      updateCurrentPageSections(updatedSections);
    }

    setActiveId(null);
  }, [currentPageId]);

  // Helper functions for page management
  const getCurrentPage = () => pages.find(p => p.id === currentPageId);
  
  const updateCurrentPageSections = (newSections: SectionData[]) => {
    setPages(prev => prev.map(page => 
      page.id === currentPageId 
        ? { ...page, sections: newSections }
        : page
    ));
  };

  const handleAddPage = (pageType: PageData['type']) => {
    const pageTypeNames = {
      landing: 'Landing Page',
      store_selection: 'Store Selection',
      account_creation: 'Login/Signup', 
      authentication: 'Verification',
      content_display: 'Content Display',
      thank_you: 'Thank You'
    };

    // Calculate the order for the new page (insert before thank you page)
    const thankYouPage = pages.find(p => p.type === 'thank_you');
    const insertOrder = thankYouPage ? thankYouPage.order : pages.length + 1;

    const newPage: PageData = {
      id: `${pageType}-${Date.now()}`,
      type: pageType,
      name: pageTypeNames[pageType],
      sections: [],
      settings: {},
      isMandatory: false,
      order: insertOrder
    };

    // Update orders of pages that come after the insertion point
    const updatedPages = pages.map(page => 
      page.order >= insertOrder ? { ...page, order: page.order + 1 } : page
    );

    setPages([...updatedPages, newPage]);
    setCurrentPageId(newPage.id);
    toast.success(`${pageTypeNames[pageType]} added to flow`);
  };

  const handleDeletePage = (pageId: string) => {
    const pageToDelete = pages.find(p => p.id === pageId);
    
    if (pageToDelete?.isMandatory) {
      toast.error('Cannot delete mandatory pages');
      return;
    }
    
    setPages(prev => prev.filter(p => p.id !== pageId));
    
    if (currentPageId === pageId) {
      const remainingPages = pages.filter(p => p.id !== pageId);
      setCurrentPageId(remainingPages[0]?.id || '');
    }
    
    toast.success('Page removed from flow');
  };

  const handleAddSection = (sectionType: string, position?: number, parentId?: string, columnIndex?: number) => {
    const currentPage = getCurrentPage();
    if (!currentPage) return;

    const insertIndex = position !== undefined ? position : currentPage.sections.length;
    
    const newSection: SectionData = {
      id: `${sectionType}-${Date.now()}`,
      type: sectionType,
      order: insertIndex,
      config: getDefaultConfig(sectionType),
      children: sectionType === 'column' ? [] : undefined
    };

    if (parentId && columnIndex !== undefined) {
      // Adding to a column
      const updatedSections = currentPage.sections.map(section => {
        if (section.id === parentId) {
          if (!section.children) {
            section.children = [];
          }
          const updatedChildren = [...section.children];
          if (!Array.isArray(updatedChildren[columnIndex])) {
            updatedChildren[columnIndex] = [];
          }
          updatedChildren[columnIndex] = [...updatedChildren[columnIndex], newSection];
          return { ...section, children: updatedChildren };
        }
        return section;
      });
      
      updateCurrentPageSections(updatedSections);
    } else {
      // Adding to main sections
      const updatedSections = [...currentPage.sections];
      updatedSections.splice(insertIndex, 0, newSection);
      
      // Reorder all sections based on their new positions
      const reorderedSections = updatedSections.map((section, index) => ({
        ...section,
        order: index
      }));
      
      updateCurrentPageSections(reorderedSections);
    }
    
    setSelectedSection(newSection);
    toast.success('Section added to page');
  };

  const handleDeleteSection = (sectionId: string) => {
    const currentPage = getCurrentPage();
    if (!currentPage) return;

    const updatedSections = currentPage.sections.filter(s => s.id !== sectionId);
    updateCurrentPageSections(updatedSections);
    
    if (selectedSection?.id === sectionId) {
      setSelectedSection(null);
    }
    toast.success('Section removed');
  };

  const handleUpdateSection = (sectionId: string, newConfig: any) => {
    const currentPage = getCurrentPage();
    if (!currentPage) return;

    const updatedSections = currentPage.sections.map(s => 
      s.id === sectionId 
        ? { ...s, config: { ...s.config, ...newConfig } }
        : s
    );
    
    updateCurrentPageSections(updatedSections);
    
    if (selectedSection?.id === sectionId) {
      setSelectedSection(prev => 
        prev ? { ...prev, config: { ...prev.config, ...newConfig } } : null
      );
    }
  };

  const handleSave = async () => {
    if (!flowName.trim()) {
      toast.error('Please enter a flow name');
      return;
    }

    if (pages.length === 0) {
      toast.error('Flow must have at least one page');
      return;
    }

    setIsSaving(true);
    
    try {
      console.log('Starting to save flow...');
      
      // Create flow configuration with multi-page structure
      const flowConfig = {
        pages: pages.map(page => ({
          ...page,
          sections: page.sections.sort((a, b) => a.order - b.order)
        })),
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
      store_selector: {
        label: 'Store Location',
        placeholder: 'Choose a store...',
        storeOptions: 'Downtown Location\nMall Branch\nAirport Store',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        borderColor: '#e5e7eb',
        focusBorderColor: '#3b82f6',
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

  const currentPage = getCurrentPage();
  const activeSection = currentPage?.sections.find(s => s.id === activeId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Flow Builder</DialogTitle>
        </DialogHeader>
        <div className="flex h-[95vh]">
          {/* Left Panel - Pages & Components */}
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
                <h3 className="font-semibold">Flow Builder</h3>
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
              
              {/* Page Manager */}
              <PageManager
                pages={pages}
                currentPageId={currentPageId}
                onSelectPage={setCurrentPageId}
                onAddPage={handleAddPage}
                onDeletePage={handleDeletePage}
                onReorderPages={() => {}} // TODO: Implement reordering
              />

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
              
              {/* Current Page Sections */}
              {currentPage && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-muted-foreground">
                    {currentPage.name} Sections
                  </h4>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                  >
                    <SortableContext
                      items={currentPage.sections.map(s => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-1">
                        {currentPage.sections
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
              )}
            </div>
          </div>

          {/* Center Panel - Flow Preview */}
          <div className="flex-1 flex flex-col bg-gray-50">
            <div className="p-4 bg-white border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Flow Preview</h3>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Flow'}
                </Button>
              </div>
            </div>
            
            <FlowPreview
              pages={pages}
              currentPageId={currentPageId}
              onSelectPage={setCurrentPageId}
              selectedSectionId={selectedSection?.id}
              onSelectSection={setSelectedSection}
              onAddSection={handleAddSection}
              backgroundColor={pageSettings.backgroundColor}
            />
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