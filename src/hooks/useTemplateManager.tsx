import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SystemTemplate {
  id: string;
  kind: 'system' | 'brand';
  status: 'draft' | 'published' | 'deprecated';
  name: string;
  description: string;
  created_by: string;
  brand_id: string | null;
  base_template_id: string | null;
  version: number;
  schema: any;
  content: any;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  user_email: string;
  user_display_name: string;
}

interface TemplateManagerState {
  systemTemplates: SystemTemplate[];
  brandTemplates: SystemTemplate[];
  brands: Brand[];
  isLoading: boolean;
  error: string | null;
}

export const useTemplateManager = () => {
  const [state, setState] = useState<TemplateManagerState>({
    systemTemplates: [],
    brandTemplates: [],
    brands: [],
    isLoading: false,
    error: null
  });

  // Load system templates
  const loadSystemTemplates = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('kind', 'system')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setState(prev => ({ 
        ...prev, 
        systemTemplates: data || [],
        isLoading: false 
      }));
    } catch (error: any) {
      console.error('Error loading system templates:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message,
        isLoading: false 
      }));
      toast.error('Failed to load system templates');
    }
  };

  // Load brand templates for current user
  const loadBrandTemplates = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .eq('kind', 'brand')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setState(prev => ({ 
        ...prev, 
        brandTemplates: data || [],
        isLoading: false 
      }));
    } catch (error: any) {
      console.error('Error loading brand templates:', error);
      setState(prev => ({ 
        ...prev, 
        error: error.message,
        isLoading: false 
      }));
      toast.error('Failed to load brand templates');
    }
  };

  // Load all brands (admin only)
  const loadBrands = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_all_brands');

      if (error) throw error;

      setState(prev => ({ 
        ...prev, 
        brands: data || []
      }));
    } catch (error: any) {
      console.error('Error loading brands:', error);
      toast.error('Failed to load brands');
    }
  };

  // Create system template (admin only)
  const createSystemTemplate = async (templateData: {
    name: string;
    description: string;
    schema: any;
    content: any;
  }) => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .insert({
          kind: 'system',
          status: 'draft',
          name: templateData.name,
          description: templateData.description,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          schema: templateData.schema,
          content: templateData.content
        })
        .select()
        .single();

      if (error) throw error;

      setState(prev => ({
        ...prev,
        systemTemplates: [data, ...prev.systemTemplates]
      }));

      toast.success('System template created successfully');
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating system template:', error);
      toast.error('Failed to create system template');
      return { success: false, error: error.message };
    }
  };

  // Update system template (admin only)
  const updateSystemTemplate = async (id: string, updates: Partial<SystemTemplate>) => {
    try {
      const { data, error } = await supabase
        .from('templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setState(prev => ({
        ...prev,
        systemTemplates: prev.systemTemplates.map(t => t.id === id ? data : t)
      }));

      toast.success('System template updated successfully');
      return { success: true, data };
    } catch (error: any) {
      console.error('Error updating system template:', error);
      toast.error('Failed to update system template');
      return { success: false, error: error.message };
    }
  };

  // Publish system template (admin only)
  const publishSystemTemplate = async (templateId: string) => {
    try {
      const { data, error } = await supabase.rpc('admin_publish_system_template', {
        tpl_id: templateId
      });

      if (error) throw error;

      await loadSystemTemplates(); // Refresh list
      toast.success('System template published successfully');
      return { success: true, data };
    } catch (error: any) {
      console.error('Error publishing system template:', error);
      toast.error('Failed to publish system template');
      return { success: false, error: error.message };
    }
  };

  // Fork system template to brand template
  const forkSystemTemplate = async (systemTemplateId: string, brandId: string) => {
    try {
      const { data, error } = await supabase.rpc('brand_fork_system_template', {
        system_tpl_id: systemTemplateId,
        target_brand_id: brandId
      });

      if (error) throw error;

      await loadBrandTemplates(); // Refresh brand templates
      toast.success('Template forked successfully');
      return { success: true, data };
    } catch (error: any) {
      console.error('Error forking system template:', error);
      toast.error('Failed to fork template');
      return { success: false, error: error.message };
    }
  };

  // Create campaign from template
  const createCampaignFromTemplate = async (
    brandId: string,
    templateId: string,
    campaignName: string,
    templateVersion?: number
  ) => {
    try {
      const { data, error } = await supabase.rpc('create_campaign_from_template', {
        p_brand_id: brandId,
        p_template_id: templateId,
        p_campaign_name: campaignName,
        p_template_version: templateVersion
      });

      if (error) throw error;

      toast.success('Campaign created successfully');
      return { success: true, data };
    } catch (error: any) {
      console.error('Error creating campaign from template:', error);
      toast.error('Failed to create campaign');
      return { success: false, error: error.message };
    }
  };

  // Delete template
  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from('templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      setState(prev => ({
        ...prev,
        systemTemplates: prev.systemTemplates.filter(t => t.id !== templateId),
        brandTemplates: prev.brandTemplates.filter(t => t.id !== templateId)
      }));

      toast.success('Template deleted successfully');
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
      return { success: false, error: error.message };
    }
  };

  return {
    ...state,
    loadSystemTemplates,
    loadBrandTemplates,
    loadBrands,
    createSystemTemplate,
    updateSystemTemplate,
    publishSystemTemplate,
    forkSystemTemplate,
    createCampaignFromTemplate,
    deleteTemplate
  };
};