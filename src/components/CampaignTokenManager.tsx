import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Copy, RefreshCw, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  customer_access_token: string;
  created_at: string;
  final_redirect_url?: string;
}

interface CampaignTokenManagerProps {
  campaigns: Campaign[];
  onTokenUpdate: (campaignId: string, newToken: string) => void;
}

export const CampaignTokenManager: React.FC<CampaignTokenManagerProps> = ({ 
  campaigns, 
  onTokenUpdate 
}) => {
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [regenerating, setRegenerating] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Copy failed",
        description: "Please copy manually",
        variant: "destructive",
      });
    }
  };

  const toggleTokenVisibility = (campaignId: string) => {
    setShowTokens(prev => ({
      ...prev,
      [campaignId]: !prev[campaignId]
    }));
  };

  const regenerateToken = async (campaignId: string) => {
    setRegenerating(prev => ({ ...prev, [campaignId]: true }));
    
    try {
      const newToken = crypto.randomUUID().replace(/-/g, '').substring(0, 32);
      
      const { error } = await supabase
        .from('campaigns')
        .update({ customer_access_token: newToken })
        .eq('id', campaignId);

      if (error) throw error;

      onTokenUpdate(campaignId, newToken);
      
      toast({
        title: "Token regenerated",
        description: "New customer access token has been created",
      });
    } catch (error) {
      console.error('Failed to regenerate token:', error);
      toast({
        title: "Failed to regenerate token",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setRegenerating(prev => ({ ...prev, [campaignId]: false }));
    }
  };

  const getCustomerFlowUrl = (campaign: Campaign) => {
    if (!campaign.final_redirect_url) return null;
    
    const url = new URL(campaign.final_redirect_url);
    url.searchParams.set('token', campaign.customer_access_token);
    return url.toString();
  };

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Customer Access Token Management</h3>
        <Alert>
          <AlertDescription>
            Customer access tokens are required for unauthenticated users to access campaign flows. 
            Keep these tokens secure and regenerate them if compromised.
          </AlertDescription>
        </Alert>
      </div>

      {campaigns.map((campaign) => (
        <Card key={campaign.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-medium">{campaign.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {campaign.description || 'No description'}
                </p>
              </div>
              <Badge variant="outline">Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Access Token */}
            <div className="space-y-2">
              <Label htmlFor={`token-${campaign.id}`}>Customer Access Token</Label>
              <div className="flex items-center gap-2">
                <Input
                  id={`token-${campaign.id}`}
                  type={showTokens[campaign.id] ? 'text' : 'password'}
                  value={campaign.customer_access_token}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => toggleTokenVisibility(campaign.id)}
                >
                  {showTokens[campaign.id] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(campaign.customer_access_token, 'Access token')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => regenerateToken(campaign.id)}
                  disabled={regenerating[campaign.id]}
                >
                  <RefreshCw className={`h-4 w-4 ${regenerating[campaign.id] ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Include this token in customer flow URLs as a query parameter: ?token={campaign.customer_access_token}
              </p>
            </div>

            {/* Customer Flow URL */}
            {campaign.final_redirect_url && (
              <div className="space-y-2">
                <Label>Customer Flow URL (with token)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={getCustomerFlowUrl(campaign) || ''}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(getCustomerFlowUrl(campaign) || '', 'Flow URL')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  {getCustomerFlowUrl(campaign) && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(getCustomerFlowUrl(campaign) || '', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Token Usage Instructions */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs">
                  View integration instructions
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Customer Access Token Integration</DialogTitle>
                  <DialogDescription>
                    How to use this token in your customer flows
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">QR Code URLs</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      When generating QR codes, the token will be automatically appended to flow URLs.
                    </p>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`// QR redirect will automatically append token
https://your-domain.com/flow/123?token=${campaign.customer_access_token}`}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Edge Function Access</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      The token can be passed via header or query parameter:
                    </p>
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
{`// Via header
fetch('/functions/v1/flow-handler/123/abc', {
  headers: { 'x-customer-token': '${campaign.customer_access_token}' }
})

// Via query parameter  
fetch('/functions/v1/flow-handler/123/abc?token=${campaign.customer_access_token}')`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Security Notes</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Tokens are unique per campaign</li>
                      <li>• Regenerate tokens if they become compromised</li>
                      <li>• Tokens are required for unauthenticated customer access</li>
                      <li>• Authenticated brand admins don't need tokens</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ))}

      {campaigns.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No campaigns found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};