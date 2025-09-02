import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Flow {
  id: string;
  name: string;
  campaign_id?: string;
  flow_config?: any;
  base_url?: string;
  created_at: string;
  template_category?: string;
  created_by?: string | null;
  campaign_name?: string;
  brand_name?: string;
  brand_id?: string;
}

export interface FlowManagerState {
  flows: Flow[];
  isLoading: boolean;
  error: string | null;
  selectedFlow: Flow | null;
  selectedFlowId: string | null;
  previewMode: 'editor' | 'customer' | null;
  showTemplateSelector: boolean;
}

export interface FlowOperationResult {
  success: boolean;
  data?: any;
  error?: string;
}

export const useFlowManager = () => {
  const [state, setState] = useState<FlowManagerState>({
    flows: [],
    isLoading: false,
    error: null,
    selectedFlow: null,
    selectedFlowId: null,
    previewMode: null,
    showTemplateSelector: false,
  });

  const updateState = useCallback((updates: Partial<FlowManagerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const logOperation = useCallback((operation: string, success: boolean, details?: any) => {
    console.log(`[FlowManager] ${operation}:`, {
      success,
      timestamp: new Date().toISOString(),
      details,
      userId: supabase.auth.getUser()
    });
  }, []);

  const fetchFlows = useCallback(async (): Promise<FlowOperationResult> => {
    updateState({ isLoading: true, error: null });
    
    try {
      logOperation('FETCH_FLOWS_START', true);

      // Use the new database function for better performance and consistency
      const { data: flowsData, error: flowsError } = await supabase
        .rpc('get_user_flows')
        .returns<Flow[]>();

      if (flowsError) {
        throw new Error(`Failed to fetch flows: ${flowsError.message}`);
      }

      // Also fetch brand data for flow creation
      const { data: brandData, error: brandError } = await supabase
        .from('brands')
        .select('id, name, logo_url, brand_colors')
        .maybeSingle();

      if (brandError && brandError.code !== 'PGRST116') { // Ignore "no rows" error
        console.warn('Failed to fetch brand data:', brandError);
      }

      updateState({ 
        flows: flowsData || [], 
        isLoading: false,
        error: null 
      });

      logOperation('FETCH_FLOWS_SUCCESS', true, { 
        flowCount: flowsData?.length || 0,
        hasBrand: !!brandData 
      });

      return { success: true, data: { flows: flowsData, brand: brandData } };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      updateState({ 
        isLoading: false, 
        error: errorMessage 
      });
      
      logOperation('FETCH_FLOWS_ERROR', false, { error: errorMessage });
      
      toast.error('Failed to load flows', {
        description: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  }, [updateState, logOperation]);

  const createFlowAtomic = useCallback(async (
    flowName: string, 
    brandId: string, 
    flowConfig: any = {},
    campaignName?: string
  ): Promise<FlowOperationResult> => {
    if (!flowName?.trim()) {
      const error = 'Flow name is required';
      toast.error('Validation Error', { description: error });
      return { success: false, error };
    }

    try {
      logOperation('CREATE_FLOW_START', true, { flowName, brandId });

      // Use the atomic database function for flow creation
      const { data: flowResult, error: createError } = await supabase
        .rpc('create_flow_with_campaign', {
          p_flow_name: flowName.trim(),
          p_brand_id: brandId,
          p_flow_config: flowConfig,
          p_campaign_name: campaignName
        });

      if (createError) {
        throw new Error(`Failed to create flow: ${createError.message}`);
      }

      if (!flowResult || flowResult.length === 0) {
        throw new Error('No flow data returned from creation function');
      }

      const newFlowData = flowResult[0];

      // Fetch the complete flow data to ensure consistency
      const { data: completeFlow, error: fetchError } = await supabase
        .rpc('get_user_flows')
        .eq('id', newFlowData.flow_id)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch created flow: ${fetchError.message}`);
      }

      // Update local state
      setState(prev => ({
        ...prev,
        flows: [completeFlow, ...prev.flows],
        selectedFlow: completeFlow,
        selectedFlowId: completeFlow.id,
        previewMode: 'editor'
      }));

      logOperation('CREATE_FLOW_SUCCESS', true, { 
        flowId: newFlowData.flow_id,
        campaignId: newFlowData.campaign_id 
      });

      toast.success('Flow created successfully', {
        description: `"${flowName}" is ready for editing`
      });

      return { 
        success: true, 
        data: completeFlow 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create flow';
      
      logOperation('CREATE_FLOW_ERROR', false, { error: errorMessage });
      
      toast.error('Failed to create flow', {
        description: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  }, [logOperation]);

  const duplicateFlow = useCallback(async (flow: Flow): Promise<FlowOperationResult> => {
    try {
      logOperation('DUPLICATE_FLOW_START', true, { originalFlowId: flow.id });

      if (!flow.brand_id) {
        throw new Error('Flow must have a brand ID to duplicate');
      }

      const duplicatedName = `${flow.name} (Copy)`;
      const duplicatedCampaignName = `${flow.name} Copy Campaign`;

      const result = await createFlowAtomic(
        duplicatedName,
        flow.brand_id,
        flow.flow_config,
        duplicatedCampaignName
      );

      if (result.success) {
        logOperation('DUPLICATE_FLOW_SUCCESS', true, { 
          originalFlowId: flow.id,
          newFlowId: result.data?.id 
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to duplicate flow';
      
      logOperation('DUPLICATE_FLOW_ERROR', false, { 
        flowId: flow.id, 
        error: errorMessage 
      });
      
      toast.error('Failed to duplicate flow', {
        description: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  }, [createFlowAtomic, logOperation]);

  const deleteFlow = useCallback(async (flowId: string): Promise<FlowOperationResult> => {
    try {
      logOperation('DELETE_FLOW_START', true, { flowId });

      const { error } = await supabase
        .from('flows')
        .delete()
        .eq('id', flowId);

      if (error) {
        throw new Error(`Failed to delete flow: ${error.message}`);
      }

      // Update local state
      setState(prev => ({
        ...prev,
        flows: prev.flows.filter(flow => flow.id !== flowId),
        selectedFlow: prev.selectedFlowId === flowId ? null : prev.selectedFlow,
        selectedFlowId: prev.selectedFlowId === flowId ? null : prev.selectedFlowId,
        previewMode: prev.selectedFlowId === flowId ? null : prev.previewMode
      }));

      logOperation('DELETE_FLOW_SUCCESS', true, { flowId });

      toast.success('Flow deleted successfully');

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete flow';
      
      logOperation('DELETE_FLOW_ERROR', false, { flowId, error: errorMessage });
      
      toast.error('Failed to delete flow', {
        description: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  }, [logOperation]);

  const saveFlow = useCallback(async (flowId: string, flowData: any): Promise<FlowOperationResult> => {
    try {
      logOperation('SAVE_FLOW_START', true, { flowId });

      // First, get the current flow to check if it's attached to a campaign
      const { data: currentFlow, error: fetchError } = await supabase
        .from('flows')
        .select('campaign_id, latest_published_version')
        .eq('id', flowId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch flow: ${fetchError.message}`);
      }

      // Prepare update data
      const updateData: any = {
        name: flowData.name,
        flow_config: flowData.flow_config,
        updated_at: new Date().toISOString()
      };

      // If flow is attached to a campaign, auto-publish by creating snapshot
      if (currentFlow?.campaign_id) {
        updateData.published_snapshot = {
          ...flowData.flow_config,
          name: flowData.name,
          publishedAt: new Date().toISOString()
        };
        updateData.latest_published_version = (currentFlow.latest_published_version || 0) + 1;
      }

      const { error } = await supabase
        .from('flows')
        .update(updateData)
        .eq('id', flowId);

      if (error) {
        throw new Error(`Failed to save flow: ${error.message}`);
      }

      // Update local state
      setState(prev => ({
        ...prev,
        flows: prev.flows.map(flow => 
          flow.id === flowId 
            ? { ...flow, ...flowData, updated_at: new Date().toISOString() }
            : flow
        ),
        selectedFlow: prev.selectedFlow?.id === flowId 
          ? { ...prev.selectedFlow, ...flowData }
          : prev.selectedFlow
      }));

      logOperation('SAVE_FLOW_SUCCESS', true, { flowId });

      toast.success('Flow saved successfully');

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save flow';
      
      logOperation('SAVE_FLOW_ERROR', false, { flowId, error: errorMessage });
      
      toast.error('Failed to save flow', {
        description: errorMessage
      });

      return { success: false, error: errorMessage };
    }
  }, [logOperation]);

  // UI state management
  const openFlowEditor = useCallback((flow: Flow) => {
    updateState({
      selectedFlow: flow,
      selectedFlowId: flow.id,
      previewMode: 'editor'
    });
    logOperation('OPEN_EDITOR', true, { flowId: flow.id });
  }, [updateState, logOperation]);

  const openCustomerPreview = useCallback((flowId: string) => {
    updateState({
      selectedFlowId: flowId,
      previewMode: 'customer'
    });
    logOperation('OPEN_PREVIEW', true, { flowId });
  }, [updateState, logOperation]);

  const openTemplateSelector = useCallback(() => {
    updateState({ showTemplateSelector: true });
    logOperation('OPEN_TEMPLATE_SELECTOR', true);
  }, [updateState, logOperation]);

  const closeModals = useCallback(() => {
    updateState({
      selectedFlowId: null,
      selectedFlow: null,
      previewMode: null,
      showTemplateSelector: false
    });
    logOperation('CLOSE_MODALS', true);
  }, [updateState, logOperation]);

  return {
    ...state,
    // Data operations
    fetchFlows,
    createFlowAtomic,
    duplicateFlow,
    deleteFlow,
    saveFlow,
    // UI operations
    openFlowEditor,
    openCustomerPreview,
    openTemplateSelector,
    closeModals,
    // Utilities
    logOperation
  };
};