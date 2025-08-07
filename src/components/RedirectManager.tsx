import React, { useState } from 'react';
import { ExternalLink, Edit3, Save, X, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';

interface RedirectRule {
  id: string;
  qrCodeId: string;
  qrCodeName: string;
  currentUrl: string;
  isEditing: boolean;
  lastUpdated: Date;
  clicks: number;
}

export const RedirectManager = () => {
  const [redirects, setRedirects] = useState<RedirectRule[]>([
    {
      id: 'redirect001',
      qrCodeId: 'qr001',
      qrCodeName: 'Product Authentication Demo',
      currentUrl: 'https://certified-platform.com/verify/qr001',
      isEditing: false,
      lastUpdated: new Date('2024-01-15'),
      clicks: 127
    },
    {
      id: 'redirect002',
      qrCodeId: 'qr002',
      qrCodeName: 'Premium Collection QR',
      currentUrl: 'https://certified-platform.com/verify/qr002',
      isEditing: false,
      lastUpdated: new Date('2024-01-20'),
      clicks: 89
    },
    {
      id: 'redirect003',
      qrCodeId: 'qr003',
      qrCodeName: 'Limited Edition Products',
      currentUrl: 'https://certified-platform.com/verify/qr003',
      isEditing: false,
      lastUpdated: new Date('2024-01-22'),
      clicks: 234
    }
  ]);

  const [editingUrl, setEditingUrl] = useState('');

  const startEditing = (redirect: RedirectRule) => {
    setRedirects(redirects.map(r => 
      r.id === redirect.id 
        ? { ...r, isEditing: true }
        : { ...r, isEditing: false }
    ));
    setEditingUrl(redirect.currentUrl);
  };

  const saveRedirect = (redirectId: string) => {
    if (!editingUrl.trim()) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid redirect URL",
        variant: "destructive"
      });
      return;
    }

    setRedirects(redirects.map(r => 
      r.id === redirectId 
        ? { 
            ...r, 
            currentUrl: editingUrl,
            isEditing: false,
            lastUpdated: new Date()
          }
        : r
    ));
    
    setEditingUrl('');
    toast({
      title: "Redirect Updated",
      description: "QR code redirect URL has been successfully updated",
    });
  };

  const cancelEditing = (redirectId: string) => {
    setRedirects(redirects.map(r => 
      r.id === redirectId 
        ? { ...r, isEditing: false }
        : r
    ));
    setEditingUrl('');
  };

  const testRedirect = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Redirect Management</h1>
        <p className="text-foreground/60">Manage and update QR code redirect destinations</p>
      </div>

      {/* Redirects List */}
      <div className="space-y-4">
        {redirects.map((redirect) => (
          <Card key={redirect.id}>
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-foreground">{redirect.qrCodeName}</h3>
                    <p className="text-sm text-muted-foreground">QR Code ID: {redirect.qrCodeId}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {redirect.clicks} clicks
                    </span>
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Active</span>
                  </div>
                </div>

                {/* URL Section */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">Current Redirect URL</label>
                  
                  {redirect.isEditing ? (
                    <div className="space-y-3">
                      <Input
                        value={editingUrl}
                        onChange={(e) => setEditingUrl(e.target.value)}
                        placeholder="Enter redirect URL..."
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          onClick={() => saveRedirect(redirect.id)}
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => cancelEditing(redirect.id)}
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-muted/50 p-3 rounded-lg">
                        <code className="text-sm font-mono text-foreground break-all">
                          {redirect.currentUrl}
                        </code>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => startEditing(redirect)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => testRedirect(redirect.currentUrl)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t border-border">
                  <span>Last updated: {redirect.lastUpdated.toLocaleDateString()}</span>
                  <span>Total redirects: {redirect.clicks}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Redirect */}
      <Card className="bg-muted/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            Add New QR Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To create a new redirect rule, first generate a QR code in the QR Generator section.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};