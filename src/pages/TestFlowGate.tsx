import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export const TestFlowGate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    verifyAndStartTestFlow();
  }, []);

  const verifyAndStartTestFlow = async () => {
    const token = searchParams.get('token');
    
    if (!token) {
      setError('Missing test token in URL');
      setLoading(false);
      return;
    }

    try {
      // Call the start-test-session edge function to verify token and create session
      const { data, error: functionError } = await supabase.functions.invoke('start-test-session', {
        body: { token }
      });

      if (functionError) {
        console.error('Error starting test session:', functionError);
        setError(`Failed to start test session: ${functionError.message}`);
        setLoading(false);
        return;
      }

      if (!data?.session_id || !data?.campaign_id) {
        setError('Invalid response from test session service');
        setLoading(false);
        return;
      }

      // Navigate to the flow run page with the campaign ID, session ID and test flag
      navigate(`/flow/run?cid=${data.campaign_id}&session=${data.session_id}&test=true`, { replace: true });
      
    } catch (error) {
      console.error('Error in verifyAndStartTestFlow:', error);
      setError('An unexpected error occurred while starting the test session');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying test token...</p>
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
            <AlertDescription>
              <p>{error}</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return null;
};