import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Download, FileDown, Trash2 } from 'lucide-react';

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
  campaigns?: Campaign;
}

const BatchManager = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [newBatchName, setNewBatchName] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [qrCodeCount, setQrCodeCount] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select(`
          id,
          name,
          brands (
            name
          )
        `)
        .order('name');

      if (campaignsError) throw campaignsError;
      setCampaigns(campaignsData || []);

      // Fetch batches
      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select(`
          *,
          campaigns (
            id,
            name,
            brands (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (batchesError) throw batchesError;
      setBatches(batchesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
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

    if (!selectedCampaignId) {
      toast({
        title: "Error",
        description: "Please select a campaign",
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
          campaign_id: selectedCampaignId,
          qr_code_count: qrCodeCount,
          status: 'pending'
        }])
        .select(`
          *,
          campaigns (
            id,
            name,
            brands (
              name
            )
          )
        `)
        .single();

      if (error) throw error;

      setBatches([data, ...batches]);
      setNewBatchName('');
      setSelectedCampaignId('');
      setQrCodeCount(100);
      toast({
        title: "Success",
        description: "Batch created successfully",
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

      // Generate QR codes (placeholder for now)
      const batch = batches.find(b => b.id === batchId);
      if (batch) {
        const qrCodes = [];
        for (let i = 0; i < batch.qr_code_count; i++) {
          const uniqueCode = `${batchId}-${Date.now()}-${i}`;
          qrCodes.push({
            batch_id: batchId,
            qr_url: `https://qr-api.com/generate?data=${uniqueCode}`,
            unique_code: uniqueCode
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
        fetchData();
        
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
        // Create CSV content
        const csvContent = [
          'Unique Code,QR URL,Scans',
          ...qrCodes.map(qr => `${qr.unique_code},${qr.qr_url},${qr.scans}`)
        ].join('\n');

        // Download CSV
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

  if (isLoading) {
    return <div className="text-center py-8">Loading batches...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Batch Management</h1>
      </div>

      {/* Create Batch Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Batch</CardTitle>
          <CardDescription>
            Generate a batch of QR codes for a specific campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label htmlFor="campaignSelect">Campaign</Label>
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((campaign) => (
                    <SelectItem key={campaign.id} value={campaign.id}>
                      {campaign.name} ({campaign.brands?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          <Button onClick={createBatch}>
            <Plus className="w-4 h-4 mr-2" />
            Create Batch
          </Button>
        </CardContent>
      </Card>

      {/* Batches List */}
      <div className="grid gap-4">
        {batches.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">
                {campaigns.length === 0 
                  ? "Create a campaign first before creating batches."
                  : "No batches created yet. Create your first batch to get started."
                }
              </p>
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
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                        batch.status === 'generating' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {batch.status}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      Campaign: {batch.campaigns?.name} • {batch.qr_code_count} QR codes
                      {batch.generated_at && ` • Generated ${new Date(batch.generated_at).toLocaleDateString()}`}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteBatch(batch.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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
                  {batch.status === 'completed' && (
                    <>
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
                  <Button variant="outline">
                    View QR Codes
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default BatchManager;