/**
 * Common wrapper that provides consistent styling tokens for both editor and runtime
 * Eliminates drift between editor preview and customer runtime rendering
 */
import React from 'react';
import { TemplateStyleProvider } from '@/components/TemplateStyleProvider';
import { resolveStyleTokens, tokensToProviderFormat } from '@/utils/resolveStyleTokens';

interface FlowStyleShellProps {
  children: React.ReactNode;
  campaign?: any;
  flow?: any;
  flowSnapshot?: any;
  templateId?: string;
  // Legacy compatibility - will be phased out in favor of resolved tokens
  brandColors?: any;
}

/**
 * Consistent styling wrapper for both editor and runtime
 * Ensures identical token resolution and styling behavior
 */
export const FlowStyleShell: React.FC<FlowStyleShellProps> = ({
  children,
  campaign,
  flow,
  flowSnapshot,
  templateId = 'classic',
  brandColors // Legacy fallback
}) => {
  // Resolve style tokens using centralized logic
  const resolvedTokens = React.useMemo(() => {
    console.log('FlowStyleShell: Resolving tokens for', {
      campaignId: campaign?.id,
      flowId: flow?.id,
      templateId,
      hasLegacyBrandColors: !!brandColors
    });

    // Use the centralized token resolver
    const tokens = resolveStyleTokens(
      campaign,
      flowSnapshot || flow,
      templateId
    );
    
    const providerTokens = tokensToProviderFormat(tokens);
    
    // Fallback to legacy brandColors if provided (for backward compatibility)
    const finalTokens = brandColors ? {
      ...providerTokens,
      ...brandColors
    } : providerTokens;
    
    console.log('FlowStyleShell: Final resolved tokens', finalTokens);
    return finalTokens;
  }, [campaign, flow, flowSnapshot, templateId, brandColors]);

  return (
    <TemplateStyleProvider 
      templateId={templateId}
      brandColors={resolvedTokens}
    >
      {children}
    </TemplateStyleProvider>
  );
};

/**
 * Hook to create consistent editor-specific tokens
 * Used when we need to pass editor state as flow data
 */
export const useEditorTokens = (
  pages: any[],
  pageSettings: any,
  selectedTemplateId?: string
) => {
  return React.useMemo(() => {
    const editorFlowData = {
      flow_config: {
        pages: pages,
        designConfig: {
          backgroundColor: pageSettings?.backgroundColor,
          // Other properties will use defaults from the resolver
        }
      }
    };
    
    const tokens = resolveStyleTokens(
      undefined, // No campaign in editor context
      editorFlowData,
      selectedTemplateId || 'classic'
    );
    
    return tokensToProviderFormat(tokens);
  }, [pages, pageSettings, selectedTemplateId]);
};
