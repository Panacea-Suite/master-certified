import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, 
         AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, UserPlus, Trash2, Shield, User, Eye } from 'lucide-react';
import TeamInviteManager from '@/components/TeamInviteManager';
import { toast } from '@/hooks/use-toast';

interface TeamUser {
  id: string;
  user_id: string;
  team_id: string;
  role: 'admin' | 'member' | 'viewer';
  joined_at: string;
  profiles: {
    email: string;
    display_name: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

interface Team {
  id: string;
  name: string;
  brand_id: string;
}

interface TeamUserManagerProps {
  teamId: string;
  onClose?: () => void;
}

export const TeamUserManager: React.FC<TeamUserManagerProps> = ({ teamId, onClose }) => {
  const { profile } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'member' | 'viewer' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const canManageTeam = currentUserRole === 'admin' || profile?.role === 'master_admin';

  useEffect(() => {
    if (teamId) {
      fetchTeamData();
    }
  }, [teamId]);

  // Refresh data when invite dialog closes (to pick up new invites/members)
  useEffect(() => {
    if (!showInviteDialog && teamId) {
      const timer = setTimeout(() => {
        fetchTeamData();
      }, 500); // Small delay to allow edge function to complete
      return () => clearTimeout(timer);
    }
  }, [showInviteDialog, teamId]);

  const fetchTeamData = async () => {
    try {
      setIsLoading(true);

      // Fetch team info
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id, name, brand_id')
        .eq('id', teamId)
        .single();

      if (teamError) throw teamError;
      setTeam(teamData);

      // Fetch team users with profile data
      const { data: usersData, error: usersError } = await supabase
        .from('team_users')
        .select(`
          id,
          user_id,
          team_id,
          role,
          joined_at
        `)
        .eq('team_id', teamId)
        .order('joined_at', { ascending: true });

      if (usersError) throw usersError;

      // Fetch profiles separately for each user
      const userIds = usersData?.map(u => u.user_id) || [];
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, display_name, first_name, last_name')
        .in('user_id', userIds);

      if (profilesError) throw profilesError;

      // Combine team users with their profiles
      const usersWithProfiles = usersData?.map(user => ({
        ...user,
        profiles: profilesData?.find(p => p.user_id === user.user_id) || null
      })) || [];

      setTeamUsers(usersWithProfiles);

      // Find current user's role in this team
      const currentUserTeamMembership = usersWithProfiles?.find(u => u.user_id === profile?.user_id);
      setCurrentUserRole(currentUserTeamMembership?.role || null);

    } catch (error) {
      console.error('Error fetching team data:', error);
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'member' | 'viewer') => {
    if (!canManageTeam) return;

    try {
      const { error } = await supabase
        .from('team_users')
        .update({ role: newRole })
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      fetchTeamData();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!canManageTeam) return;

    try {
      const { error } = await supabase
        .from('team_users')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User removed from team successfully",
      });

      fetchTeamData();
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: "Error",
        description: "Failed to remove user from team",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'member':
        return <User className="w-4 h-4" />;
      case 'viewer':
        return <Eye className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'member':
        return 'default';
      case 'viewer':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getUserDisplayName = (user: TeamUser) => {
    const profile = user.profiles;
    if (!profile) return 'Unknown User';
    
    if (profile.display_name) return profile.display_name;
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    if (profile.first_name) return profile.first_name;
    return profile.email.split('@')[0];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Loading Team Users...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="w-20 h-6 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team: {team?.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {canManageTeam && (
              <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Invite User to Team</DialogTitle>
                  </DialogHeader>
                  <TeamInviteManager 
                    teamId={teamId}
                    teamName={team?.name || 'Team'}
                    brandName="Current Brand"
                    canInvite={canManageTeam}
                  />
                  <div className="flex justify-end pt-4">
                    <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                      Close
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            {onClose && (
              <Button variant="outline" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {teamUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No team members yet</p>
              {canManageTeam && (
                <p className="text-sm">Invite users to get started</p>
              )}
            </div>
          ) : (
            teamUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg bg-card">
                <Avatar className="w-10 h-10">
                  <AvatarFallback>
                    {getUserDisplayName(user).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">
                      {getUserDisplayName(user)}
                    </p>
                    {user.user_id === profile?.user_id && (
                      <Badge variant="outline" className="text-xs">You</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.profiles?.email || 'No email'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(user.joined_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {canManageTeam && user.user_id !== profile?.user_id ? (
                    <Select
                      value={user.role}
                      onValueChange={(newRole: 'admin' | 'member' | 'viewer') => 
                        handleRoleChange(user.user_id, newRole)
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="member">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Member
                          </div>
                        </SelectItem>
                        <SelectItem value="viewer">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Viewer
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1">
                      {getRoleIcon(user.role)}
                      <span className="capitalize">{user.role}</span>
                    </Badge>
                  )}

                  {canManageTeam && user.user_id !== profile?.user_id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove <strong>{getUserDisplayName(user)}</strong> from this team? 
                            They will lose access to all team resources.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleRemoveUser(user.user_id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove User
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {teamUsers.length > 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Role Permissions</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3" />
                <span><strong>Admin:</strong> Full team management access</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-3 h-3" />
                <span><strong>Member:</strong> Can view and edit campaigns</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-3 h-3" />
                <span><strong>Viewer:</strong> Read-only access</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};