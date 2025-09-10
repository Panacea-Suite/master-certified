import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, Shield, FileText, Package, Truck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionRenderer } from '@/components/shared/SectionRenderer';
import { FlowHeader } from '@/components/flow-editor/FlowHeader';
import { TemplateStyleProvider } from '@/components/TemplateStyleProvider';
import { PanaceaFooter } from '@/components/PanaceaFooter';
import { useSearchParams } from 'react-router-dom';
import { resolveStyleTokens, tokensToProviderFormat } from '@/utils/resolveStyleTokens';

// Cache-busting utility
const withCacheBust = (url: string, seed?: string | number): string => {
  if (!url) return url;
  const timestamp = seed || Date.now();
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}cb=${timestamp}`;
};

// SectionHost component - hooks called unconditionally at top
function SectionHost({ 
  section, 
  page, 
  styleTokens, 
  campaign, 
  userInputs, 
  setUserInputs,
  pageBackgroundColor,
  onNavigateToPage,
  onAuthComplete,
  isAuthentic,
  authConfig
}: { 
  section: any; 
  page: any; 
  styleTokens: any; 
  campaign: any; 
  userInputs: any; 
  setUserInputs: any;
  pageBackgroundColor?: string;
  onNavigateToPage?: (pageId: string) => void;
  onAuthComplete?: (result: 'pass' | 'fail') => void;
  isAuthentic?: boolean | null;
  authConfig?: any;
}) {
  // ALL HOOKS MUST BE CALLED FIRST UNCONDITIONALLY - no conditional returns before hooks!
  const [warningLogged, setWarningLogged] = React.useState(false);
  
  // Log warning for missing sections only once
  React.useEffect(() => {
    if (!warningLogged && (!section || !section.type)) {
      console.warn(`🚨 CustomerFlowExperience: Invalid section encountered`, { 
        section, 
        hasSection: !!section, 
        hasType: !!section?.type 
      });
      setWarningLogged(true);
    }
  }, [section, warningLogged]);
  
  // After hooks, handle rendering conditionally with switch statement - never return null
  if (!section) {
    return <UnknownSection type="missing-section" message="Section data is missing" />;
  }
  
  // Switch statement that only returns JSX - no hooks inside, always returns something
  switch (section.type) {
    case 'image':
    case 'hero':
    case 'text':
    case 'features':
    case 'cta':
    case 'product-showcase':
    case 'product_listing':
    case 'divider':
    case 'column':
    case 'footer':
    case 'header':
    case 'login_step':
    case 'store_selector':
    case 'authentication':
    case 'documentation':
      return (
        <SectionRenderer
          key={section.id}
          section={section}
          isPreview={false}
          isRuntimeMode={true}
          storeOptions={campaign?.approved_stores || []}
          brandColors={null}
          // Controlled store selector props for runtime binding
          purchaseChannel={userInputs.purchaseChannel}
          selectedStore={userInputs.selectedStore}
          onPurchaseChannelChange={(channel) => setUserInputs(prev => ({ ...prev, purchaseChannel: channel, selectedStore: '' }))}
          onSelectedStoreChange={(store) => setUserInputs(prev => ({ ...prev, selectedStore: store }))}
          pageBackgroundColor={pageBackgroundColor}
          onNavigateToPage={onNavigateToPage}
          approvedStores={campaign?.approved_stores || []}
          onAuthComplete={onAuthComplete}
          isAuthentic={isAuthentic}
          authConfig={authConfig}
          // Debug logging for approved stores
          {...(() => {
            console.log('🔍 SectionHost: Passing approved stores to section:', {
              sectionType: section.type,
              approvedStores: campaign?.approved_stores,
              campaignName: campaign?.name
            });
            return {};
          })()}
        />
      );
    
    default:
      // Always render placeholder for unknown types - never return null
      return <UnknownSection type={section.type || 'undefined'} message="Section type is not recognized" />;
  }
}

// UnknownSection placeholder component
function UnknownSection({ type, message }: { type: string; message?: string }) {
  React.useEffect(() => {
    console.warn(`🚨 CustomerFlowExperience: Unknown section encountered`, { type, message });
  }, [type, message]);
  
  return (
    <div className="p-4 border border-dashed border-orange-300 bg-orange-50/50 rounded-lg">
      <div className="flex items-center gap-2 text-orange-700">
        <span className="text-sm font-medium">⚠️ Unknown Section</span>
      </div>
      <div className="mt-2 text-xs text-orange-600">
        <div>Type: <code className="bg-orange-100 px-1 rounded">{type}</code></div>
        {message && (
          <div className="mt-1 text-orange-500">{message}</div>
        )}
      </div>
    </div>
  );
}

interface FlowContent {
  id: string;
  content_type: string;
  title: string;
  content: any;
  file_url?: string;
}

interface CustomerFlowExperienceProps {
  flowId?: string;
  qrCode?: string;
  templateData?: any; // For direct template preview
  brandData?: any; // For provided brand data from parent
  campaignData?: any; // For provided campaign data from parent
  externalPageIndex?: number; // For external page navigation control
  hideInternalNavigation?: boolean; // Hide internal navigation when controlled externally
  runtimeMode?: string; // Runtime mode: 'published' | 'draft' | 'draft-fallback'
  effective?: { pages: any[] }; // Pre-computed effective pages from runtime
}

const CustomerFlowExperience: React.FC<CustomerFlowExperienceProps> = ({ flowId, qrCode, templateData, brandData, campaignData, externalPageIndex, hideInternalNavigation, runtimeMode, effective }) => {
  // ALL HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP
  const [currentStage, setCurrentStage] = useState(0);
  const [flow, setFlow] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [content, setContent] = useState<FlowContent[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [designTemplate, setDesignTemplate] = useState<any>(null);
  const [styleTokens, setStyleTokens] = useState<any>(null);
  const [userInputs, setUserInputs] = useState<{
    purchaseChannel: 'in-store' | 'online' | '';
    selectedStore: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }>({
    purchaseChannel: '', // 'in-store' or 'online'
    selectedStore: '',
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [isAuthentic, setIsAuthentic] = useState<boolean | null>(null);
  const [hasAccount, setHasAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // Compute brand colors and template ID at the top level - always available
  const brandColors = useMemo(() => styleTokens ? tokensToProviderFormat(styleTokens) : undefined, [styleTokens]);
  const templateId = useMemo(() => designTemplate?.id || flow?.flow_config?.design_template_id || flow?.flow_config?.templateId || 'classic', [designTemplate?.id, flow?.flow_config?.design_template_id, flow?.flow_config?.templateId]);

  // Stabilized pages computation with useMemo
  const pages = useMemo(() => {
    // Use effective.pages if provided (pre-computed from runtime)
    if (effective?.pages) {
      const p = effective.pages;
      return Array.isArray(p) ? p.filter(Boolean) : [];
    }
    
    // Fallback to old computation for backward compatibility
    const published = flow?.published_snapshot?.pages ?? [];
    const draft = flow?.flow_config?.pages ?? [];
    const fallbackPages = published?.length ? published : draft || [];
    return Array.isArray(fallbackPages) ? fallbackPages.filter(Boolean) : [];
  }, [effective?.pages, flow?.published_snapshot?.pages, flow?.flow_config?.pages]);

  const stages = [
    { type: 'landing', title: 'Welcome to Certified', icon: Shield },
    { type: 'store_location', title: 'Store Location', icon: Package },
    { type: 'account_creation', title: 'Create Account', icon: FileText },
    { type: 'authentication', title: 'Verification', icon: CheckCircle },
    { type: 'content', title: 'Product Information', icon: Truck }
  ];

  // Set campaign data from parent if provided
  useEffect(() => {
    if (campaignData) {
      console.log('🔍 CustomerFlowExperience: Setting campaign from provided data:', campaignData);
      setCampaign(campaignData);
    }
  }, [campaignData]);

  useEffect(() => {
    fetchFlowData();
  }, [flowId, templateData, brandData, externalPageIndex, searchParams]);

  // Compute style tokens when campaign, flow, or design template changes
  useEffect(() => {
    const computeStyleTokens = async () => {
      try {
        // Get design template if templateId is available
        let template = null;
        const templateId = flow?.flow_config?.design_template_id || flow?.flow_config?.templateId;
        
        if (templateId) {
          const { data } = await supabase
            .from('design_templates')
            .select('*')
            .eq('id', templateId)
            .single();
          template = data;
          setDesignTemplate(template);
        }

        // Resolve tokens with defensive merging
        const resolvedTokens = resolveStyleTokens(campaign, flow?.flow_config, templateId);
        setStyleTokens(resolvedTokens);

        // Trace logging when ?trace=1
        const isTraceMode = new URLSearchParams(window.location.search).get('trace') === '1';
        if (isTraceMode) {
          console.log('[StyleTokens]', resolvedTokens);
        }
      } catch (error) {
        console.error('Error computing style tokens:', error);
        // Fallback to safe defaults
        const fallbackTokens = resolveStyleTokens(null, null, null);
        setStyleTokens(fallbackTokens);
      }
    };

    if (campaign || flow) {
      computeStyleTokens();
    }
  }, [campaign, flow]);

  const fetchFlowData = async () => {
    // Session-based test flow
    const sessionId = searchParams.get('session');
    if (sessionId) {
      try {
        setIsLoading(true);
        console.log('CustomerFlowExperience: Loading via session_id:', sessionId);
        const { data, error } = await supabase.functions.invoke('flow-handler', {
          body: { session_id: sessionId }
        });
        if (error) {
          console.error('Edge function error:', error);
          throw error;
        }
        const d: any = data;
        if (!d?.flow || !d?.campaign) {
          throw new Error('Invalid session response');
        }
        const flowConfig = d.flow.config as any;
        setFlow({ id: d.flow.id, name: d.flow.name, flow_config: flowConfig });
        setCampaign(d.campaign);
        
        // Use safe page processing
        const { pages: safePages, mode } = processSafePages(flowConfig, 'session');
        if (safePages.length > 0) {
          // Update the flow structure so pages are computed by memo
          setFlow(prevFlow => ({
            ...prevFlow,
            flow_config: {
              ...prevFlow?.flow_config,
              pages: safePages
            }
          }));
          setCurrentPageIndex(0);
        } else if (flowConfig?.sections) {
          const singlePage = {
            id: 'main-page',
            name: 'Main Content',
            type: 'content_display',
            sections: flowConfig.sections,
            settings: {}
          };
          // Update the flow structure with single page
          setFlow(prevFlow => ({
            ...prevFlow,
            flow_config: {
              ...prevFlow?.flow_config,
              pages: [singlePage]
            }
          }));
          setCurrentPageIndex(0);
        } else {
          // No pages to set, flow will compute empty array
          setContent(d.content || []);
        }
      } catch (e) {
        console.error('Failed to load session flow:', e);
        setError('Failed to load test session');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // If templateData is provided directly, use it instead of fetching
    if (templateData) {
      try {
        setIsLoading(true);
        console.log('CustomerFlowExperience: Using provided template data:', templateData);
        console.log('CustomerFlowExperience: Provided brand data:', brandData);

        // Heuristic: if templateData already looks like a flow payload (has pages/theme/globalHeader), use it directly
        const isFlowPayload = typeof templateData === 'object' && !!templateData && (
          Array.isArray((templateData as any).pages) ||
          !!(templateData as any).theme ||
          !!(templateData as any).globalHeader ||
          !!(templateData as any).footerConfig
        );

        if (isFlowPayload) {
          const cfg = templateData as any;
          setFlow({
            id: cfg.id || 'inline-flow',
            name: cfg.name || 'Inline Flow',
            flow_config: cfg
          });
          // If pages exist, start at provided external index or 0
          if (Array.isArray(cfg.pages)) {
            setCurrentPageIndex(externalPageIndex ?? 0);
          }
        } else {
          // Use provided brand data or fetch if not provided
          let finalBrandData = brandData;
          if (!finalBrandData) {
            try {
              console.log('CustomerFlowExperience: No brand data provided, fetching from database...');
              const { data: brand } = await supabase
                .from('brands')
                .select('*')
                .maybeSingle();
              finalBrandData = brand;
              console.log('CustomerFlowExperience: Fetched brand data from DB:', finalBrandData);
            } catch (error) {
              console.log('No brand data available for template processing');
            }
          } else {
            console.log('CustomerFlowExperience: Using provided brand data for preview:', finalBrandData);
          }

          // Process template data using the unified processor
          const { processTemplateData, templateToFlowConfig } = await import('@/utils/templateProcessor');
          const processedTemplate = processTemplateData(templateData);
          console.log('CustomerFlowExperience: Processed template:', processedTemplate);

          // Set flow data from processed template with proper flow_config and brand data
          const flowConfig = templateToFlowConfig(processedTemplate, finalBrandData);
          console.log('CustomerFlowExperience: Final flow config:', flowConfig);

          setFlow({
            id: processedTemplate.id,
            name: processedTemplate.name,
            flow_config: {
              ...flowConfig,
              pages: processedTemplate.pages
            }
          });
          // Use external page index if provided, otherwise start at 0
          setCurrentPageIndex(externalPageIndex ?? 0);
        }
      } catch (error) {
        console.error('Error handling provided template data:', error);
        setError('Failed to process template data');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!flowId) return;

    try {
      setIsLoading(true);
      console.log('Fetching flow data for ID:', flowId);
      
      // Get customer access token from URL params
      const accessToken = new URLSearchParams(window.location.search).get('token');

      // Fetch flow data via edge function to handle token validation
      if (qrCode) {
        console.log('Fetching via QR code and flow ID through edge function');
        const flowUrl = `https://jgoejcgdmayjjjldpnur.supabase.co/functions/v1/flow-handler/${flowId}/${qrCode}`;
        const headers: any = {};
        if (accessToken) {
          headers['x-customer-token'] = accessToken;
        }
        
        const response = await fetch(flowUrl, { headers });
        if (!response.ok) {
          throw new Error(`Failed to fetch flow: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Flow data from edge function:', data);
        setFlow(data.flow);
        setCampaign(data.campaign);
        setContent(data.content || []);
        
        // Handle different flow configurations with safe processing
        const flowConfig = data.flow?.config;
        const { pages: safePages, mode } = processSafePages(flowConfig, 'qr');
        if (safePages.length > 0) {
          // Update flow with pages
          setFlow(prevFlow => ({
            ...prevFlow,
            flow_config: {
              ...prevFlow?.flow_config,
              pages: safePages
            }
          }));
          setCurrentPageIndex(0);
        } else if (flowConfig?.sections) {
          const singlePage = {
            id: 'main-page',
            name: 'Main Page',
            sections: flowConfig.sections
          };
          // Update flow with single page
          setFlow(prevFlow => ({
            ...prevFlow,
            flow_config: {
              ...prevFlow?.flow_config,
              pages: [singlePage]
            }
          }));
          setCurrentPageIndex(0);
        } else {
          // No pages to set
        }
        return;
      }

      // Fallback using runtime hardened loader
      console.log('Falling back to hardened runtime loader');
      
      const { loadFlowForCampaign } = await import('@/runtime/loadFlow');
      
      // Get campaign ID for this flow
      const { data: flowRow, error: flowError } = await supabase
        .from('flows')
        .select('id, campaign_id')
        .eq('id', flowId)
        .single();

      if (flowError || !flowRow?.campaign_id) {
        console.error('Error fetching flow or no campaign:', flowError);
        throw new Error('Flow not found or not associated with campaign');
      }

      // Use hardened loader that prefers published snapshot
      const result = await loadFlowForCampaign(flowRow.campaign_id);
      console.log(`Flow loaded in ${result.mode} mode:`, result.flow);

      // Fetch campaign to get approved_stores for runtime auth and store selector
      try {
        const { data: campaignRow } = await supabase
          .from('campaigns')
          .select('id, name, brand_id, approved_stores, final_redirect_url, locked_design_tokens')
          .eq('id', flowRow.campaign_id)
          .maybeSingle();
        if (campaignRow) {
          setCampaign(campaignRow);
          console.log('🔍 Loaded campaign for runtime:', campaignRow);
        } else {
          console.warn('⚠️ No campaign row found for id', flowRow.campaign_id);
        }
      } catch (e) {
        console.warn('⚠️ Failed to fetch campaign row:', e);
      }

      // Create flow data with proper structure
      const flowData = { 
        id: flowRow.id, 
        name: 'Customer Flow',
        flow_config: result.flow
      };

      // Set flow config and pages with safe processing
      const flowConfig = (flowData.flow_config && typeof flowData.flow_config === 'object' && !Array.isArray(flowData.flow_config)) ? flowData.flow_config as any : {};
      const { pages: safePages, mode } = processSafePages(flowConfig, result.mode);
      
      // Set flow data with pages embedded
      setFlow({
        ...flowData,
        flow_config: {
          ...flowConfig,
          pages: safePages
        }
      });
      setCurrentPageIndex(0);

    } catch (error) {
      console.error('Error in fetchFlowData:', error);
      setError('Failed to load flow data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update page index when external control changes
  React.useEffect(() => {
    if (externalPageIndex !== undefined) {
      setCurrentPageIndex(externalPageIndex);
    }
  }, [externalPageIndex]);

  // Safe page processing with defensive guards
  const processSafePages = (flowData: any, flowMode: string = 'unknown') => {
    console.log('Processing safe pages:', { flowData, flowMode });
    
    // Extract pages with safe fallbacks
    const published = flowData?.published_snapshot?.pages ?? [];
    const draft = flowData?.flow_config?.pages ?? [];
    const configPages = flowData?.pages ?? []; // Direct pages property
    
    // Priority: published -> draft -> configPages - stable computation
    const stablePages = (published.length > 0 ? published : 
            draft.length > 0 ? draft : 
            configPages).filter(Boolean);
    
    const mode = published.length > 0 ? 'published' : 
                 draft.length > 0 ? 'draft' : 
                 configPages.length > 0 ? 'config' : 'empty';
    
    console.log('Safe page processing result:', { 
      publishedCount: published.length, 
      draftCount: draft.length, 
      configCount: configPages.length,
      finalCount: stablePages.length,
      mode: mode 
    });
    
    return { pages: stablePages, mode };
  };

  const renderEmptyPagesMessage = (mode: string) => {
    let message = '';
    if (mode === 'published') {
      message = 'Flow published snapshot is empty. Showing editor draft requires republish.';
    } else if (mode === 'draft-fallback') {
      message = 'Showing latest draft (not yet published).';
    } else {
      message = 'No pages available for this flow.';
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-muted-foreground">No Pages Available</CardTitle>
            <CardDescription>
              {message}
              <br />
              <span className="text-xs font-mono bg-muted px-2 py-1 rounded mt-2 inline-block">
                Mode: {mode}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              {mode === 'published' || mode === 'draft-fallback' 
                ? 'Check the Flow Editor for available content.'
                : 'This flow needs to be configured with content in the Flow Editor.'
              }
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };
  const handleAuthComplete = (result: 'pass' | 'fail') => {
    setIsAuthentic(result === 'pass');
  };

  const handleStoreSelection = (store: string) => {
    setUserInputs({ ...userInputs, selectedStore: store });
  };

  const authenticate = async () => {
    if (!userInputs.selectedStore) {
      toast({
        title: "Error",
        description: "Please select a store",
        variant: "destructive",
      });
      return;
    }

    setAuthenticating(true);
    
    // Simulate authentication check
    setTimeout(() => {
      const approvedStores = campaign?.approved_stores || [];
      const authentic = approvedStores.includes(userInputs.selectedStore);
      setIsAuthentic(authentic);
      setAuthenticating(false);
      
      setTimeout(() => {
        setCurrentStage(4); // Move to content stage
      }, 2000);
    }, 2000);
  };

  const nextStage = () => {
    if (currentStage === 2 && !hasAccount) {
      // Skip account creation if not wanted
      setCurrentStage(3);
      authenticate();
    } else if (currentStage === 3) {
      authenticate();
    } else {
      setCurrentStage(currentStage + 1);
    }
  };

  const prevStage = () => {
    setCurrentStage(Math.max(0, currentStage - 1));
  };

  // Debug logging for style tokens when ?debugStyle=1
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const isDebugMode = new URLSearchParams(window.location.search).get('debugStyle') === '1';
    
    if (isDebugMode && (flow || campaign)) {
      console.group('🔍 CustomerFlowExperience Debug (?debugStyle=1)');
      console.log('📊 Current Stage:', currentStage, '/', stages.length);
      console.log('📄 Current Page:', currentPageIndex, pages[currentPageIndex]?.name || 'Unknown');
      console.log('🏗️ Current Page Sections:', pages[currentPageIndex]?.sections?.length || 0);
      console.log('📋 Flow Pages Total:', pages.length);
      console.log('🎯 Template Mode:', templateData ? 'Template Preview' : 'Flow Runtime');
      console.groupEnd();
    }
  }, [currentStage, currentPageIndex, pages, flow, campaign, templateData, stages.length]);

  // Stabilized section-based flow sections computation
  const sectionBasedFlowSections = useMemo(() => {
    const flowConfig = flow?.flow_config as any;
    if (!flowConfig?.sections) return [];
    const sections = flowConfig.sections || [];
    return Array.isArray(sections) ? sections.filter(Boolean).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) : [];
  }, [flow?.flow_config]);

  // Stabilized current page sections computation - moved from renderTemplateFlow to prevent hook violation
  const currentPageSafeSections = useMemo(() => {
    const currentPageData = pages[externalPageIndex ?? currentPageIndex];
    if (!currentPageData) return [];
    const sections = currentPageData.sections || [];
    return Array.isArray(sections) ? sections.filter(Boolean).sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) : [];
  }, [pages, externalPageIndex, currentPageIndex]);

  const renderTemplateFlow = () => {
    // Trace logging when ?trace=1 - moved to top for comprehensive coverage
    const isTraceMode = new URLSearchParams(window.location.search).get('trace') === '1';
    
    if (isTraceMode) {
      console.log('🔍 [TRACE] CustomerFlowExperience.renderTemplateFlow() START:', {
        timestamp: new Date().toISOString(),
        pagesTotal: pages.length,
        currentPageIndex: externalPageIndex ?? currentPageIndex,
        externalPageIndex,
        internalPageIndex: currentPageIndex,
        flowId: flow?.id,
        campaignId: campaign?.id
      });
      
      // Log each page and its sections
      pages.forEach((page, pageIdx) => {
        const sectionsCount = (page.sections || []).length;
        console.log(`🔍 [TRACE] Page #${pageIdx}:`, {
          pageId: page.id,
          pageName: page.name,
          sectionsCount,
          isCurrentPage: pageIdx === (externalPageIndex ?? currentPageIndex)
        });
        
        // Log sections for current page in detail
        if (pageIdx === (externalPageIndex ?? currentPageIndex)) {
          (page.sections || []).forEach((section, sectionIdx) => {
            console.log(`🔍 [TRACE] Page #${pageIdx} Section #${sectionIdx}:`, {
              sectionType: section?.type,
              sectionId: section?.id,
              sectionOrder: section?.order
            });
          });
        }
      });
    }

    // Check for empty pages and render friendly message
    if (!pages || pages.length === 0) {
      const { mode } = processSafePages(flow?.flow_config || {}, 'template');
      if (isTraceMode) {
        console.log('🔍 [TRACE] No pages available, showing empty message');
      }
      return renderEmptyPagesMessage(mode);
    }

    const currentPageData = pages[externalPageIndex ?? currentPageIndex];
    if (!currentPageData) {
      if (isTraceMode) {
        console.log('🔍 [TRACE] Current page data not found');
      }
      return (
        <div style={{ '--device-width-px': '390px' } as React.CSSProperties}>
          <div className="text-center p-8">
            <div className="text-muted-foreground">
              <div className="text-lg mb-2">Page not found</div>
              <div className="text-sm">The requested page could not be loaded.</div>
            </div>
          </div>
        </div>
      );
    }

    // Use the pre-computed sections from top-level useMemo to prevent hook violation
    const safeSections = currentPageSafeSections;

    if (isTraceMode) {
      console.log('🔍 [TRACE] About to render current page sections:', {
        currentPageId: currentPageData.id,
        currentPageName: currentPageData.name,
        rawSectionsLength: (currentPageData.sections || []).length,
        safeSectionsLength: safeSections.length,
        sectionsAfterFilter: safeSections.map(s => ({
          type: s.type,
          id: s.id,
          order: s.order
        }))
      });
    }

    return (
      <div 
        className="flex flex-col min-h-screen" 
        style={{ 
          '--device-width-px': '390px',
          backgroundColor: flow?.flow_config?.theme?.backgroundColor || flow?.flow_config?.designConfig?.backgroundColor || '#ffffff'
        } as React.CSSProperties}
      >
        {/* Header */}
        {flow?.flow_config?.globalHeader?.showHeader && (
          <FlowHeader 
            globalHeader={{
              ...flow.flow_config.globalHeader,
              brandName: '' // Remove brand text
            }} 
          />
        )}

        {/* Page Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            {safeSections.map((section: any, idx: number) => {
              // Trace logging before each section render
              if (isTraceMode) {
                console.log(`🔍 [TRACE] Rendering SectionHost #${idx}:`, {
                  sectionType: section.type,
                  sectionId: section.id,
                  sectionOrder: section.order,
                  renderTimestamp: new Date().toISOString()
                });
              }
              
              return (
                <SectionHost 
                  section={section} 
                  page={currentPageData} 
                  styleTokens={styleTokens}
                  campaign={campaign}
                  userInputs={userInputs}
                  setUserInputs={setUserInputs}
                  pageBackgroundColor={flow?.flow_config?.theme?.backgroundColor || flow?.flow_config?.designConfig?.backgroundColor || '#ffffff'}
                  authConfig={currentPageData?.settings?.authConfig}
                  onNavigateToPage={(pageId) => {
                    const pages = flow?.flow_config?.pages || [];
                    
                    if (pageId === 'next') {
                      // Navigate to next page in sequence
                      const nextIndex = currentPageIndex + 1;
                      if (nextIndex < pages.length) {
                        setCurrentPageIndex(nextIndex);
                      }
                    } else if (pageId === 'final') {
                      // Navigate to the final page (thank you page)
                      const finalPageIndex = pages.findIndex((p: any) => p.type === 'thank_you');
                      if (finalPageIndex >= 0) {
                        setCurrentPageIndex(finalPageIndex);
                      }
                    } else {
                      // Navigate to specific page by ID
                      const targetPageIndex = pages.findIndex((p: any) => p.id === pageId);
                      if (targetPageIndex >= 0) {
                        setCurrentPageIndex(targetPageIndex);
                      }
                    }
                  }}
                  onAuthComplete={handleAuthComplete}
                  isAuthentic={isAuthentic}
                  key={section.id || `s-${idx}`} 
                />
              );
            })}
          </div>

          {/* Default footer - sticks to bottom */}
          {safeSections.every((s: any) => s.type !== 'footer') && (
            <div className="mt-auto">
              <PanaceaFooter 
                backgroundColor={flow?.flow_config?.footerConfig?.backgroundColor === 'transparent' ? undefined : flow?.flow_config?.footerConfig?.backgroundColor}
                logoSize={flow?.flow_config?.footerConfig?.logoSize || 60} 
              />
            </div>
          )}
        </div>

      </div>
    );
  };

  const renderStageContent = () => {
    const stage = stages[currentStage];

    switch (stage.type) {
      case 'landing':
        return (
          <div className="text-center space-y-6">
            {campaign?.brands?.logo_url && (
              <img 
                src={withCacheBust(campaign.brands.logo_url, brandData?.updated_at)} 
                alt={campaign.brands.name}
                className="h-16 mx-auto object-contain"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold mb-2">Welcome to Certified</h1>
              <p className="text-muted-foreground">
                Verify the authenticity of your {campaign?.brands?.name} product using our secure verification system.
              </p>
            </div>
            <div className="bg-card p-4 rounded-lg border">
              <h3 className="font-semibold mb-2">What you'll get:</h3>
              <ul className="text-sm space-y-1 text-left">
                <li>✓ Authentic product verification</li>
                <li>✓ Access to product documentation</li>
                <li>✓ Detailed product information</li>
                <li>✓ Supply chain transparency</li>
              </ul>
            </div>
          </div>
        );

      case 'store_location':
        console.log('Store location stage - userInputs:', userInputs);
        console.log('Purchase channel:', userInputs.purchaseChannel);
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">Store Location</h2>
              <p className="text-muted-foreground">
                Lets quickly confirm your product's authenticity to protect you from counterfeit products.
              </p>
            </div>
            
            {!userInputs.purchaseChannel ? (
              // Step 1: Purchase Channel Selection
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => setUserInputs({ ...userInputs, purchaseChannel: 'in-store' as const })}
                >
                  In-store
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setUserInputs({ ...userInputs, purchaseChannel: 'online' as const })}
                >
                  Online
                </Button>
              </div>
            ) : (
              // Step 2: Store Selection
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Purchase channel:</span>
                  <span className="font-medium">
                    {userInputs.purchaseChannel === 'in-store' ? 'In-store' : 'Online'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setUserInputs({ ...userInputs, purchaseChannel: '' as const, selectedStore: '' })}
                    className="text-xs underline h-auto p-0"
                  >
                    Change
                  </Button>
                </div>
                
                <div>
                  <Label htmlFor="store">Select Store</Label>
                  <Select value={userInputs.selectedStore} onValueChange={handleStoreSelection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your store" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaign?.approved_stores?.filter(store => store && store.trim()).map((store: string) => (
                        <SelectItem key={store} value={store}>{store}</SelectItem>
                      ))}
                      <SelectItem value="other">Other Store</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        );

      case 'account_creation':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">Create Account (Optional)</h2>
              <p className="text-muted-foreground">
                Create an account for full access to product information
              </p>
            </div>
            
            <div className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setHasAccount(false)}
              >
                Skip for now
              </Button>
              
              {!hasAccount ? (
                <Button 
                  className="w-full"
                  onClick={() => setHasAccount(true)}
                >
                  Create Account
                </Button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={userInputs.firstName}
                      onChange={(e) => setUserInputs({ ...userInputs, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={userInputs.lastName}
                      onChange={(e) => setUserInputs({ ...userInputs, lastName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userInputs.email}
                      onChange={(e) => setUserInputs({ ...userInputs, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={userInputs.password}
                      onChange={(e) => setUserInputs({ ...userInputs, password: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'authentication':
        return (
          <div className="text-center space-y-6">
            {authenticating ? (
              <div>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <h2 className="text-xl font-bold mb-2">Verifying...</h2>
                <p className="text-muted-foreground">
                  Checking product authenticity against our database
                </p>
              </div>
            ) : isAuthentic !== null ? (
              <div className={`p-6 rounded-lg ${isAuthentic ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                {isAuthentic ? (
                  <>
                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-green-800 mb-2">Authentic Product</h2>
                    <p className="text-green-700">
                      This product has been verified as authentic through our secure verification system.
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-800 mb-2">Verification Failed</h2>
                    <p className="text-red-700">
                      This product could not be verified. Please contact the brand for assistance.
                    </p>
                  </>
                )}
              </div>
            ) : null}
          </div>
        );

      case 'content':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold mb-2">Product Information</h2>
              <p className="text-muted-foreground">
                Access detailed product documentation and information
              </p>
            </div>
            
            {!hasAccount && isAuthentic ? (
              <div className="bg-card p-4 rounded-lg border text-center">
                <div className="blur-sm mb-4">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded mb-2 w-3/4 mx-auto"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                </div>
                <p className="text-muted-foreground mb-4">
                  Create an account or login to view detailed product information
                </p>
                <Button className="w-full">
                  Create Account / Login
                </Button>
              </div>
            ) : isAuthentic ? (
              <div className="space-y-4">
                {content.map((item) => (
                  <Card key={item.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        {item.content_type === 'testing_document' && <FileText className="h-4 w-4" />}
                        {item.content_type === 'product_info' && <Package className="h-4 w-4" />}
                        {item.content_type === 'logistics_info' && <Truck className="h-4 w-4" />}
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {item.content?.description && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {item.content.description}
                        </p>
                      )}
                      {item.file_url && (
                        <Button variant="outline" size="sm" className="w-full">
                          📎 View Document
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {content.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No additional content available for this product.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Product verification failed. Content not available.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Single TemplateStyleProvider wrapper for entire component
  return (
    <TemplateStyleProvider
      templateId={templateId}
      brandColors={brandColors}
    >
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading verification flow...</p>
          </div>
        </div>
      ) : (() => {
        // Main template flow rendering
        if (templateData || effective?.pages?.length > 0 || (flow?.flow_config?.pages && pages.length > 0)) {
          return renderTemplateFlow();
        }

        // Check if this is a section-based flow
        const flowConfig = flow?.flow_config as any;
        if (flowConfig?.sections) {
          // Use the pre-computed sections from top-level useMemo
          const safeSections = sectionBasedFlowSections;
          
          const backgroundColor = flowConfig?.theme?.backgroundColor || flowConfig?.designConfig?.backgroundColor || '#ffffff';
          const globalHeader = flowConfig?.globalHeader || {
            showHeader: true,
            brandName: '',
            logoUrl: '',
            backgroundColor: '#3b82f6',
            logoSize: 'medium'
          };
          
          return (
            <div 
              className="min-h-screen"
              style={{ backgroundColor }}
            >
              {/* Global Header */}
              {globalHeader.showHeader && (globalHeader.logoUrl || globalHeader.brandName) && (
                <div 
                  className="sticky top-0 z-50 p-4 text-white text-center"
                  style={{ backgroundColor: globalHeader.backgroundColor }}
                >
                  <div className="flex items-center justify-center gap-3">
                    {globalHeader.logoUrl && (
                      <img 
                        src={globalHeader.logoUrl} 
                        alt="Brand Logo"
                        className={`${
                          globalHeader.logoSize === 'small' ? 'h-6' :
                          globalHeader.logoSize === 'large' ? 'h-12' : 'h-8'
                        } object-contain`}
                      />
                    )}
                    {globalHeader.brandName && (
                      <h1 className={`font-semibold ${
                        globalHeader.logoSize === 'small' ? 'text-lg' :
                        globalHeader.logoSize === 'large' ? 'text-2xl' : 'text-xl'
                      }`}>
                        {globalHeader.brandName}
                      </h1>
                    )}
                  </div>
                </div>
              )}
              
              <div className="max-w-sm mx-auto px-4 py-6">
                <div className="space-y-4">
                  {safeSections.map((section: any, idx: number) => {
                    // Trace logging when ?trace=1 - enhanced for section-based flow
                    const isTraceMode = new URLSearchParams(window.location.search).get('trace') === '1';
                    if (isTraceMode) {
                      // Only log overview once per render, not per section
                      if (idx === 0) {
                        console.log('🔍 [TRACE] CustomerFlowExperience section-based flow START:', {
                          timestamp: new Date().toISOString(),
                          pagesLength: 0, // section-based flow has no pages
                          currentPageIndex: 0,
                          sectionsLength: safeSections.length,
                          sectionsAfterFilter: safeSections.map(s => ({
                            type: s.type,
                            id: s.id,
                            order: s.order
                          }))
                        });
                      }
                      
                      console.log(`🔍 [TRACE] Section-based SectionHost #${idx}:`, {
                        sectionType: section.type,
                        sectionId: section.id,
                        sectionOrder: section.order,
                        renderTimestamp: new Date().toISOString()
                      });
                    }
                    
                    return (
                      <SectionHost 
                        section={section} 
                        page={pages[externalPageIndex ?? currentPageIndex]} 
                        styleTokens={styleTokens}
                        campaign={campaign}
                        userInputs={userInputs}
                        setUserInputs={setUserInputs}
                        pageBackgroundColor={backgroundColor}
                        authConfig={pages[externalPageIndex ?? currentPageIndex]?.settings?.authConfig}
                        onNavigateToPage={(pageId) => {
                          const pages = flow?.flow_config?.pages || [];
                          
                          if (pageId === 'next') {
                            // Navigate to next page in sequence
                            const nextIndex = currentPageIndex + 1;
                            if (nextIndex < pages.length) {
                              setCurrentPageIndex(nextIndex);
                            }
                          } else if (pageId === 'final') {
                            // Navigate to the final page (thank you page)
                            const finalPageIndex = pages.findIndex((p: any) => p.type === 'thank_you');
                            if (finalPageIndex >= 0) {
                              setCurrentPageIndex(finalPageIndex);
                            }
                          } else {
                            // Navigate to specific page by ID
                            const targetPageIndex = pages.findIndex((p: any) => p.id === pageId);
                            if (targetPageIndex >= 0) {
                              setCurrentPageIndex(targetPageIndex);
                            }
                          }
                        }}
                        onAuthComplete={handleAuthComplete}
                        key={section.id || `s-${idx}`} 
                      />
                    );
                  })}
                </div>
                
                {/* Default footer - sticks to bottom, same as page-based flow */}
                {safeSections.every((s: any) => s.type !== 'footer') && (
                  <div className="mt-auto">
                    <PanaceaFooter 
                      backgroundColor={flow?.flow_config?.footerConfig?.backgroundColor === 'transparent' ? undefined : flow?.flow_config?.footerConfig?.backgroundColor}
                      logoSize={flow?.flow_config?.footerConfig?.logoSize || 60} 
                    />
                  </div>
                )}
                
              </div>
            </div>
          );
        }

        // Legacy flow rendering
        return (
          <div 
            className="min-h-screen flex flex-col"
            style={{ 
              '--device-width-px': '390px',
              backgroundColor: flow?.flow_config?.theme?.backgroundColor || flow?.flow_config?.designConfig?.backgroundColor || '#ffffff'
            } as React.CSSProperties}
          >
            {/* Legacy flow rendering */}
            {renderStageContent() && (
              <div className="flex-1 flex flex-col">
                {/* Progress Bar */}
                <div className="bg-card border-b">
                  <div className="max-w-sm mx-auto px-4 py-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-muted-foreground">Step {currentStage + 1} of {stages.length}</span>
                      <span className="text-xs text-muted-foreground">{Math.round(((currentStage + 1) / stages.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentStage + 1) / stages.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="max-w-sm mx-auto px-4 py-6">
                  <div className="mb-8">
                    {renderStageContent()}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex gap-3">
                    {currentStage > 0 && currentStage < 4 && (
                      <Button 
                        variant="outline" 
                        onClick={prevStage}
                        className="flex-1"
                      >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                    )}
                    
                    {currentStage < 4 && currentStage !== 3 && (
                      <Button 
                        onClick={nextStage}
                        className="flex-1"
                        disabled={currentStage === 1 && (!userInputs.purchaseChannel || !userInputs.selectedStore)}
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </TemplateStyleProvider>
  );
 };

 export default CustomerFlowExperience;