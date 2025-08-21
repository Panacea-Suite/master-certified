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
      const token = searchParams.get('token');
      if (!token) {
        setError('Missing test token');
        return;
      }

      console.log('Starting test session with token payload:', payload);

      // Call the start-test-session edge function
      const { data, error } = await supabase.functions.invoke('start-test-session', {
        body: { token }
      });

      console.log('start-test-session response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        setError(`Failed to start test session: ${error.message || 'Unknown error'}`);
        return;
      }

      if (!data || !data.success) {
        const errorMsg = data?.error || 'Failed to start test session';
        const errorDetails = data?.details ? ` (${data.details})` : '';
        const errorCode = data?.code ? ` [${data.code}]` : '';
        console.error('Test session creation failed:', data);
        setError(`${errorMsg}${errorDetails}${errorCode}`);
        return;
      }

      const sessionId = data.session_id;
      console.log('Test session created successfully:', sessionId);

      // Navigate to the certification flow with the session ID  
      navigate(`/flow/run?session=${sessionId}&test=true`);
      
    } catch (error) {
      console.error('Error starting test session:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start test session';
      setError(`Unexpected error: ${errorMessage}`);
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

  // Loading state while processing - don't show anything since we navigate away
  return null;
};