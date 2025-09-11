import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mail, UserPlus, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface TeamInviteManagerProps {
  teamId: string;
  teamName: string;
  brandName: string;
  canInvite: boolean;
}

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
  invited_by?: string;
}

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user_email?: string;
  user_name?: string;
}

const TeamInviteManager: React.FC<TeamInviteManagerProps> = ({
  teamId,
  teamName,
  brandName,
  canInvite
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamData();
  }, [teamId]);

  const fetchTeamData = async () => {
    try {
      // Fetch pending invites
      const { data: invites, error: invitesError } = await supabase
        .from('user_invites')
        .select('*')
        .eq('team_id', teamId)
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (invitesError) throw invitesError;
      setPendingInvites(invites || []);

      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from('team_users')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profiles!inner (
            email,
            display_name
          )
        `)
        .eq('team_id', teamId)
        .order('joined_at', { ascending: false });

      if (membersError) throw membersError;
      
      const formattedMembers = members?.map(member => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        user_email: (member.profiles as any)?.email,
        user_name: (member.profiles as any)?.display_name
      })) || [];

      setTeamMembers(formattedMembers);
    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive",
      });
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-team-invite', {
        body: {
          invitee_email: inviteEmail.trim(),
          team_id: teamId,
          role: inviteRole
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: data.added_directly 
            ? "User added to team successfully" 
            : "Invitation sent successfully",
        });
        setInviteEmail('');
        setInviteRole('member');
        fetchTeamData(); // Refresh the data
      } else {
        throw new Error(data.error || 'Failed to send invitation');
      }
    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from('user_invites')
        .delete()
        .eq('id', inviteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Invitation cancelled",
      });
      fetchTeamData();
    } catch (error) {
      console.error('Error cancelling invite:', error);
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      });
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{teamName} - Team Management</h2>
          <p className="text-muted-foreground">{brandName}</p>
        </div>
      </div>

      {/* Invite New User */}
      {canInvite && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Invite New Team Member
            </CardTitle>
            <CardDescription>
              Send an invitation to add a new member to this team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="w-32">
                <Label htmlFor="inviteRole">Role</Label>
                <Select value={inviteRole} onValueChange={(value: 'admin' | 'member' | 'viewer') => setInviteRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={sendInvite} disabled={isLoading}>
                  <Mail className="w-4 h-4 mr-2" />
                  {isLoading ? 'Sending...' : 'Send Invite'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Invitations ({pendingInvites.length})
            </CardTitle>
            <CardDescription>
              Invitations that haven't been accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{invite.email}</span>
                      <span className="text-sm px-2 py-1 bg-muted rounded capitalize">
                        {invite.role}
                      </span>
                      {isExpired(invite.expires_at) && (
                        <span className="text-sm px-2 py-1 bg-destructive/10 text-destructive rounded flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Expired
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Sent {new Date(invite.created_at).toLocaleDateString()} • 
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                  {canInvite && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelInvite(invite.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Team Members ({teamMembers.length})
          </CardTitle>
          <CardDescription>
            Current members of this team
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {teamMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {member.user_name || member.user_email}
                    </span>
                    <span className="text-sm px-2 py-1 bg-muted rounded capitalize">
                      {member.role}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {member.user_email && member.user_name && member.user_email}
                    {member.user_email && member.user_name && ' • '}
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamInviteManager;