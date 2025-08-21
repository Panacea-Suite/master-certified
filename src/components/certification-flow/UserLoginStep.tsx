import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { User, Mail, ArrowRight, ArrowLeft, Chrome, Smartphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { FlowSession } from '@/hooks/useCertificationFlow';

interface UserLoginStepProps {
  session: FlowSession | null;
  marketingOptIn: boolean;
  onNext: () => void;
  onPrev: () => void;
  onLinkUser: (provider?: 'google' | 'apple' | 'email') => Promise<boolean>;
  onTrackEvent: (eventName: string, metadata?: any) => void;
  onSetMarketingOptIn: (value: boolean) => void;
  isLoading: boolean;
}

export const UserLoginStep: React.FC<UserLoginStepProps> = ({
  session,
  marketingOptIn,
  onNext,
  onPrev,
  onLinkUser,
  onTrackEvent,
  onSetMarketingOptIn,
  isLoading
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const { user, signIn, signUp } = useAuth();

  React.useEffect(() => {
    onTrackEvent('auth_viewed');
  }, [onTrackEvent]);

  React.useEffect(() => {
    if (user) {
      handleUserLinked('email');
    }
  }, [user]);

  const handleUserLinked = async (provider: 'google' | 'apple' | 'email') => {
    const success = await onLinkUser(provider);
    if (success) {
      onNext();
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsAuthenticating(true);
    
    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Account created successfully!');
          // User will be automatically linked via useEffect
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          // User will be automatically linked via useEffect
        }
      }
    } catch (error) {
      toast.error('Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsAuthenticating(true);
    
    try {
      // Store context for OAuth callback
      sessionStorage.setItem('marketing_opt_in', marketingOptIn ? '1' : '0');
      sessionStorage.setItem('auth_provider', 'google');
      sessionStorage.setItem('return_to', window.location.href);
      
      if (session?.id) {
        sessionStorage.setItem('flow_session_id', session.id);
      }

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
        toast.error('Google sign-in failed: ' + error.message);
        setIsAuthenticating(false);
      }
      // Note: Don't set setIsAuthenticating(false) on success as user will be redirected
    } catch (error: any) {
      console.error('Google auth error:', error);
      toast.error('Google sign-in failed');
      setIsAuthenticating(false);
    }
  };

  const handleAppleAuth = async () => {
    setIsAuthenticating(true);
    
    try {
      // Store context for OAuth callback
      sessionStorage.setItem('marketing_opt_in', marketingOptIn ? '1' : '0');
      sessionStorage.setItem('auth_provider', 'apple');
      sessionStorage.setItem('return_to', window.location.href);
      
      if (session?.id) {
        sessionStorage.setItem('flow_session_id', session.id);
      }

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
        toast.error('Apple sign-in failed: ' + error.message);
        setIsAuthenticating(false);
      }
      // Note: Don't set setIsAuthenticating(false) on success as user will be redirected
    } catch (error: any) {
      console.error('Apple auth error:', error);
      toast.error('Apple sign-in failed');
      setIsAuthenticating(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <User className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Signed in successfully!</h3>
            <p className="text-muted-foreground mb-4">
              Linking your account to the verification session...
            </p>
            {isLoading && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-8 h-8 text-primary" />
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </CardTitle>
          
          <CardDescription className="text-base mt-2">
            Required to access verification results and exclusive content
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Social Auth */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleAuth}
              disabled={isAuthenticating}
            >
              <Chrome className="w-4 h-4 mr-2" />
              Continue with Google
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={handleAppleAuth}
              disabled={isAuthenticating}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Continue with Apple
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* Email Auth */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            {isSignUp && (
              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                />
              </div>
            )}

            <div className="flex items-center space-x-2 p-4 bg-muted/50 rounded-lg">
              <Checkbox
                id="marketing-consent"
                checked={marketingOptIn}
                onCheckedChange={(checked) => onSetMarketingOptIn(checked === true)}
              />
              <Label htmlFor="marketing-consent" className="text-sm cursor-pointer">
                Share my details with <strong>{session?.brand.name || 'this brand'}</strong> for product updates and exclusive offers
              </Label>
            </div>

            <Button 
              onClick={handleEmailAuth}
              disabled={isAuthenticating}
              className="w-full"
            >
              {isAuthenticating ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <div className="text-center">
              <Button
                variant="link"
                className="text-sm"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onPrev} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
};