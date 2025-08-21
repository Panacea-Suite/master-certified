import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CertificationFlow } from '@/components/certification-flow/CertificationFlow';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from 'lucide-react';

interface TestTokenPayload {
  mode: string;
  template_id?: string;
  campaign_id?: string;
  created_by: string;
  exp: number;
}

export const TestFlow: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [testSessionId, setTestSessionId] = useState<string>('');

  useEffect(() => {
    verifyAndStartTestFlow();
  }, []);

  const verifyAndStartTestFlow = async () => {
    try {
      const token = searchParams.get('token');
      if (!token) {
        setError('Missing test token');
        return;
      }

      // Basic token validation
      const parts = token.split('.');
      if (parts.length !== 3) {
        setError('Invalid token format');
        return;
      }
      
      const payload = JSON.parse(atob(parts[1])) as TestTokenPayload;
      
      if (payload.exp * 1000 < Date.now()) {
        setError('Test link has expired. Please generate a new test link.');
        return;
      }

      if (payload.mode !== 'test') {
        setError('Invalid test token');
        return;
      }

      // Start test session and store in sessionStorage for CertificationFlow
      await startTestSession(payload);

    } catch (error) {
      console.error('Error verifying test token:', error);
      setError('Failed to verify test token');
    } finally {
      setLoading(false);
    }
  };

  const startTestSession = async (payload: TestTokenPayload) => {
    try {
      if (payload.campaign_id) {
        const { data, error } = await supabase.rpc('start_flow_session', {
          p_qr_id: null,
          p_campaign_id: payload.campaign_id,
          p_is_test: true
        });

        if (error) throw error;

        const response = data as any;
        if (!response.success) {
          throw new Error(response.message || 'Failed to start test session');
        }

        setTestSessionId(response.session_id);
        
        // Store for CertificationFlow component
        sessionStorage.setItem('test_qr_id', response.session_id);
        sessionStorage.setItem('test_mode', 'true');
        
      } else if (payload.template_id) {
        // Template-only flows should now have a campaign_id created by the edge function
        setError('Test link is invalid - no campaign found. Please regenerate the test link.');
      } else {
        setError('Invalid test link - missing required information.');
      }
    } catch (error) {
      console.error('Error starting test session:', error);
      setError(error instanceof Error ? error.message : 'Failed to start test session');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying test link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <p>{error}</p>
              {error.includes('expired') && (
                <Button onClick={() => navigate('/templates')} variant="outline" size="sm" className="mt-2">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate New Test Link
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!testSessionId) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
        🧪 Test Mode - Data will be saved as test data and excluded from analytics
      </div>
      <CertificationFlow />
    </div>
  );
};