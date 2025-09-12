import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Trash2, RotateCcw, Clock, Archive } from 'lucide-react';
import { format } from 'date-fns';

interface ArchivedItem {
  id: string;
  name: string;
  archived_at: string;
  days_until_deletion: number;
  type: 'campaign' | 'batch' | 'qr_code';
  parent_name?: string; // For batches (campaign name) and QR codes (batch name)
}

export const ArchiveManager: React.FC = () => {
  const [archivedItems, setArchivedItems] = useState<ArchivedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('campaigns');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadArchivedItems();
    }
  }, [user]);

  const loadArchivedItems = async () => {
    try {
      setLoading(true);
      
      // Load archived campaigns
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select(`
          id, name, archived_at,
          brands!inner(user_id)
        `)
        .eq('is_archived', true)
        .eq('brands.user_id', user?.id);

      // Load archived batches
      const { data: batches } = await supabase
        .from('batches')
        .select(`
          id, name, archived_at,
          campaigns!inner(
            name,
            brands!inner(user_id)
          )
        `)
        .eq('is_archived', true)
        .eq('campaigns.brands.user_id', user?.id);

      // Load archived QR codes
      const { data: qrCodes } = await supabase
        .from('qr_codes')
        .select(`
          id, unique_code, archived_at,
          batches!inner(
            name,
            campaigns!inner(
              brands!inner(user_id)
            )
          )
        `)
        .eq('is_archived', true)
        .eq('batches.campaigns.brands.user_id', user?.id);

      // Calculate days until deletion and format data
      const items: ArchivedItem[] = [
        ...(campaigns || []).map(item => ({
          id: item.id,
          name: item.name,
          archived_at: item.archived_at,
          days_until_deletion: Math.max(0, 30 - Math.floor((Date.now() - new Date(item.archived_at).getTime()) / (1000 * 60 * 60 * 24))),
          type: 'campaign' as const
        })),
        ...(batches || []).map(item => ({
          id: item.id,
          name: item.name,
          archived_at: item.archived_at,
          days_until_deletion: Math.max(0, 30 - Math.floor((Date.now() - new Date(item.archived_at).getTime()) / (1000 * 60 * 60 * 24))),
          type: 'batch' as const,
          parent_name: item.campaigns.name
        })),
        ...(qrCodes || []).map(item => ({
          id: item.id,
          name: item.unique_code,
          archived_at: item.archived_at,
          days_until_deletion: Math.max(0, 30 - Math.floor((Date.now() - new Date(item.archived_at).getTime()) / (1000 * 60 * 60 * 24))),
          type: 'qr_code' as const,
          parent_name: item.batches.name
        }))
      ];

      setArchivedItems(items);
    } catch (error) {
      console.error('Error loading archived items:', error);
      toast({
        title: "Error",
        description: "Failed to load archived items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (item: ArchivedItem) => {
    try {
      const tableMap: { [key: string]: string } = {
        campaign: 'campaigns',
        batch: 'batches',
        qr_code: 'qr_codes'
      };

      const { data, error } = await supabase.rpc('restore_record', {
        p_table_name: tableMap[item.type],
        p_record_id: item.id,
        p_user_id: user?.id
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };
      if (result.success) {
        toast({
          title: "Restored",
          description: `${item.type.replace('_', ' ')} "${item.name}" has been restored`,
        });
        loadArchivedItems(); // Reload the list
      } else {
        throw new Error(result.error || 'Failed to restore item');
      }
    } catch (error) {
      console.error('Error restoring item:', error);
      toast({
        title: "Error",
        description: "Failed to restore item",
        variant: "destructive"
      });
    }
  };

  const handlePermanentDelete = async (item: ArchivedItem) => {
    try {
      let table: 'campaigns' | 'batches' | 'qr_codes';
      switch (item.type) {
        case 'campaign':
          table = 'campaigns';
          break;
        case 'batch':
          table = 'batches';
          break;
        case 'qr_code':
          table = 'qr_codes';
          break;
        default:
          throw new Error('Invalid item type');
      }

      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', item.id)
        .eq('is_archived', true);

      if (error) throw error;

      toast({
        title: "Permanently Deleted",
        description: `${item.type.replace('_', ' ')} "${item.name}" has been permanently deleted`,
      });
      loadArchivedItems(); // Reload the list
    } catch (error) {
      console.error('Error permanently deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to permanently delete item",
        variant: "destructive"
      });
    }
  };

  const getDeletionBadgeVariant = (days: number) => {
    if (days <= 3) return 'destructive';
    if (days <= 7) return 'secondary';
    return 'outline';
  };

  const filteredItems = archivedItems.filter(item => {
    switch (activeTab) {
      case 'campaigns': return item.type === 'campaign';
      case 'batches': return item.type === 'batch';
      case 'qr_codes': return item.type === 'qr_code';
      default: return true;
    }
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading archived items...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Archive
        </CardTitle>
        <CardDescription>
          Items in the archive will be permanently deleted after 30 days. You can restore them before then.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="campaigns">
              Campaigns ({archivedItems.filter(i => i.type === 'campaign').length})
            </TabsTrigger>
            <TabsTrigger value="batches">
              Batches ({archivedItems.filter(i => i.type === 'batch').length})
            </TabsTrigger>
            <TabsTrigger value="qr_codes">
              QR Codes ({archivedItems.filter(i => i.type === 'qr_code').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="mt-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No archived campaigns
              </div>
            ) : (
              <ArchivedItemsList 
                items={filteredItems} 
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
              />
            )}
          </TabsContent>

          <TabsContent value="batches" className="mt-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No archived batches
              </div>
            ) : (
              <ArchivedItemsList 
                items={filteredItems} 
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
              />
            )}
          </TabsContent>

          <TabsContent value="qr_codes" className="mt-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No archived QR codes
              </div>
            ) : (
              <ArchivedItemsList 
                items={filteredItems} 
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface ArchivedItemsListProps {
  items: ArchivedItem[];
  onRestore: (item: ArchivedItem) => void;
  onPermanentDelete: (item: ArchivedItem) => void;
}

const ArchivedItemsList: React.FC<ArchivedItemsListProps> = ({ items, onRestore, onPermanentDelete }) => {
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ [key: string]: string }>({});
  const [dialogOpen, setDialogOpen] = useState<{ [key: string]: boolean }>({});

  const getDeletionBadgeVariant = (days: number) => {
    if (days <= 3) return 'destructive';
    if (days <= 7) return 'secondary';
    return 'outline';
  };

  const handleDeleteConfirm = (item: ArchivedItem) => {
    const itemKey = `${item.type}-${item.id}`;
    if (deleteConfirmation[itemKey] === 'delete') {
      onPermanentDelete(item);
      setDeleteConfirmation(prev => ({ ...prev, [itemKey]: '' }));
      setDialogOpen(prev => ({ ...prev, [itemKey]: false }));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, item: ArchivedItem) => {
    if (e.key === 'Enter') {
      handleDeleteConfirm(item);
    }
  };

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={`${item.type}-${item.id}`} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex-1">
            <div className="font-medium">{item.name}</div>
            {item.parent_name && (
              <div className="text-sm text-muted-foreground">
                {item.type === 'batch' ? 'Campaign' : 'Batch'}: {item.parent_name}
              </div>
            )}
            <div className="text-sm text-muted-foreground">
              Archived: {format(new Date(item.archived_at), 'PPp')}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant={getDeletionBadgeVariant(item.days_until_deletion)} className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {item.days_until_deletion} days left
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRestore(item)}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Restore
            </Button>
            
            <AlertDialog 
              open={dialogOpen[`${item.type}-${item.id}`]} 
              onOpenChange={(open) => {
                const itemKey = `${item.type}-${item.id}`;
                setDialogOpen(prev => ({ ...prev, [itemKey]: open }));
                if (!open) {
                  setDeleteConfirmation(prev => ({ ...prev, [itemKey]: '' }));
                }
              }}
            >
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex items-center gap-1">
                  <Trash2 className="h-3 w-3" />
                  Delete Now
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Permanently Delete {item.type.replace('_', ' ')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{item.name}" immediately. This action cannot be undone.
                    <br /><br />
                    Type <strong>delete</strong> to confirm:
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="Type 'delete' to confirm"
                    value={deleteConfirmation[`${item.type}-${item.id}`] || ''}
                    onChange={(e) => {
                      const itemKey = `${item.type}-${item.id}`;
                      setDeleteConfirmation(prev => ({ ...prev, [itemKey]: e.target.value }));
                    }}
                    onKeyPress={(e) => handleKeyPress(e, item)}
                    autoFocus
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => {
                    const itemKey = `${item.type}-${item.id}`;
                    setDeleteConfirmation(prev => ({ ...prev, [itemKey]: '' }));
                  }}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => handleDeleteConfirm(item)}
                    disabled={deleteConfirmation[`${item.type}-${item.id}`] !== 'delete'}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                  >
                    Delete Permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ))}
    </div>
  );
};