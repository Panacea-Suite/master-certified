import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Download, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface BrandUser {
  id: string;
  user_email: string;
  user_name: string;
  first_seen_at: string;
  last_seen_at: string;
  source_campaign_id: string;
  marketing_opt_in: boolean;
  created_via: 'google' | 'apple' | 'email';
}

export const BrandPeopleManager: React.FC = () => {
  const [users, setUsers] = useState<BrandUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchBrandUsers();
  }, []);

  const fetchBrandUsers = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('brand_users')
        .select('*')
        .order('first_seen_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching brand users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const csvContent = [
      ['Email', 'Name', 'First Seen', 'Last Seen', 'Marketing Opt-in', 'Sign-up Method'].join(','),
      ...filteredUsers.map(user => [
        user.user_email || '',
        user.user_name || '',
        new Date(user.first_seen_at).toLocaleDateString(),
        new Date(user.last_seen_at).toLocaleDateString(),
        user.marketing_opt_in ? 'Yes' : 'No',
        user.created_via
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brand-users.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          People ({filteredUsers.length})
        </CardTitle>
        <CardDescription>
          Users who have verified products from your brand campaigns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>First Seen</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Marketing</TableHead>
                <TableHead>Sign-up Method</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.user_email}</TableCell>
                  <TableCell>{user.user_name || 'N/A'}</TableCell>
                  <TableCell>{new Date(user.first_seen_at).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(user.last_seen_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={user.marketing_opt_in ? 'default' : 'secondary'}>
                      {user.marketing_opt_in ? 'Opted In' : 'Opted Out'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{user.created_via}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};