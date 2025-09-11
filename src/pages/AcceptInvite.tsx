import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, AlertCircle, Mail, Building, Users } from 'lucide-react';

interface InviteInfo {
  id: string;
  email: string;
  role: string;
  team_name: string;
  brand_name: string;
  expires_at: string;
  accepted_at?: string;
}

const AcceptInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link - no token provided');
      setIsLoading(false);
      return;
    }

    fetchInviteInfo();
  }, [token]);

  const fetchInviteInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('user_invites')
        .select(`
          id,
          email,
          role,
          expires_at,
          accepted_at,
          teams!inner (
            name,
            brands!inner (
              name
            )
          )
        `)
        .eq('invite_token', token)
        .single();

      if (error || !data) {
        setError('Invitation not found or invalid');
        return;
      }

      const invite = {
        id: data.id,
        email: data.email,
        role: data.role,
        team_name: (data.teams as any).name,
        brand_name: (data.teams as any).brands.name,
        expires_at: data.expires_at,
        accepted_at: data.accepted_at,
      };

      setInviteInfo(invite);

      // Check if already accepted
      if (invite.accepted_at) {
        setError('This invitation has already been accepted');
        return;
      }

      // Check if expired
      if (new Date(invite.expires_at) < new Date()) {
        setError('This invitation has expired');
        return;
      }

    } catch (error: any) {
      console.error('Error fetching invite info:', error);
      setError('Failed to load invitation details');
    } finally {
      setIsLoading(false);
    }
  };

  const acceptInvite = async () => {
    if (!inviteInfo || !token) return;

    setIsAccepting(true);
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Redirect to auth with return URL
        const returnUrl = encodeURIComponent(window.location.href);
        navigate(`/auth?return_to=${returnUrl}`);
        return;
      }

      // Check if user's email matches invite
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Could not verify user profile');
      }

      if (profile.email.toLowerCase() !== inviteInfo.email.toLowerCase()) {
        setError(`This invitation is for ${inviteInfo.email}, but you are signed in as ${profile.email}. Please sign in with the correct email address.`);
        return;
      }

      // Accept the invitation
      const { data, error } = await supabase.functions.invoke('accept-invite', {
        body: {
          invite_token: token,
          user_id: user.id
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success!",
          description: `You've successfully joined ${inviteInfo.team_name} at ${inviteInfo.brand_name}`,
        });

        // Redirect to dashboard or team page
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        throw new Error(data.error || 'Failed to accept invitation');
      }

    } catch (error: any) {
      console.error('Error accepting invite:', error);
      setError(error.message || 'Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleSignIn = () => {
    const returnUrl = encodeURIComponent(window.location.href);
    navigate(`/auth?return_to=${returnUrl}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Invitation Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate('/')} variant="outline">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteInfo) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a team
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Building className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{inviteInfo.brand_name}</p>
                <p className="text-sm text-muted-foreground">Brand</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{inviteInfo.team_name}</p>
                <p className="text-sm text-muted-foreground">Team</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium capitalize">{inviteInfo.role}</p>
                <p className="text-sm text-muted-foreground">Role</p>
              </div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Invitation for: <span className="font-medium">{inviteInfo.email}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Expires on {new Date(inviteInfo.expires_at).toLocaleDateString()}
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={acceptInvite} 
              className="w-full" 
              disabled={isAccepting}
            >
              {isAccepting ? 'Accepting...' : 'Accept Invitation'}
            </Button>
            
            <Button 
              onClick={handleSignIn} 
              variant="outline" 
              className="w-full"
            >
              Sign In with Different Account
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              By accepting, you agree to join this team and follow the organization's policies.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;