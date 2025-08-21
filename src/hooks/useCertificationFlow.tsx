import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type FlowStep = 'scan' | 'welcome' | 'store_selector' | 'user_login' | 'authentication' | 'final_page' | 'invalid';

export interface FlowSession {
  id: string;
  status: 'active' | 'completed' | 'failed';
  store_meta: any;
  user_id?: string;
  campaign: {
    id: string;
    name: string;
    final_redirect_url?: string;
  };
  brand: {
    id: string;
    name: string;
    logo_url?: string;
    brand_colors?: any;
  };
  verification?: {
    id: string;
    result: 'pass' | 'warn' | 'fail';
    reasons: string[];
    batch_info: any;
    created_at: string;
  };
}

export interface StoreMetadata {
  location_type: 'retailer' | 'pharmacy' | 'direct' | 'other';
  store_name: string;
  geo_location?: {
    latitude: number;
    longitude: number;
  };
}

export const useCertificationFlow = () => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('scan');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<FlowSession | null>(null);
  const [storeMetadata, setStoreMetadata] = useState<StoreMetadata | null>(null);
  const [marketingOptIn, setMarketingOptIn] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();

  // Initialize flow from QR code or test mode
  const startFlow = async (qrId?: string, testSessionId?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // If test session ID is provided, fetch the existing session
      if (testSessionId) {
        const { data, error } = await supabase.rpc('get_flow_session', {
          p_session_id: testSessionId
        });

        if (error) throw error;

        const result = data as any;
        if (!result?.success) {
          setCurrentStep('invalid');
          setError('Test session not found');
          return;
        }

        const sessionData = result.data;
        setSessionId(testSessionId);
        setSession({
          id: testSessionId,
          status: sessionData.status || 'active',
          store_meta: sessionData.store_meta || {},
          campaign: sessionData.campaign,
          brand: sessionData.brand
        });
        
        setCurrentStep('welcome');
        return;
      }

      // Original QR-based flow
      if (!qrId) {
        throw new Error('Either QR ID or test session ID is required');
      }

      const { data, error } = await supabase.rpc('start_flow_session', {
        p_qr_id: qrId
      });

      if (error) throw error;

      const result = data as any;
      if (!result?.success) {
        setCurrentStep('invalid');
        setError(result?.message || 'Invalid QR code');
        return;
      }

      setSessionId(result.session_id);
      setSession({
        id: result.session_id,
        status: 'active',
        store_meta: {},
        campaign: {
          id: result.campaign_id,
          name: result.campaign_name
        },
        brand: {
          id: result.brand_id,
          name: result.brand_name
        }
      });
      
      setCurrentStep('welcome');
      
      // Track telemetry
      await trackEvent('welcome_viewed', {
        session_id: result.session_id,
        campaign_id: result.campaign_id,
        brand_id: result.brand_id
      });
      
    } catch (err) {
      console.error('Error starting flow:', err);
      setError('Failed to start verification flow');
      setCurrentStep('invalid');
    } finally {
      setIsLoading(false);
    }
  };

  // Update store information
  const updateStore = async (metadata: StoreMetadata) => {
    if (!sessionId) return false;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('update_flow_store', {
        p_session_id: sessionId,
        p_store_meta: metadata as any
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        setStoreMetadata(metadata);
        
        // Track telemetry
        await trackEvent('store_selected', {
          session_id: sessionId,
          location_type: metadata.location_type,
          store_name: metadata.store_name
        });
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error updating store:', err);
      toast.error('Failed to update store information');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Link user to flow session
  const linkUser = async (authProvider: 'google' | 'apple' | 'email' = 'email') => {
    if (!sessionId || !user) return false;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('link_user_to_flow', {
        p_session_id: sessionId,
        p_user_id: user.id,
        p_marketing_opt_in: marketingOptIn,
        p_created_via: authProvider
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        // Track telemetry
        await trackEvent('auth_success', {
          session_id: sessionId,
          provider: authProvider,
          opt_in: marketingOptIn
        });
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Error linking user:', err);
      toast.error('Failed to link user to session');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Run verification
  const runVerification = async () => {
    if (!sessionId) return null;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('run_verification', {
        p_session_id: sessionId
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        // Track telemetry based on result
        const eventName = `verify_${result.result}`;
        await trackEvent(eventName, {
          session_id: sessionId,
          reasons: result.reasons,
          store_ok: result.store_ok,
          expiry_ok: result.expiry_ok
        });
        
        return result;
      }
      
      return null;
    } catch (err) {
      console.error('Error running verification:', err);
      toast.error('Failed to run verification');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Get current session data
  const refreshSession = async () => {
    if (!sessionId) return;
    
    try {
      const { data, error } = await supabase.rpc('get_flow_session', {
        p_session_id: sessionId
      });

      if (error) throw error;

      const result = data as any;
      if (result?.success) {
        setSession(result.data);
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
    }
  };

  // Track telemetry events
  const trackEvent = async (eventName: string, metadata: any = {}) => {
    try {
      // This would typically send to an analytics service
      console.log('Telemetry:', eventName, metadata);
      
      // Store in audit log for now
      await supabase.from('audit_log').insert({
        actor: user?.id || null,
        action: `flow_${eventName}`,
        object_type: 'flow_session',
        object_id: sessionId,
        meta: metadata
      });
    } catch (err) {
      console.error('Error tracking event:', err);
    }
  };

  // Navigation functions
  const goToNextStep = () => {
    const stepOrder: FlowStep[] = ['scan', 'welcome', 'store_selector', 'user_login', 'authentication', 'final_page'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToPrevStep = () => {
    const stepOrder: FlowStep[] = ['scan', 'welcome', 'store_selector', 'user_login', 'authentication', 'final_page'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const goToStep = (step: FlowStep) => {
    setCurrentStep(step);
  };

  return {
    // State
    currentStep,
    sessionId,
    session,
    storeMetadata,
    marketingOptIn,
    isLoading,
    error,
    user,
    
    // Actions
    startFlow,
    updateStore,
    linkUser,
    runVerification,
    refreshSession,
    trackEvent,
    
    // Navigation
    goToNextStep,
    goToPrevStep,
    goToStep,
    
    // Setters
    setMarketingOptIn,
    setError
  };
};