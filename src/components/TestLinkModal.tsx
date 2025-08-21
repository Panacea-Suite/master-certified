import React, { useState } from 'react';
import { Copy, ExternalLink, Clock, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface TestLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  testUrl: string;
  expiresIn: number; // seconds
  isEphemeralCampaign?: boolean; // for template-only tests
}

export const TestLinkModal: React.FC<TestLinkModalProps> = ({
  isOpen,
  onClose,
  testUrl,
  expiresIn,
  isEphemeralCampaign = false
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(testUrl);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Test link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const handleOpenInNewTab = () => {
    window.open(testUrl, '_blank', 'noopener,noreferrer');
  };

  const formatExpiryTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Test Flow Link Generated</DialogTitle>
          <DialogDescription>
            Open this link to experience the full user journey as an end user.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Data from this test will be saved as test data and excluded from brand analytics.
            </AlertDescription>
          </Alert>

          {isEphemeralCampaign && (
            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This creates a temporary test campaign from the template. It will be auto-cleaned after 7 days.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center space-x-2">
            <Input
              value={testUrl}
              readOnly
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="shrink-0"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Link expires in {formatExpiryTime(expiresIn)}</span>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleOpenInNewTab}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open in New Tab
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};