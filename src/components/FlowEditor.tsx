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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ImageEditor } from '@/components/ImageEditor';
import { ComponentPalette } from './flow-editor/ComponentPalette';
import { FlowPreview, DEVICE_SPECS, DeviceSpec } from './flow-editor/FlowPreview';
import { PageSection } from './flow-editor/PageSection';
import { ComponentEditor } from './flow-editor/ComponentEditor';
import { PageManager, PageData } from './flow-editor/PageManager';
import { Smartphone, Save, ArrowLeft, Upload, ChevronDown, ChevronRight, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DesignTemplateSelector } from './DesignTemplateSelector';
import { TemplateStyleProvider } from './TemplateStyleProvider';
import { BrandColorPicker } from '@/components/ui/brand-color-picker';

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
  templateToEdit?: any | null;
  brandData?: {
    id: string;
    name: string;
    logo_url?: string;
    brand_colors?: any;
  } | null;
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
  templateToEdit,
  brandData
}) => {
  const { user } = useAuth();
  const [selectedDevice, setSelectedDevice] = useState<DeviceSpec>(DEVICE_SPECS[0]); // Default to iPhone 14
  const [flowName, setFlowName] = useState(
    (templateToEdit && 'name' in templateToEdit) ? templateToEdit.name : 'Untitled Flow'
  );
  
  // Initialize pages from template or create mandatory pages with landing page
  const initializePages = (): PageData[] => {
    // Handle flow_config format for user templates (synchronous)
    if (templateToEdit?.flow_config?.pages) {
      return templateToEdit.flow_config.pages.map((page: any, index: number) => ({
        ...page,
        sections: page.sections || [],
        settings: page.settings || {},
        order: index
      }));
    }
    
    // For system templates, we'll process them in useEffect after component mounts
    
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
  const [currentPageId, setCurrentPageId] = useState<string>('');
  
  // Effect to handle template processing after component mounts and fetch fresh brand data when editor opens
  React.useEffect(() => {
    if (!isOpen || !user) return;

    // Always fetch fresh brand data when editor opens
    const fetchBrandData = async () => {
      const { data: freshBrandData } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Update global header with fresh brand data
      if (freshBrandData) {
        setGlobalHeader(prev => ({
          ...prev,
          brandName: freshBrandData.name || prev.brandName,
          logoUrl: freshBrandData.logo_url || prev.logoUrl,
          backgroundColor: (freshBrandData.brand_colors as any)?.primary || prev.backgroundColor
        }));

        // Also update any logo images in sections to use the database URL
        setPages(prevPages => 
          prevPages.map(page => ({
            ...page,
            sections: page.sections.map(section => {
              if (section.type === 'image' && section.config?.isLogo && freshBrandData.logo_url) {
                return {
                  ...section,
                  config: {
                    ...section.config,
                    imageUrl: freshBrandData.logo_url
                  }
                };
              }
              return section;
            })
          }))
        );
      }

      // Process template if needed
      if (templateToEdit && !templateToEdit.flow_config?.pages) {
        try {
          const { processTemplateData, templateToFlowConfig } = await import('@/utils/templateProcessor');
          const processedTemplate = processTemplateData(templateToEdit);
          console.log('Processed template for editor:', processedTemplate);
          
          // Use fresh brand data for template processing
          const activeBrandData = freshBrandData || brandData;
          console.log('Active brand data in FlowEditor:', activeBrandData);
          
          // Get the flow config with proper brand data integration
          const flowConfig = templateToFlowConfig(processedTemplate, activeBrandData);
          console.log('Flow config with brand data:', flowConfig);
          
          // Convert processed pages to PageData format
          const convertedPages = processedTemplate.pages.map((page: any, index: number) => {
            const mandatoryPageTypes = ['store_selection', 'authentication', 'purchase_details', 'thank_you'];
            const isMandatory = mandatoryPageTypes.includes(page.type);
            
            return {
              id: page.id,
              type: page.type,
              name: page.name,
              sections: page.sections?.map((section: any, sectionIndex: number) => ({
                id: section.id,
                type: section.type,
                order: sectionIndex,
                config: section.config
              })) || [],
              settings: page.settings || {},
              isMandatory,
              order: index
            };
          });
          
          // Update global header state with processed template data
          if (flowConfig.globalHeader) {
            console.log('Setting global header with logo URL:', flowConfig.globalHeader.logoUrl);
            setGlobalHeader({
              showHeader: flowConfig.globalHeader.showHeader,
              brandName: flowConfig.globalHeader.brandName,
              logoUrl: flowConfig.globalHeader.logoUrl,
              backgroundColor: flowConfig.globalHeader.backgroundColor,
              logoSize: flowConfig.globalHeader.logoSize
            });
          }
          
          // Update pages state after processing
          setPages(convertedPages);
          if (convertedPages.length > 0 && !currentPageId) {
            setCurrentPageId(convertedPages[0].id);
          }
        } catch (error) {
          console.error('Error processing template in editor:', error);
        }
      }
    };

    fetchBrandData();
  }, [isOpen, user, templateToEdit]);

  // Set current page if not set and pages exist
  React.useEffect(() => {
    if (pages.length > 0 && !currentPageId) {
      setCurrentPageId(pages[0].id);
    }
  }, [pages.length, currentPageId]);
  const [pageSettings, setPageSettings] = useState({
    backgroundColor: templateToEdit?.flow_config?.theme?.backgroundColor || '#ffffff'
  });
  const [globalHeader, setGlobalHeader] = useState({
    showHeader: templateToEdit?.flow_config?.globalHeader?.showHeader ?? true,
    brandName: templateToEdit?.flow_config?.globalHeader?.brandName || brandData?.name || 'Brand',
    logoUrl: templateToEdit?.flow_config?.globalHeader?.logoUrl || brandData?.logo_url || '',
    backgroundColor: templateToEdit?.flow_config?.globalHeader?.backgroundColor || brandData?.brand_colors?.primary || '#3b82f6',
    logoSize: templateToEdit?.flow_config?.globalHeader?.logoSize || 'medium'
  });
  const [selectedSection, setSelectedSection] = useState<SectionData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingLogo, setIsEditingLogo] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    templateToEdit?.flow_config?.design_template_id || null
  );
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    flowName: false,
    pages: false,
    globalHeader: false,
    pageSettings: false,
    designTemplate: false,
    components: false,
    sections: false
  });
  
  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

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
        globalHeader,
        design_template_id: selectedTemplateId,
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
        // Creating new template from scratch
        const flowData = {
          name: flowName,
          flow_config: flowConfig,
          is_template: false,
          template_category: null,
          campaign_id: null
        };

        onSave(flowData);
      }

      // Don't show toast here - let the parent component handle notifications
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

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setShowTemplateSelector(false);
    toast.success('Design template applied successfully');
  };

  return (
    <TemplateStyleProvider 
      templateId={selectedTemplateId} 
      brandColors={brandData?.brand_colors}
    >
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
              
              {/* Flow Name Section */}
              <Collapsible open={!collapsedSections.flowName} onOpenChange={() => toggleSection('flowName')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-sm font-medium p-2 h-auto hover:bg-accent">
                    <span>Flow Name</span>
                    {collapsedSections.flowName ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <Input
                    id="flowName"
                    value={flowName}
                    onChange={(e) => setFlowName(e.target.value)}
                    placeholder="Enter flow name..."
                  />
                </CollapsibleContent>
              </Collapsible>

              <Separator />
              
              {/* Page Manager Section */}
              <Collapsible open={!collapsedSections.pages} onOpenChange={() => toggleSection('pages')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-sm font-medium p-2 h-auto hover:bg-accent">
                    <span>Flow Pages</span>
                    {collapsedSections.pages ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <PageManager
                    pages={pages}
                    currentPageId={currentPageId}
                    onSelectPage={setCurrentPageId}
                    onAddPage={handleAddPage}
                    onDeletePage={handleDeletePage}
                    onReorderPages={() => {}} // TODO: Implement reordering
                  />
                </CollapsibleContent>
              </Collapsible>

              <Separator />
              
              {/* Global Header Settings */}
              <Collapsible open={!collapsedSections.globalHeader} onOpenChange={() => toggleSection('globalHeader')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-sm font-medium p-2 h-auto hover:bg-accent">
                    <span>Global Header</span>
                    {collapsedSections.globalHeader ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="showHeader"
                      checked={globalHeader.showHeader}
                      onChange={(e) => setGlobalHeader(prev => ({ ...prev, showHeader: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="showHeader" className="text-sm">Show Header</Label>
                  </div>
                  
                  {globalHeader.showHeader && (
                    <>
                      <div>
                        <Label htmlFor="brandName">Brand Name</Label>
                        <Input
                          id="brandName"
                          value={globalHeader.brandName}
                          onChange={(e) => setGlobalHeader(prev => ({ ...prev, brandName: e.target.value }))}
                          placeholder="Brand"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
                        <Input
                          id="logoUrl"
                          type="url"
                          value={globalHeader.logoUrl}
                          onChange={(e) => setGlobalHeader(prev => ({ ...prev, logoUrl: e.target.value }))}
                          placeholder="https://example.com/logo.png"
                        />
                      </div>

                      <div>
                        <Label htmlFor="logoUpload">Logo Image</Label>
                        <div className="space-y-2">
                          {globalHeader.logoUrl && (
                            <div className="flex justify-center">
                              <div 
                                className="relative group cursor-pointer"
                                onClick={() => {
                                  // Convert URL to file for editing
                                  fetch(globalHeader.logoUrl)
                                    .then(res => res.blob())
                                    .then(blob => {
                                      const file = new File([blob], 'logo.png', { type: blob.type });
                                      setSelectedLogoFile(file);
                                      setIsEditingLogo(true);
                                      setSelectedSection(null); // Clear selected section
                                    })
                                    .catch(console.error);
                                }}
                              >
                                <img
                                  src={globalHeader.logoUrl}
                                  alt="Brand Logo"
                                  className="w-16 h-16 object-contain border rounded-lg"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                  <span className="text-white text-xs font-medium">Click to Edit</span>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-center w-full">
                            <label htmlFor="logoUpload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50">
                              <div className="flex flex-col items-center justify-center">
                                <Upload className="w-6 h-6 mb-2 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground text-center">
                                  <span className="font-semibold">Click to upload & edit</span><br />
                                  PNG, JPG (MAX. 5MB)
                                </p>
                              </div>
                              <input
                                id="logoUpload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setSelectedLogoFile(file);
                                    setIsEditingLogo(true);
                                    setSelectedSection(null); // Clear selected section
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="logoSize">Logo Size</Label>
                        <Select
                          value={globalHeader.logoSize}
                          onValueChange={(value) => setGlobalHeader(prev => ({ ...prev, logoSize: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <BrandColorPicker
                        label="Header Background"
                        value={globalHeader.backgroundColor}
                        onChange={(color) => setGlobalHeader(prev => ({ ...prev, backgroundColor: color }))}
                        brandColors={brandData?.brand_colors}
                        id="headerBg"
                      />
                    </>
                  )}
                </CollapsibleContent>
              </Collapsible>
              
              <Separator />
              
              {/* Page Settings */}
              <Collapsible open={!collapsedSections.pageSettings} onOpenChange={() => toggleSection('pageSettings')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-sm font-medium p-2 h-auto hover:bg-accent">
                    <span>Page Settings</span>
                    {collapsedSections.pageSettings ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <BrandColorPicker
                    label="Background Color"
                    value={pageSettings.backgroundColor}
                    onChange={(color) => setPageSettings(prev => ({ ...prev, backgroundColor: color }))}
                    brandColors={brandData?.brand_colors}
                    id="backgroundColor"
                  />
                </CollapsibleContent>
              </Collapsible>

              <Separator />
              
              {/* Drag Sections */}
              <Collapsible open={!collapsedSections.components} onOpenChange={() => toggleSection('components')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-sm font-medium p-2 h-auto hover:bg-accent">
                    <span>Drag Sections</span>
                    {collapsedSections.components ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <ComponentPalette onAddComponent={handleAddSection} />
                </CollapsibleContent>
              </Collapsible>
              
              <Separator />
              
              {/* Current Page Sections */}
              {currentPage && (
                <Collapsible open={!collapsedSections.sections} onOpenChange={() => toggleSection('sections')}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between text-sm font-medium p-2 h-auto hover:bg-accent">
                      <span>{currentPage.name} Sections</span>
                      {collapsedSections.sections ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-2">
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
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>

          {/* Center Panel - Flow Preview */}
          <div className="flex-1 flex flex-col bg-gray-50">
            <div className="p-4 bg-white border-b">
              <div className="flex items-center">
                <div className="flex items-center gap-2 flex-1">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Flow Preview</h3>
                </div>
                <div className="flex justify-center flex-1">
                  <Select
                    value={selectedDevice.name}
                    onValueChange={(value) => {
                      const device = DEVICE_SPECS.find(d => d.name === value);
                      if (device) setSelectedDevice(device);
                    }}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border z-50">
                      {DEVICE_SPECS.map((device) => (
                        <SelectItem key={device.name} value={device.name}>
                          {device.displayName} ({device.width}×{device.height})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end flex-1">
                  <Button onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : templateToEdit ? 'Save my template' : 'Save Flow'}
                  </Button>
                </div>
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
              globalHeader={globalHeader}
              templateId={selectedTemplateId}
              brandColors={brandData?.brand_colors}
              deviceSpec={selectedDevice}
            />
          </div>

          {/* Right Panel - Section Properties or Logo Editor */}
          <div className="w-80 border-l bg-muted/30 p-4 overflow-y-auto">
            {isEditingLogo && selectedLogoFile ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Edit Logo</h4>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setIsEditingLogo(false);
                      setSelectedLogoFile(null);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
                <ImageEditor
                  file={selectedLogoFile}
                  onSave={async (editedFile) => {
                    try {
                      // Upload logo to database instead of using data URL
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) throw new Error('User not authenticated');

                      // Get user's brand
                      const { data: brand } = await supabase
                        .from('brands')
                        .select('*')
                        .eq('user_id', user.id)
                        .maybeSingle();

                      if (!brand) throw new Error('No brand found');

                      // Upload the edited logo
                      const fileExt = editedFile.name.split('.').pop() || 'png';
                      const fileName = `${brand.id}/logo.${fileExt}`;
                      
                      const { error: uploadError } = await supabase.storage
                        .from('brand-logos')
                        .upload(fileName, editedFile, { upsert: true });

                      if (uploadError) throw uploadError;

                      // Get public URL
                      const { data: { publicUrl } } = supabase.storage
                        .from('brand-logos')
                        .getPublicUrl(fileName);

                      // Update brand with new logo URL
                      const { error: updateError } = await supabase
                        .from('brands')
                        .update({ logo_url: publicUrl })
                        .eq('id', brand.id);

                      if (updateError) throw updateError;

                      // Update global header with the new URL from database
                      setGlobalHeader(prev => ({ ...prev, logoUrl: publicUrl }));
                      
                      toast.success("Logo updated successfully!");
                    } catch (error) {
                      console.error('Failed to save logo:', error);
                      toast.error('Failed to save logo to database');
                      // Fallback to data URL if database save fails
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const dataUrl = e.target?.result as string;
                        setGlobalHeader(prev => ({ ...prev, logoUrl: dataUrl }));
                      };
                      reader.readAsDataURL(editedFile);
                    }
                    
                    setIsEditingLogo(false);
                    setSelectedLogoFile(null);
                  }}
                  onCancel={() => {
                    setIsEditingLogo(false);
                    setSelectedLogoFile(null);
                  }}
                />
              </div>
            ) : selectedSection ? (
              <ComponentEditor
                section={selectedSection}
                onUpdate={(config) => handleUpdateSection(selectedSection.id, config)}
                brandColors={brandData?.brand_colors}
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
    </TemplateStyleProvider>
  );
};