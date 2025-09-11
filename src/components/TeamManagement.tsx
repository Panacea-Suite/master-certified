import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBrandContext } from '@/contexts/BrandContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TeamUserManager } from '@/components/TeamUserManager';
import { Users, Plus, Settings, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  created_at: string;
  created_by: string;
  _count?: {
    team_users: number;
  };
}

export const TeamManagement: React.FC = () => {
  const { profile } = useAuth();
  const { currentBrand } = useBrandContext();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTeamManager, setShowTeamManager] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState('');

  const canManageTeams = profile?.role === 'master_admin' || 
    (currentBrand && profile?.role === 'brand_admin');

  useEffect(() => {
    if (currentBrand) {
      fetchTeams();
    }
  }, [currentBrand]);

  const fetchTeams = async () => {
    if (!currentBrand) return;

    try {
      setIsLoading(true);

      // Fetch teams for the current brand
      const { data: teamsData, error } = await supabase
        .from('teams')
        .select('id, name, created_at, created_by')
        .eq('brand_id', currentBrand.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get member count for each team
      const teamsWithCounts = await Promise.all(
        (teamsData || []).map(async (team) => {
          const { count, error: countError } = await supabase
            .from('team_users')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id);

          if (countError) {
            console.error('Error counting team members:', countError);
            return { ...team, _count: { team_users: 0 } };
          }

          return { ...team, _count: { team_users: count || 0 } };
        })
      );

      setTeams(teamsWithCounts);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Error",
        description: "Failed to load teams",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!currentBrand || !newTeamName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: newTeamName.trim(),
          brand_id: currentBrand.id,
          created_by: profile?.user_id
        })
        .select()
        .single();

      if (error) throw error;

      // Add the creator as a team admin
      const { error: memberError } = await supabase
        .from('team_users')
        .insert({
          team_id: data.id,
          user_id: profile?.user_id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      toast({
        title: "Success",
        description: "Team created successfully",
      });

      setNewTeamName('');
      setShowCreateDialog(false);
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Error",
        description: "Failed to create team",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!canManageTeams) return;

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team deleted successfully",
      });

      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Loading Teams...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-lg animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentBrand) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Select a brand to manage teams</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Management
            </CardTitle>
            {canManageTeams && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Team
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Team</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="teamName">Team Name</Label>
                      <Input
                        id="teamName"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="Enter team name"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateTeam();
                          }
                        }}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateTeam}
                        disabled={!newTeamName.trim()}
                      >
                        Create Team
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {teams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No teams created yet</p>
                {canManageTeams && (
                  <p className="text-sm">Create your first team to get started</p>
                )}
              </div>
            ) : (
              teams.map((team) => (
                <div key={team.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium">{team.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(team.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {team._count?.team_users || 0} member{team._count?.team_users !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTeamManager(team.id)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                    
                    {canManageTeams && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete team "${team.name}"?`)) {
                            handleDeleteTeam(team.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {showTeamManager && (
        <Dialog open={!!showTeamManager} onOpenChange={() => setShowTeamManager(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <TeamUserManager
              teamId={showTeamManager}
              onClose={() => setShowTeamManager(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};