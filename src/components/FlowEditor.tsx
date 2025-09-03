import React, { useState, useCallback } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ImageEditor } from '@/components/ImageEditor';
import { BrandColorPicker } from '@/components/ui/brand-color-picker';
import { PageManager } from './flow-editor/PageManager';
import { ComponentPalette } from './flow-editor/ComponentPalette';
import { MobilePreview } from './flow-editor/MobilePreview';
import { ComponentEditor } from './flow-editor/ComponentEditor';
import { PageSection } from './flow-editor/PageSection';
import { FlowHeader } from './flow-editor/FlowHeader';
import { FlowStyleShell, useEditorTokens } from '@/components/FlowStyleShell';
import { SectionRenderer } from '@/components/shared/SectionRenderer';
import { PanaceaFooter } from '@/components/PanaceaFooter';
import { Smartphone, Save, ChevronDown, ChevronRight, ArrowLeft, TestTube2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { TestLinkModal } from './TestLinkModal';
import { DesignTemplateSelector } from './DesignTemplateSelector';
import { ScrollArea } from '@/components/ui/scroll-area';
interface FlowTemplate {
  id: string;
  name: string;
  template_category: string;
  flow_config: any;
  created_by: string | null;
}

interface PageData {
  id: string;
  type: 'landing' | 'store_selection' | 'account_creation' | 'authentication' | 'content_display' | 'thank_you';
  name: string;
  sections: SectionData[];
  settings: any;
  isMandatory?: boolean;
  order: number;
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
  const {
    user,
    profile
  } = useAuth();

  // Ensure new logo images show up immediately by cache-busting the URL
  const withCacheBust = (url?: string, version?: string | number) => {
    if (!url) return '';
    try {
      const u = new URL(url);
      u.searchParams.set('v', String(version ?? Date.now()));
      return u.toString();
    } catch {
      return `${url}${url.includes('?') ? '&' : '?'}v=${version ?? Date.now()}`;
    }
  };
  const deviceOptions = [
    { name: 'iphone13', displayName: 'iPhone 13', width: 390, height: 844 },
    { name: 'iphoneSE', displayName: 'iPhone SE', width: 375, height: 667 },
    { name: 'iphone15ProMax', displayName: 'iPhone 15 Pro Max', width: 430, height: 932 },
    { name: 'pixel7', displayName: 'Pixel 7', width: 412, height: 915 }
  ];
  
  const [selectedDevice, setSelectedDevice] = useState(deviceOptions[0]);
  const [flowName, setFlowName] = useState(() => {
    // Always initialize from templateToEdit if it's a campaign flow
    if (templateToEdit && 'name' in templateToEdit && templateToEdit.campaign_id) {
      console.log('🔍 FlowEditor: Initializing with campaign flow name:', templateToEdit.name);
      return templateToEdit.name;
    }
    console.log('🔍 FlowEditor: Initializing with default flow name');
    return templateToEdit && 'name' in templateToEdit ? templateToEdit.name : 'Untitled Flow';
  });

  // Initialize pages from template or create mandatory pages with landing page
  const initializePages = (): PageData[] => {
    // Define which page types are mandatory
    const mandatoryPageTypes = ['store_selection', 'account_creation', 'authentication', 'thank_you'];
    
    // DRAFT LOADING: Handle flow_config format for campaign flows (ALWAYS EDIT DRAFTS)
    if (templateToEdit?.flow_config?.pages) {
      console.log('🔍 FlowEditor: Initializing pages from DRAFT (flow_config):', {
        flowId: templateToEdit.id,
        campaignId: templateToEdit.campaign_id,
        pagesCount: templateToEdit.flow_config.pages.length,
        isTemplate: templateToEdit.is_template,
        note: 'Loading from flow_config (editable draft)'
      });
      return templateToEdit.flow_config.pages.map((page: any, index: number) => ({
        ...page,
        sections: page.sections || [],
        settings: page.settings || {},
        order: index,
        // Ensure mandatory pages always have isMandatory: true, regardless of saved state
        isMandatory: mandatoryPageTypes.includes(page.type) ? true : (page.isMandatory || false)
      }));
    }

    // For system templates, we'll process them in useEffect after component mounts

    // Create all pages including initial landing page and mandatory pages with default content
    const allPages: PageData[] = [{
      id: 'landing-page',
      type: 'landing',
      name: 'Landing Page',
      sections: [],
      settings: {},
      isMandatory: false,
      order: 0
    }, {
      id: 'store-selection',
      type: 'store_selection',
      name: 'Store Selection',
      sections: [{
        id: 'store-title',
        type: 'text',
        order: 0,
        config: {
          content: 'Lets quickly confirm your product\'s authenticity to protect you from counterfeit products.',
          fontSize: 24,
          textColor: '#000000',
          backgroundColor: 'transparent',
          padding: 4
        }
      }, {
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
      }, {
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
      }],
      settings: {},
      isMandatory: true,
      order: 1
    }, {
      id: 'login-signup',
      type: 'account_creation',
      name: 'Login/Signup',
      sections: [{
        id: 'login-step',
        type: 'login_step',
        order: 0,
        config: {
          title: 'Create Account or Sign In',
          subtitle: 'Register your product and access warranty services',
          brandName: brandData?.name || 'this brand',
          showEmail: true,
          showApple: true,
          padding: 4
        }
      }],
      settings: {},
      isMandatory: true,
      order: 2
    }, {
      id: 'verification',
      type: 'authentication',
      name: 'Verification',
      sections: [{
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
      }, {
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
      }],
      settings: {},
      isMandatory: true,
      order: 3
    }, {
      id: 'thank-you',
      type: 'thank_you',
      name: 'Thank You',
      sections: [{
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
      }, {
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
      }],
      settings: {},
      isMandatory: true,
      order: 4
    }];

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
      const {
        data: freshBrandData
      } = await supabase.from('brands').select('*').eq('user_id', user.id).maybeSingle();

      // Update global header with fresh brand data (always use brand logo_url as source of truth)
      if (freshBrandData) {
        setGlobalHeader(prev => ({
          ...prev,
          brandName: freshBrandData.name || prev.brandName,
          logoUrl: withCacheBust(freshBrandData.logo_url || '', freshBrandData.updated_at || Date.now()),
          backgroundColor: (freshBrandData.brand_colors as any)?.secondary || prev.backgroundColor
        }));

        // Also update any logo images in sections to use the database URL
        setPages(prevPages => prevPages.map(page => ({
          ...page,
          sections: page.sections.map(section => {
            if (section.type === 'image' && section.config?.isLogo && freshBrandData.logo_url) {
              return {
                ...section,
                config: {
                  ...section.config,
                  imageUrl: withCacheBust(freshBrandData.logo_url, freshBrandData.updated_at || Date.now())
                }
              };
            }
            return section;
          })
        })));
      }

      // Process template if needed
      if (templateToEdit && !templateToEdit.flow_config?.pages) {
        try {
          const {
            processTemplateData,
            templateToFlowConfig
          } = await import('@/utils/templateProcessor');
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
            const mandatoryPageTypes = ['store_selection', 'account_creation', 'authentication', 'thank_you'];
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

          // Update global header state with processed template data (but always use brand logo)
          if (flowConfig.globalHeader) {
            console.log('Setting global header with brand logo URL:', activeBrandData?.logo_url);
            setGlobalHeader({
              showHeader: flowConfig.globalHeader.showHeader,
              brandName: flowConfig.globalHeader.brandName,
              logoUrl: withCacheBust(activeBrandData?.logo_url || '', (activeBrandData as any)?.updated_at || Date.now()),
              backgroundColor: flowConfig.globalHeader.backgroundColor,
              logoSize: flowConfig.globalHeader.logoSize || '60'
            });
          }

          // Apply template-specific defaults (e.g., Classic Certification tweaks)
          const adjustedPages = (() => {
            if (processedTemplate.id === 'classic-certification') {
              console.log('Applying Classic Certification defaults, brand colors:', activeBrandData?.brand_colors);
              return convertedPages.map((page: any) => {
                if (page.type === 'welcome' || page.name === 'Welcome') {
                  console.log('Processing welcome page sections:', page.sections);
                  return {
                    ...page,
                    sections: page.sections.map((section: any) => {
                      if (section.type === 'image') {
                        console.log('Found image section, current config:', section.config);
                        const updatedSection = {
                          ...section,
                          config: {
                            ...section.config,
                            backgroundColor: activeBrandData?.brand_colors?.secondary || '#f8bc55'
                          }
                        };
                        console.log('Updated image section config:', updatedSection.config);
                        return updatedSection;
                      }
                      return section;
                    })
                  };
                }
                // Fix login_step sections for Classic Certification
                if (page.type === 'authentication' || page.name === 'User Login') {
                  console.log('Processing authentication page sections:', page.sections);
                  return {
                    ...page,
                    sections: page.sections.map((section: any) => {
                      if (section.type === 'login_step') {
                        console.log('Found login_step section, current config:', section.config);
                        const updatedSection = {
                          ...section,
                          config: {
                            ...section.config,
                            showEmail: true,
                            showApple: true,
                            title: section.config.title || 'Create Account or Sign In',
                            subtitle: section.config.subtitle || 'Register your product and access warranty services',
                            brandName: section.config.brandName || activeBrandData?.name || 'this brand'
                          }
                        };
                        console.log('Updated login_step section config:', updatedSection.config);
                        return updatedSection;
                      }
                      return section;
                    })
                  };
                }
                return page;
              });
            }
            return convertedPages;
          })();
          // Update footer default for Classic Certification if not explicitly set
          if (processedTemplate.id === 'classic-certification') {
            setFooterConfig(prev => ({
              ...prev,
              backgroundColor: (prev.backgroundColor && prev.backgroundColor !== 'transparent')
                ? prev.backgroundColor
                : (activeBrandData?.brand_colors?.secondary || 'var(--template-secondary)')
            }));
          }

          // Update pages state after processing
          setPages(adjustedPages);
          if (adjustedPages.length > 0 && !currentPageId) {
            setCurrentPageId(adjustedPages[0].id);
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
    logoUrl: withCacheBust(brandData?.logo_url || '', (brandData as any)?.updated_at || Date.now()),
    backgroundColor: templateToEdit?.flow_config?.globalHeader?.backgroundColor || brandData?.brand_colors?.secondary || '#6B7280',
    logoSize: templateToEdit?.flow_config?.globalHeader?.logoSize || '60'
  });
  const [footerConfig, setFooterConfig] = useState({
    backgroundColor: templateToEdit?.flow_config?.footerConfig?.backgroundColor || 'transparent',
    logoSize: templateToEdit?.flow_config?.footerConfig?.logoSize || 60
  });
  const [selectedSection, setSelectedSection] = useState<SectionData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(templateToEdit?.flow_config?.design_template_id || null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testUrl, setTestUrl] = useState('');
  const [testExpiresIn, setTestExpiresIn] = useState(0);
  const [creatingTestLink, setCreatingTestLink] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    flowName: false,
    pages: false,
    globalHeader: false,
    pageSettings: false,
    footer: false,
    designTemplate: false,
    components: false,
    sections: false
  });
  const [isDragging, setIsDragging] = useState(false);
  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
    if (active.id !== over?.id) {
      const currentPage = getCurrentPage();
      if (!currentPage) return;
      const sections = currentPage.sections;
      const oldIndex = sections.findIndex(item => item.id === active.id);
      const newIndex = sections.findIndex(item => item.id === over?.id);
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
    setPages(prev => prev.map(page => page.id === currentPageId ? {
      ...page,
      sections: newSections
    } : page));
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
    const updatedPages = pages.map(page => page.order >= insertOrder ? {
      ...page,
      order: page.order + 1
    } : page);
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
          return {
            ...section,
            children: updatedChildren
          };
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
    const updatedSections = currentPage.sections.map(s => s.id === sectionId ? {
      ...s,
      config: {
        ...s.config,
        ...newConfig
      }
    } : s);
    updateCurrentPageSections(updatedSections);
    if (selectedSection?.id === sectionId) {
      setSelectedSection(prev => prev ? {
        ...prev,
        config: {
          ...prev.config,
          ...newConfig
        }
      } : null);
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
      console.log('🔍 FlowEditor: Starting to save flow...');

      // Create flow configuration with multi-page structure
      const flowConfig = {
        pages: pages.map(page => ({
          ...page,
          sections: page.sections.sort((a, b) => a.order - b.order)
        })),
        globalHeader,
        footerConfig,
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

      // Check if this is a campaign flow (has campaign_id)
      const isCampaignFlow = templateToEdit?.campaign_id;
      
      if (templateToEdit?.id && isCampaignFlow) {
        // CAMPAIGN FLOW: Save draft AND auto-publish for immediate live deployment
        console.log('🔍 FlowEditor: Saving campaign flow with dual save (draft + publish):', {
          flowId: templateToEdit.id,
          campaignId: templateToEdit.campaign_id,
          pagesCount: pages.length,
          action: 'Updating flow_config (draft) AND published_snapshot (live)'
        });

        // Create the published snapshot for immediate live deployment
        const publishedSnapshot = {
          ...flowConfig,
          name: flowName,
          publishedAt: new Date().toISOString(),
          version: (templateToEdit.latest_published_version || 0) + 1
        };

        // DUAL UPDATE: Update both draft (flow_config) and live (published_snapshot)
        const { error: updateError } = await supabase
          .from('flows')
          .update({
            name: flowName,
            flow_config: flowConfig as any,           // DRAFT VERSION (for editing)
            published_snapshot: publishedSnapshot as any, // LIVE VERSION (for customers)
            latest_published_version: (templateToEdit.latest_published_version || 0) + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', templateToEdit.id);

        if (updateError) {
          console.error('🔍 FlowEditor: Error updating campaign flow:', updateError);
          throw updateError;
        }

        // Rebuild flow_content backup records
        console.log('🔍 FlowEditor: Rebuilding flow_content backup records');
        
        // Delete existing flow_content records
        await supabase
          .from('flow_content')
          .delete()
          .eq('flow_id', templateToEdit.id);

        // Create new flow_content records for each page
        if (pages.length > 0) {
          const contentRecords = pages.map((page, index) => ({
            flow_id: templateToEdit.id,
            title: page.name || `Page ${index + 1}`,
            content_type: 'page',
            content: page as any,
            order_index: page.order || index
          }));

          const { error: contentError } = await supabase
            .from('flow_content')
            .insert(contentRecords);
          
          if (contentError) {
            console.error('🔍 FlowEditor: Error creating flow_content backup:', contentError);
            // Don't throw - main flow is saved
          } else {
            console.log('🔍 FlowEditor: Created', contentRecords.length, 'flow_content backup records');
          }
        }

        console.log('🔍 FlowEditor: Campaign flow saved with dual update - draft AND live versions updated');
        toast.success(`✅ Campaign flow saved & published! ${pages.length} pages are now live for customers.`);
        onClose();
        
      } else if (templateToEdit?.id) {
        // TEMPLATE: Save ONLY to draft (flow_config) - NO auto-publish
        console.log('🔍 FlowEditor: Saving template to DRAFT ONLY:', {
          templateId: templateToEdit.id,
          action: 'Updating flow_config (draft) only - NO publishing'
        });
        
        const { error: updateError } = await supabase
          .from('flows')
          .update({
            name: flowName,
            flow_config: flowConfig as any,  // DRAFT ONLY - templates don't auto-publish
            updated_at: new Date().toISOString()
          })
          .eq('id', templateToEdit.id);

        if (updateError) {
          console.error('🔍 FlowEditor: Error updating template:', updateError);
          throw updateError;
        }

        toast.success('Template saved to draft successfully! Use "Publish" to make changes live.');
        onClose();
        
      } else {
        // NEW TEMPLATE: Create as draft only
        const { data: { user } } = await supabase.auth.getUser();
        
        const newTemplate = {
          name: flowName,
          flow_config: flowConfig as any,  // NEW TEMPLATES START AS DRAFTS
          is_template: true,
          created_by: user?.id || null,
          template_category: 'custom',
          campaign_id: null
        };

        const { data: savedTemplate, error: insertError } = await supabase
          .from('flows')
          .insert([newTemplate])
          .select()
          .single();

        if (insertError) {
          console.error('🔍 FlowEditor: Error creating template:', insertError);
          throw insertError;
        }

        console.log('🔍 FlowEditor: New user template created successfully');
        toast.success(`Template saved! ✅ ${pages.length} pages created.`);
        
        // Return the template data to the parent
        onSave(savedTemplate);
      }
    } catch (error) {
      console.error('🔍 FlowEditor: Error saving flow:', error);
      toast.error('Failed to save flow');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!templateToEdit?.id) {
      toast.error('No flow to publish');
      return;
    }

    // Only allow publishing for real campaign flows with a valid UUID id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const isUuid = uuidRegex.test(String(templateToEdit.id));
    const isCampaignFlow = ('campaign_id' in templateToEdit) && !!(templateToEdit as any).campaign_id;
    if (!isUuid || !isCampaignFlow) {
      toast.error('Cannot publish templates. Open a campaign flow or save this as a campaign flow first.');
      return;
    }

    if (!flowName.trim()) {
      toast.error('Please enter a flow name before publishing');
      return;
    }

    if (pages.length === 0) {
      toast.error('Please add at least one page before publishing');
      return;
    }

    setIsPublishing(true);
    
    try {
      const flowSnapshot = {
        pages: pages.map(page => ({
          ...page,
          sections: page.sections.sort((a, b) => a.order - b.order)
        })),
        globalHeader,
        footerConfig,
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
        },
        name: flowName,
        publishedAt: new Date().toISOString()
      };

      const designTokens = {
        ...brandData?.brand_colors,
        globalHeader: globalHeader,
        footerConfig: footerConfig
      };

      const { data, error } = await supabase.rpc('publish_flow_version', {
        p_flow_id: templateToEdit.id,
        p_flow_snapshot: flowSnapshot as any,
        p_design_tokens: designTokens as any
      });

      if (error) {
        throw error;
      }

      const result = data as any;
      toast.success(`Flow published as version ${result.new_version}!`);
      
    } catch (error) {
      console.error('Error publishing flow:', error);
      toast.error('Failed to publish flow. Please try again.');
    } finally {
      setIsPublishing(false);
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
        height: '',
        backgroundColor: brandData?.brand_colors?.secondary || 'transparent',
        padding: 4
      },
      cta: {
        text: 'Click here',
        buttonColor: brandData?.brand_colors?.primary || '#3b82f6',
        textColor: '#ffffff',
        backgroundColor: 'transparent',
        size: 'default',
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
      },
      login_step: {
        title: 'Create Account or Sign In',
        subtitle: 'Access full testing results and member-only offers.',
        brandName: brandData?.name || 'this brand',
        showEmail: true,
        showApple: true,
        padding: 4
      },
    };
    return configs[sectionType as keyof typeof configs] || {
      padding: 4
    };
  };
  const currentPage = getCurrentPage();
  const activeSection = currentPage?.sections.find(s => s.id === activeId);
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setShowTemplateSelector(false);
    toast.success('Design template applied successfully');
  };

  const handleTestAsUser = async () => {
    if (!templateToEdit) {
      toast.error('No template to test');
      return;
    }

    try {
      setCreatingTestLink(true);

      // Get the user's session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to create test links');
        return;
      }

      // Determine payload based on what we're editing
      const payload: { template_id?: string; campaign_id?: string } = {};
      
      // For system templates or templates from the templates table, use template_id
      if (templateToEdit.is_system_template || templateToEdit.kind === 'system' || templateToEdit.kind === 'brand' || !templateToEdit.campaign_id) {
        payload.template_id = templateToEdit.id;
      } else if (templateToEdit.campaign_id) {
        // This is a flow with a campaign, use campaign_id
        payload.campaign_id = templateToEdit.campaign_id;
      } else {
        toast.error('Unable to determine test configuration for this template');
        return;
      }

      console.log('Creating test link with payload:', payload);

      const response = await supabase.functions.invoke('create-test-flow-link', {
        body: {
          ...payload,
          app_origin: window.location.origin
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      console.log('Test link response:', response);

      if (response.error) {
        console.error('Edge function error:', response.error);
        
        // Try to extract more meaningful error message
        let errorMessage = 'Failed to create test link';
        if (typeof response.error === 'object' && response.error.message) {
          errorMessage += `: ${response.error.message}`;
        } else if (typeof response.error === 'string') {
          errorMessage += `: ${response.error}`;
        }
        
        throw new Error(errorMessage);
      }

      if (!response.data?.success || !response.data?.url) {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response from test link service');
      }

      // Check if the response data contains an error (from edge function)
      if (response.data?.error) {
        console.error('Server error:', response.data);
        throw new Error(`Server error: ${response.data.error}`);
      }

      if (!response.data?.success || !response.data?.url) {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response from server - no test URL returned');
      }

      const { url, expires_in } = response.data;
      setTestUrl(url);
      setTestExpiresIn(expires_in);
      setShowTestModal(true);

      toast.success('Test link created successfully');

    } catch (error) {
      console.error('Error creating test link:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create test link');
    } finally {
      setCreatingTestLink(false);
    }
  };
  return <FlowStyleShell
    templateId={selectedTemplateId || 'classic'}
    flow={{ flow_config: { pages, designConfig: { backgroundColor: pageSettings?.backgroundColor } } }}
  >
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[98vw] max-h-[98vh] overflow-hidden p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Flow Builder</DialogTitle>
          </DialogHeader>
        <div className="flex h-[98vh] min-w-0"
          style={{ '--device-width-px': '390px' } as React.CSSProperties}
        >
          {/* Left Panel - Pages & Components */}
          <div className="w-80 shrink-0 border-r bg-muted/30 p-4 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h3 className="font-semibold">Flow Builder</h3>
              </div>
              
              {/* Flow Name Section */}
              <Collapsible open={!collapsedSections.flowName} onOpenChange={() => toggleSection('flowName')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-sm font-medium p-2 h-auto hover:bg-accent">
                    <span>Flow Name</span>
                    {collapsedSections.flowName ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <Input id="flowName" value={flowName} onChange={e => setFlowName(e.target.value)} placeholder="Enter flow name..." />
                </CollapsibleContent>
              </Collapsible>

              <Separator />
              
              {/* Page Manager Section */}
              <Collapsible open={!collapsedSections.pages} onOpenChange={() => toggleSection('pages')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-sm font-medium p-2 h-auto hover:bg-accent">
                    <span>Flow Pages</span>
                    {collapsedSections.pages ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <PageManager pages={pages} currentPageId={currentPageId} onSelectPage={setCurrentPageId} onAddPage={handleAddPage} onDeletePage={handleDeletePage} onReorderPages={() => {}} // TODO: Implement reordering
                  />
                </CollapsibleContent>
              </Collapsible>

              <Separator />
              
              {/* Global Header Settings */}
              <Collapsible open={!collapsedSections.globalHeader} onOpenChange={() => toggleSection('globalHeader')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-sm font-medium p-2 h-auto hover:bg-accent">
                    <span>Header</span>
                    {collapsedSections.globalHeader ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="showHeader" checked={globalHeader.showHeader} onChange={e => setGlobalHeader(prev => ({
                      ...prev,
                      showHeader: e.target.checked
                    }))} className="rounded" />
                    <Label htmlFor="showHeader" className="text-sm">Show Header</Label>
                  </div>
                  
                  {globalHeader.showHeader && <>
                      <div>
                        <Label htmlFor="brandName">Brand Name</Label>
                        <Input id="brandName" value={globalHeader.brandName} onChange={e => setGlobalHeader(prev => ({
                        ...prev,
                        brandName: e.target.value
                      }))} placeholder="Brand" />
                      </div>
                      
                      <div>
                        <Label>Brand Logo</Label>
                        <div className="space-y-2">
                          {globalHeader.logoUrl ? (
                            <div className="border rounded-lg">
                              <FlowHeader globalHeader={globalHeader} />
                            </div>
                          ) : (
                            <div className="flex justify-center items-center w-full h-16 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                              <p className="text-xs text-muted-foreground">No logo uploaded</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground text-center">
                            Logo is managed in Brand Settings
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="logoSize">Logo Size (px)</Label>
                        <Input 
                          id="logoSize" 
                          type="number" 
                          min="12" 
                          value={globalHeader.logoSize} 
                           onChange={e => {
                             console.log('Logo size changed to:', e.target.value);
                             setGlobalHeader(prev => ({
                               ...prev,
                               logoSize: e.target.value
                             }))
                           }}
                          placeholder="60" 
                        />
                      </div>
                      
                      <BrandColorPicker label="Header Background" value={globalHeader.backgroundColor} onChange={color => setGlobalHeader(prev => ({
                      ...prev,
                      backgroundColor: color
                    }))} brandColors={brandData?.brand_colors} id="headerBg" />
                    </>}
                </CollapsibleContent>
              </Collapsible>
              
              <Separator />
              
              {/* Page Settings */}
              <Collapsible open={!collapsedSections.pageSettings} onOpenChange={() => toggleSection('pageSettings')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-sm font-medium p-2 h-auto hover:bg-accent">
                    <span>Page Settings</span>
                    {collapsedSections.pageSettings ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <BrandColorPicker label="Background Color" value={pageSettings.backgroundColor} onChange={color => setPageSettings(prev => ({
                    ...prev,
                    backgroundColor: color
                  }))} brandColors={brandData?.brand_colors} showOpacity={true} id="backgroundColor" />
                </CollapsibleContent>
              </Collapsible>

              <Separator />
              
              {/* Footer Settings */}
              <Collapsible open={!collapsedSections.footer} onOpenChange={() => toggleSection('footer')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-sm font-medium p-2 h-auto hover:bg-accent">
                    <span>Footer</span>
                    {collapsedSections.footer ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <BrandColorPicker 
                    label="Background Color" 
                    value={footerConfig.backgroundColor === 'transparent' ? '' : footerConfig.backgroundColor} 
                    onChange={color => setFooterConfig(prev => ({
                      ...prev,
                      backgroundColor: color || 'transparent'
                    }))} 
                    brandColors={brandData?.brand_colors} 
                    showOpacity={true} 
                    id="footerBackground" 
                  />
                  
                  <div>
                    <Label htmlFor="footerLogoSize">Logo Size (px)</Label>
                    <Input
                      id="footerLogoSize"
                      type="number"
                      value={footerConfig.logoSize}
                      onChange={(e) => {
                        const size = Math.max(40, parseInt(e.target.value) || 60);
                        setFooterConfig(prev => ({
                          ...prev,
                          logoSize: size
                        }));
                      }}
                      min={40}
                      placeholder="60"
                    />
                    <p className="text-xs text-muted-foreground">Minimum: 40px</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />
              
              {/* Drag Sections */}
              <Collapsible open={!collapsedSections.components} onOpenChange={() => toggleSection('components')}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between text-sm font-medium p-2 h-auto hover:bg-accent">
                    <span>Drag Sections</span>
                    {collapsedSections.components ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <ComponentPalette onAddComponent={handleAddSection} />
                </CollapsibleContent>
              </Collapsible>
              
              <Separator />
              
              {/* Current Page Sections */}
              {currentPage && <Collapsible open={!collapsedSections.sections} onOpenChange={() => toggleSection('sections')}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between text-sm font-medium p-2 h-auto hover:bg-accent">
                      <span>{currentPage.name} Sections</span>
                      {collapsedSections.sections ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-2">
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                      <SortableContext items={currentPage.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-1">
                          {currentPage.sections.sort((a, b) => a.order - b.order).map(section => <PageSection key={section.id} section={section} isSelected={selectedSection?.id === section.id} onSelect={() => setSelectedSection(section)} onDelete={() => handleDeleteSection(section.id)} onAddSection={handleAddSection} />)}
                        </div>
                      </SortableContext>

                      <DragOverlay>
                        {activeSection ? <PageSection section={activeSection} isSelected={false} onSelect={() => {}} onDelete={() => {}} /> : null}
                      </DragOverlay>
                    </DndContext>
                  </CollapsibleContent>
                </Collapsible>}
            </div>
          </div>

          {/* Middle Panel - Preview */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden max-w-[calc(100vw-640px)]">
            <div className="p-4 bg-white border-b">
              <div className="flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Flow Preview</h3>
                </div>
                  
                  <div className="flex items-center gap-2">
                    <Select 
                      value={selectedDevice.name} 
                      onValueChange={(value) => {
                        const device = deviceOptions.find(d => d.name === value);
                        if (device) setSelectedDevice(device);
                      }}
                    >
                      <SelectTrigger className="w-36 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {deviceOptions.map((device) => (
                          <SelectItem key={device.name} value={device.name}>
                            {device.displayName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {selectedDevice.width} × {selectedDevice.height}px
                  </div>

                   <Button onClick={handleSave} disabled={isSaving} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : templateToEdit?.campaign_id ? 'Save & Publish Live' : (templateToEdit ? 'Save Draft' : 'Save Flow')}
                  </Button>

                  {/* Publish button only for templates - campaign flows auto-publish on save */}
                  {!templateToEdit?.campaign_id && (
                    <Button 
                      onClick={handlePublish}
                      disabled={isPublishing || isSaving}
                      className="bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-50"
                      size="sm"
                    >
                      {isPublishing ? 'Publishing...' : 'Publish Version'}
                    </Button>
                  )}

                  {/* Campaign flow auto-publish indicator */}
                  {templateToEdit?.campaign_id && (
                    <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                      ⚡ Auto-publishes on save
                    </div>
                  )}

                  {/* Test as User button - only for master_admin */}
                  {profile?.role === 'master_admin' && templateToEdit && (
                    <Button
                      onClick={handleTestAsUser}
                      disabled={creatingTestLink}
                      variant="secondary"
                      size="sm"
                    >
                      <TestTube2 className="h-4 w-4 mr-2" />
                      {creatingTestLink ? 'Creating...' : 'Test as User'}
                    </Button>
                  )}
                </div>
              </div>
            
              <ScrollArea className="flex-1">
                <div className="p-8 flex justify-center">
                  {/* Always show runtime preview for direct editing */}
                  <div 
                    className="bg-white rounded-lg shadow-lg overflow-hidden" 
                    style={{ 
                      width: `${selectedDevice.width}px`, 
                      minHeight: `${selectedDevice.height}px`,
                      '--device-width-px': `${selectedDevice.width}px` 
                    } as React.CSSProperties}
                  >
                    {/* Runtime preview content using SectionRenderer */}
                      <div 
                        className="h-full flex flex-col relative"
                        style={{ backgroundColor: pageSettings.backgroundColor }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "copy";
                          if (!isDragging) {
                            setIsDragging(true);
                          }
                        }}
                        onDragLeave={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const isLeavingDropZone = (
                            e.clientX < rect.left ||
                            e.clientX > rect.right ||
                            e.clientY < rect.top ||
                            e.clientY > rect.bottom
                          );
                          if (isLeavingDropZone) {
                            setIsDragging(false);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const sectionType = e.dataTransfer.getData('text/plain');
                          if (sectionType) {
                            handleAddSection(sectionType);
                          }
                          setIsDragging(false);
                        }}
                      >
                        {/* Drop zone overlay */}
                        {isDragging && (
                          <div className="absolute inset-0 pointer-events-none transition-all duration-200 bg-blue-50/50 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center z-10">
                            <div className="bg-white px-4 py-2 rounded-lg shadow-sm text-sm text-blue-600 font-medium">
                              Drop section here
                            </div>
                          </div>
                        )}
                        {/* Use FlowHeader for consistency with editor and runtime */}
                        <FlowHeader 
                          globalHeader={{
                            showHeader: globalHeader.showHeader,
                            brandName: '',
                            logoUrl: globalHeader.logoUrl || '',
                            backgroundColor: globalHeader.backgroundColor,
                            logoSize: globalHeader.logoSize || '60'
                          }}
                        />
                        
                        <div className="flex-1 flex flex-col min-h-0">
                          <div>
                            {currentPage?.sections.sort((a, b) => a.order - b.order).map((section) => (
                              <div 
                                key={section.id}
                                className={`${section.id === selectedSection?.id ? 'ring-2 ring-primary ring-offset-2' : ''} cursor-pointer hover:ring-1 hover:ring-primary/50 transition-all`}
                                onClick={() => setSelectedSection(section)}
                              >
                              <SectionRenderer
                                section={section}
                                isPreview={true}
                                isRuntimeMode={true}
                                storeOptions={[]}
                                brandColors={brandData?.brand_colors}
                                onNavigateToPage={(pageId) => {
                                  setCurrentPageId(pageId);
                                }}
                              />
                              </div>
                            ))}
                          </div>
                          {/* Default footer if none present, matching editor preview */}
                          {currentPage && currentPage.sections.every(s => s.type !== 'footer') && (
                            <div className="mt-auto shrink-0">
                              <PanaceaFooter 
                                backgroundColor={footerConfig.backgroundColor === 'transparent' ? undefined : footerConfig.backgroundColor}
                                logoSize={footerConfig.logoSize}
                              />
                            </div>
                          )}
                        </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>

          {/* Right Panel - Section Properties */}
          <div className="w-80 shrink-0 border-l bg-muted/30 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              {selectedSection ? (
                <ComponentEditor 
                  section={selectedSection} 
                  onUpdate={config => handleUpdateSection(selectedSection.id, config)} 
                  brandColors={brandData?.brand_colors}
                  pages={pages?.length ? pages.map(page => ({ id: page.id, name: page.name })) : []}
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
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
      
      {/* Test Link Modal */}
      <TestLinkModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        testUrl={testUrl}
        expiresIn={testExpiresIn}
        isEphemeralCampaign={!!(templateToEdit && (!templateToEdit.campaign_id || templateToEdit.kind === 'system' || templateToEdit.kind === 'brand'))}
      />
    </Dialog>
    </FlowStyleShell>;
};