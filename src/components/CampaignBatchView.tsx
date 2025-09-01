import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Download, FileDown, Trash2, QrCode, Eye, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Campaign {
  id: string;
  name: string;
  brands?: {
    name: string;
  };
}

interface Batch {
  id: string;
  name: string;
  qr_code_count: number;
  status: string;
  generated_at?: string;
  created_at: string;
}

interface QRCode {
  id: string;
  unique_code: string;
  qr_url: string;
  scans: number;
}

interface CampaignBatchViewProps {
  campaign: Campaign;
  onBack: () => void;
}

const CampaignBatchView: React.FC<CampaignBatchViewProps> = ({ campaign, onBack }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBatchName, setNewBatchName] = useState('');
  const [qrCodeCount, setQrCodeCount] = useState(100);
  const { toast } = useToast();

  useEffect(() => {
    fetchBatches();
  }, [campaign.id]);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch batches",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createBatch = async () => {
    if (!newBatchName.trim()) {
      toast({
        title: "Error",
        description: "Batch name is required",
        variant: "destructive",
      });
      return;
    }

    if (qrCodeCount < 1 || qrCodeCount > 10000) {
      toast({
        title: "Error",
        description: "QR code count must be between 1 and 10,000",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('batches')
        .insert([{
          name: newBatchName,
          campaign_id: campaign.id,
          qr_code_count: qrCodeCount,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      setBatches([data, ...batches]);
      setNewBatchName('');
      setQrCodeCount(100);
      setShowCreateForm(false);
      
      // Immediately generate QR codes for the new batch
      await generateQRCodes(data.id);
      
      toast({
        title: "Success",
        description: "Batch created and QR codes generated successfully",
      });
    } catch (error) {
      console.error('Error creating batch:', error);
      toast({
        title: "Error",
        description: "Failed to create batch",
        variant: "destructive",
      });
    }
  };

  const generateQRCodes = async (batchId: string) => {
    try {
      // Update batch status to generating
      const { error: updateError } = await supabase
        .from('batches')
        .update({ 
          status: 'generating',
          generated_at: new Date().toISOString()
        })
        .eq('id', batchId);

      if (updateError) throw updateError;

      // Generate QR codes
      const batch = batches.find(b => b.id === batchId);
      if (batch) {
        // Generate QR codes without requiring a flow (redirect uses unique_code)
        const qrCodes = [] as any[];
        for (let i = 0; i < batch.qr_code_count; i++) {
          const uniqueCode = `${batchId.substring(0, 8)}-${Date.now()}-${String(i).padStart(3, '0')}`;
          const managedUrl = `${window.location.origin}/#/qr/${uniqueCode}`;
          
          qrCodes.push({
            batch_id: batchId,
            flow_id: null,
            qr_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(managedUrl)}`,
            unique_code: uniqueCode,
            unique_flow_url: null
          });
        }

        const { error: insertError } = await supabase
          .from('qr_codes')
          .insert(qrCodes);

        if (insertError) throw insertError;

        // Update batch status to completed
        const { error: completeError } = await supabase
          .from('batches')
          .update({ status: 'completed' })
          .eq('id', batchId);

        if (completeError) throw completeError;

        // Refresh data
        fetchBatches();
        
        toast({
          title: "Success",
          description: "QR codes generated successfully",
        });
      }
    } catch (error) {
      console.error('Error generating QR codes:', error);
      toast({
        title: "Error",
        description: "Failed to generate QR codes",
        variant: "destructive",
      });
      
      // Reset batch status on error
      await supabase
        .from('batches')
        .update({ status: 'pending' })
        .eq('id', batchId);
    }
  };

  const fetchQRCodes = async (batchId: string) => {
    setIsLoadingQR(true);
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('id, unique_code, qr_url, scans')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQrCodes(data || []);
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch QR codes",
        variant: "destructive",
      });
    } finally {
      setIsLoadingQR(false);
    }
  };

  const exportBatch = async (batchId: string, format: 'csv' | 'zip') => {
    try {
      const { data: qrCodes, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('batch_id', batchId);

      if (error) throw error;

      if (format === 'csv') {
        const csvContent = [
          'Unique Code,QR URL,Scans',
          ...qrCodes.map(qr => `${qr.unique_code},${qr.qr_url},${qr.scans}`)
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `batch-${batchId}-qr-codes.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }

      toast({
        title: "Success",
        description: `Batch exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error exporting batch:', error);
      toast({
        title: "Error",
        description: "Failed to export batch",
        variant: "destructive",
      });
    }
  };

  const deleteBatch = async (batchId: string) => {
    try {
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', batchId);

      if (error) throw error;

      setBatches(batches.filter(batch => batch.id !== batchId));
      if (selectedBatch?.id === batchId) {
        setSelectedBatch(null);
        setQrCodes([]);
      }
      
      toast({
        title: "Success",
        description: "Batch deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast({
        title: "Error",
        description: "Failed to delete batch",
        variant: "destructive",
      });
    }
  };

  const viewQRCodes = (batch: Batch) => {
    setSelectedBatch(batch);
    fetchQRCodes(batch.id);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading batches...</div>;
  }

  if (selectedBatch) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setSelectedBatch(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Batches
            </Button>
            <div>
              <h1 className="text-3xl font-bold">QR Codes</h1>
              <p className="text-muted-foreground">
                Batch: {selectedBatch.name} • {selectedBatch.qr_code_count} codes
              </p>
            </div>
          </div>
        </div>

        {isLoadingQR ? (
          <div className="text-center py-8">Loading QR codes...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {qrCodes.map((qr) => (
              <Card key={qr.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium truncate">
                    {qr.unique_code}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-center">
                    <img 
                      src={qr.qr_url} 
                      alt={`QR Code ${qr.unique_code}`}
                      className="w-32 h-32 border rounded"
                    />
                  </div>
                  <div className="text-center">
                    <Badge variant="secondary">
                      {qr.scans} scans
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Batches</h1>
            <p className="text-muted-foreground">
              Campaign: {campaign.name} • Brand: {campaign.brands?.name}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Batch
        </Button>
      </div>

      {/* Create Batch Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Batch</CardTitle>
            <CardDescription>
              Generate a new batch of QR codes for this campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="batchName">Batch Name</Label>
                <Input
                  id="batchName"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  placeholder="Enter batch name"
                />
              </div>
              <div>
                <Label htmlFor="qrCount">QR Code Count</Label>
                <Input
                  id="qrCount"
                  type="number"
                  min="1"
                  max="10000"
                  value={qrCodeCount}
                  onChange={(e) => setQrCodeCount(parseInt(e.target.value) || 0)}
                  placeholder="Number of QR codes"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={createBatch}>
                <Plus className="w-4 h-4 mr-2" />
                Create Batch
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {batches.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <QrCode className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No batches yet</h3>
                  <p className="text-muted-foreground">
                    Create batches of QR codes for this campaign in the Batch Management section.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          batches.map((batch) => (
            <Card key={batch.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {batch.name}
                      <Badge variant={
                        batch.status === 'completed' ? 'default' :
                        batch.status === 'generating' ? 'secondary' : 'outline'
                      }>
                        {batch.status}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {batch.qr_code_count} QR codes
                      {batch.generated_at && ` • Generated ${new Date(batch.generated_at).toLocaleDateString()}`}
                      {` • Created ${new Date(batch.created_at).toLocaleDateString()}`}
                    </CardDescription>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deleteBatch(batch.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  {batch.status === 'pending' && (
                    <Button 
                      variant="default"
                      onClick={() => generateQRCodes(batch.id)}
                    >
                      Generate QR Codes
                    </Button>
                  )}
                  {batch.status === 'generating' && (
                    <Badge variant="secondary">Generating...</Badge>
                  )}
                  {batch.status === 'completed' && (
                    <>
                      <Button 
                        variant="default"
                        onClick={() => viewQRCodes(batch)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View QR Codes
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => exportBatch(batch.id, 'csv')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => exportBatch(batch.id, 'zip')}
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        Export ZIP
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CampaignBatchView;