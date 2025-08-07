import React, { useState } from 'react';
import { QrCode, Plus, Copy, ExternalLink } from 'lucide-react';
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from '@/components/ui/neu-card';
import { NeuButton } from '@/components/ui/neu-button';
import { NeuInput } from '@/components/ui/neu-input';
import { toast } from '@/hooks/use-toast';

interface QRCode {
  id: string;
  name: string;
  redirectUrl: string;
  qrUrl: string;
  scans: number;
  created: Date;
}

export const QRCodeGenerator = () => {
  const [codes, setCodes] = useState<QRCode[]>([
    {
      id: 'qr001',
      name: 'Product Authentication Demo',
      redirectUrl: 'https://certified-platform.com/verify/qr001',
      qrUrl: 'https://certified-platform.com/qr/qr001',
      scans: 127,
      created: new Date('2024-01-15')
    },
    {
      id: 'qr002', 
      name: 'Premium Collection QR',
      redirectUrl: 'https://certified-platform.com/verify/qr002',
      qrUrl: 'https://certified-platform.com/qr/qr002',
      scans: 89,
      created: new Date('2024-01-20')
    }
  ]);

  const [newQRName, setNewQRName] = useState('');
  const [newRedirectUrl, setNewRedirectUrl] = useState('');

  const generateQRCode = () => {
    if (!newQRName || !newRedirectUrl) {
      toast({
        title: "Missing Information",
        description: "Please fill in both QR name and redirect URL",
        variant: "destructive"
      });
      return;
    }

    const newQR: QRCode = {
      id: `qr${String(codes.length + 1).padStart(3, '0')}`,
      name: newQRName,
      redirectUrl: newRedirectUrl,
      qrUrl: `https://certified-platform.com/qr/qr${String(codes.length + 1).padStart(3, '0')}`,
      scans: 0,
      created: new Date()
    };

    setCodes([newQR, ...codes]);
    setNewQRName('');
    setNewRedirectUrl('');
    
    toast({
      title: "QR Code Generated",
      description: `Successfully created QR code: ${newQR.name}`,
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "QR URL has been copied to your clipboard",
    });
  };

  return (
    <div className="space-y-6">
      {/* Generation Form */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle className="flex items-center gap-3">
            <div className="neu-subtle p-3 rounded-xl">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            Generate New QR Code
          </NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">QR Code Name</label>
            <NeuInput
              placeholder="e.g., Product Authentication QR"
              value={newQRName}
              onChange={(e) => setNewQRName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Redirect URL</label>
            <NeuInput
              placeholder="https://your-site.com/verify"
              value={newRedirectUrl}
              onChange={(e) => setNewRedirectUrl(e.target.value)}
            />
          </div>

          <NeuButton variant="primary" onClick={generateQRCode} className="w-full">
            <QrCode className="w-4 h-4" />
            Generate QR Code
          </NeuButton>
        </NeuCardContent>
      </NeuCard>

      {/* QR Codes List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">Generated QR Codes</h3>
        {codes.map((code) => (
          <NeuCard key={code.id}>
            <NeuCardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div className="neu-subtle p-2 rounded-lg">
                      <QrCode className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{code.name}</h4>
                      <p className="text-sm text-foreground/60">ID: {code.id}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-foreground/60">QR URL:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-surface-dark/50 px-2 py-1 rounded text-xs font-mono flex-1 truncate">
                          {code.qrUrl}
                        </code>
                        <NeuButton 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(code.qrUrl)}
                        >
                          <Copy className="w-3 h-3" />
                        </NeuButton>
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-foreground/60">Redirect:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="bg-surface-dark/50 px-2 py-1 rounded text-xs font-mono flex-1 truncate">
                          {code.redirectUrl}
                        </code>
                        <NeuButton 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => window.open(code.redirectUrl, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </NeuButton>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-foreground/60">
                    <span>Scans: <strong className="text-primary">{code.scans}</strong></span>
                    <span>Created: {code.created.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </NeuCardContent>
          </NeuCard>
        ))}
      </div>
    </div>
  );
};