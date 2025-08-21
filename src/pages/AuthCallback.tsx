import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      try {
        // Get the current user session after OAuth redirect
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setError(userError?.message || 'No user found after authentication');
          setStatus('error');
          return;
        }

        // Get stored data from sessionStorage
        const marketingOptIn = sessionStorage.getItem('marketing_opt_in') === '1';
        const flowSessionId = sessionStorage.getItem('flow_session_id');
        const provider = sessionStorage.getItem('auth_provider') as 'google' | 'apple' | 'email' || 'google';
        
        // If we have a flow session, link the user
        if (flowSessionId) {
          try {
            const { error: linkError } = await supabase.rpc('link_user_to_flow', {
              p_session_id: flowSessionId,
              p_user_id: user.id,
              p_marketing_opt_in: marketingOptIn,
              p_created_via: provider,
            });
            
            if (linkError) {
              throw new Error(linkError.message);
            }
            
            toast.success('Successfully signed in and linked to flow');
          } catch (err: any) {
            console.error('Error linking user to flow:', err);
            setError(`Failed to link user to flow: ${err.message}`);
            setStatus('error');
            return;
          }
        } else {
          toast.success('Successfully signed in');
        }

        setStatus('success');

        // Clear temporary data
        sessionStorage.removeItem('marketing_opt_in');
        sessionStorage.removeItem('flow_session_id');
        sessionStorage.removeItem('auth_provider');

        // Navigate back to where the user came from
        const returnTo = sessionStorage.getItem('return_to');
        sessionStorage.removeItem('return_to');
        
        setTimeout(() => {
          if (returnTo) {
            window.location.href = returnTo;
          } else {
            navigate('/', { replace: true });
          }
        }, 1500);

      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'An unexpected error occurred');
        setStatus('error');
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <h2 className="text-xl font-semibold">Completing sign-in...</h2>
              <p className="text-muted-foreground">Please wait while we finish setting up your account.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
              <h2 className="text-xl font-semibold">Success!</h2>
              <p className="text-muted-foreground">You have been successfully signed in. Redirecting...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <h2 className="text-xl font-semibold">Authentication Error</h2>
              <p className="text-muted-foreground">{error}</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/', { replace: true })}
                  className="flex-1"
                >
                  Go Home
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Retry
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}