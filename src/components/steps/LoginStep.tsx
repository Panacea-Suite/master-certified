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
}

export const LoginStep: React.FC<LoginStepProps> = ({
  title = "Create your Certified account",
  subtitle = "Access full testing results and member-only offers.",
  showEmail = true,
  showApple = true,
  brandName = "this brand",
  onAuthSuccess,
  onAuthError,
  onTrackEvent
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

  const handleGoogleAuth = async () => {
    setLoading('google');
    setError(undefined);
    
    try {
      // Store context for OAuth callback
      sessionStorage.setItem('marketing_opt_in', optIn ? '1' : '0');
      sessionStorage.setItem('auth_provider', 'google');
      sessionStorage.setItem('return_to', window.location.href);

      // Calculate redirect URL
      const redirectTo = `${window.location.origin}${import.meta.env.VITE_AUTH_REDIRECT || '/auth/callback'}`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          scopes: 'openid email profile',
          queryParams: {
            prompt: 'select_account'
          }
        }
      });
      
      if (error) {
        throw error;
      }
      
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
          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={handleGoogleAuth}
            disabled={!!loading}
          >
            {loading === 'google' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Chrome className="w-4 h-4 mr-2" />
            )}
            {loading === 'google' ? 'Signing in...' : 'Continue with Google'}
          </Button>

          {showApple && (
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={handleAppleAuth}
              disabled={!!loading}
            >
              {loading === 'apple' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Smartphone className="w-4 h-4 mr-2" />
              )}
              {loading === 'apple' ? 'Signing in...' : 'Continue with Apple'}
            </Button>
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
      </CardContent>
    </Card>
  );
};