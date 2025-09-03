import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Chrome, Smartphone, Mail, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface LoginStepProps {
  title?: string;
  subtitle?: string;
  showEmail?: boolean;
  showApple?: boolean;
  brandName?: string;
  onAuthSuccess?: (params: { 
    user: any; 
    provider: 'google' | 'apple' | 'email'; 
    marketingOptIn: boolean 
  }) => void;
  onAuthError?: (error: Error) => void;
  onTrackEvent?: (eventName: string, metadata?: any) => void;
  onSkip?: () => void;
}

export const LoginStep: React.FC<LoginStepProps> = ({
  title = "Create your Certified account",
  subtitle = "Access full testing results and member-only offers.",
  showEmail = true,
  showApple = true,
  brandName = "this brand",
  onAuthSuccess,
  onAuthError,
  onTrackEvent,
  onSkip
}) => {
  const [loading, setLoading] = useState<'google' | 'apple' | 'email' | null>(null);
  const [optIn, setOptIn] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { user, signIn, signUp } = useAuth();

  // Track when component is viewed
  React.useEffect(() => {
    onTrackEvent?.('auth_viewed');
  }, [onTrackEvent]);

  // Auto-trigger success callback when user is authenticated
  React.useEffect(() => {
    if (user && !loading) {
      onAuthSuccess?.({ 
        user, 
        provider: 'email', // Default to email, could be enhanced to track actual provider
        marketingOptIn: optIn 
      });
    }
  }, [user, loading, optIn, onAuthSuccess]);

  const continueWithGoogle = async (marketingOptIn: boolean) => {
    // optional: persist flags/context for after redirect
    sessionStorage.setItem('marketing_opt_in', marketingOptIn ? '1' : '0');
    // sessionStorage.setItem('flow_session_id', currentSessionId); // if you have one

    const redirectTo = `${window.location.origin}${import.meta.env.VITE_AUTH_REDIRECT || '/auth/callback'}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        scopes: 'openid email profile',
        queryParams: { prompt: 'select_account' } // optional
      }
    });

    if (error) {
      // show error to user
      console.error('Google OAuth start failed', error);
      setError(error.message || 'Google sign-in failed');
      onAuthError?.(new Error(error.message));
    }
  };

  const handleGoogleAuth = async () => {
    setLoading('google');
    setError(undefined);
    
    try {
      await continueWithGoogle(optIn);
      onTrackEvent?.('auth_success', { provider: 'google', marketingOptIn: optIn });
      // Note: Don't set loading to null on success as user will be redirected
    } catch (err: any) {
      const errorMsg = err.message || 'Google sign-in failed';
      setError(errorMsg);
      onAuthError?.(new Error(errorMsg));
      onTrackEvent?.('auth_error', { provider: 'google', error: errorMsg });
      setLoading(null);
    }
  };

  const handleAppleAuth = async () => {
    setLoading('apple');
    setError(undefined);
    
    try {
      // Store context for OAuth callback
      sessionStorage.setItem('marketing_opt_in', optIn ? '1' : '0');
      sessionStorage.setItem('auth_provider', 'apple');
      sessionStorage.setItem('return_to', window.location.href);

      // Calculate redirect URL
      const redirectTo = `${window.location.origin}${import.meta.env.VITE_AUTH_REDIRECT || '/auth/callback'}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo,
          scopes: 'openid email profile'
        }
      });
      
      if (error) {
        throw error;
      }
      
      onTrackEvent?.('auth_success', { provider: 'apple', marketingOptIn: optIn });
      // Note: Don't set loading to null on success as user will be redirected
    } catch (err: any) {
      const errorMsg = err.message || 'Apple sign-in failed';
      setError(errorMsg);
      onAuthError?.(new Error(errorMsg));
      onTrackEvent?.('auth_error', { provider: 'apple', error: errorMsg });
      setLoading(null);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading('email');
    setError(undefined);
    
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          throw error;
        }
      }
      
      onTrackEvent?.('auth_success', { provider: 'email', marketingOptIn: optIn });
    } catch (err: any) {
      const errorMsg = err.message || 'Authentication failed';
      setError(errorMsg);
      onAuthError?.(new Error(errorMsg));
      onTrackEvent?.('auth_error', { provider: 'email', error: errorMsg });
    } finally {
      setLoading(null);
    }
  };

  console.log('LoginStep rendering with props:', { title, subtitle, showEmail, showApple, brandName });
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {/* Social Auth Buttons */}
        <div className="space-y-3">
          <button 
            onClick={() => continueWithGoogle(optIn)} 
            className="w-full rounded-lg border border-gray-300 bg-white hover:bg-gray-50 px-4 py-2 font-medium flex items-center justify-center gap-3 text-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
            disabled={!!loading}
          >
            {loading === 'google' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          {showApple && (
            <button
              onClick={handleAppleAuth}
              disabled={!!loading}
              className="w-full rounded-lg bg-black hover:bg-gray-900 text-white px-4 py-2 font-medium flex items-center justify-center gap-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === 'apple' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              )}
              {loading === 'apple' ? 'Signing in...' : 'Continue with Apple'}
            </button>
          )}
        </div>

        {/* Divider */}
        {showEmail && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>
        )}

        {/* Email Auth */}
        {showEmail && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                disabled={!!loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                disabled={!!loading}
              />
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  disabled={!!loading}
                />
              </div>
            )}

            <Button 
              onClick={handleEmailAuth}
              disabled={!!loading}
              className="w-full"
            >
              {loading === 'email' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              {loading === 'email' 
                ? 'Please wait...' 
                : isSignUp 
                  ? 'Create Account' 
                  : 'Sign In'
              }
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                className="text-sm"
                onClick={() => setIsSignUp(!isSignUp)}
                disabled={!!loading}
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </Button>
            </div>
          </div>
        )}

        {/* Marketing Consent */}
        <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-lg">
          <Checkbox
            id="marketing-consent"
            checked={optIn}
            onCheckedChange={(checked) => setOptIn(checked === true)}
            disabled={!!loading}
          />
          <Label htmlFor="marketing-consent" className="text-sm cursor-pointer">
            Share my details with <strong>{brandName}</strong> for updates & offers
          </Label>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Privacy Policy */}
        <p className="text-xs text-muted-foreground text-center">
          By continuing you agree to our{' '}
          <a 
            href="/privacy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Privacy Policy
          </a>
          .
        </p>

        {/* Skip Button */}
        {onSkip && (
          <div className="text-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSkip}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Skip
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};