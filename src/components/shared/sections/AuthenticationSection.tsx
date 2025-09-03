import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { SectionRendererProps } from '../SectionRegistry';
import { useTemplateStyle } from '@/components/TemplateStyleProvider';

interface AuthenticationSectionProps extends SectionRendererProps {
  selectedStore?: string;
  approvedStores?: string[];
  onAuthComplete?: (result: 'pass' | 'fail') => void;
}

export const AuthenticationSection: React.FC<AuthenticationSectionProps> = ({
  section,
  selectedStore,
  approvedStores = [],
  onNavigateToPage,
  onAuthComplete,
  isPreview = false
}) => {
  const { getTemplateClasses } = useTemplateStyle();
  const [authStatus, setAuthStatus] = useState<'idle' | 'checking' | 'authentic' | 'not-authentic'>('idle');

  // Auto-start authentication when component loads or when user has selected store
  useEffect(() => {
    if (!isPreview && selectedStore && authStatus === 'idle') {
      setTimeout(() => {
        handleAuthentication();
      }, 500);
    }
  }, [selectedStore, authStatus, isPreview]);

  const handleAuthentication = () => {
    setAuthStatus('checking');
    
    // Simulate checking process
    setTimeout(() => {
      const isStoreAligned = approvedStores.some(store => 
        store.toLowerCase() === selectedStore?.toLowerCase()
      );
      
      if (isStoreAligned) {
        setAuthStatus('authentic');
        onAuthComplete?.('pass');
        // Auto-proceed only in runtime mode, not in preview
        if (!isPreview) {
          setTimeout(() => {
            onNavigateToPage?.('next');
          }, 3000);
        }
      } else {
        setAuthStatus('not-authentic');
        onAuthComplete?.('fail');
        // Stay on the not-authentic screen - no automatic navigation
      }
    }, 2000);
  };


  const getStatusIcon = () => {
    switch (authStatus) {
      case 'checking':
        return <Loader2 className="w-16 h-16 text-primary animate-spin" />;
      case 'authentic':
        return <CheckCircle className="w-16 h-16 text-green-500 animate-pulse" />;
      case 'not-authentic':
        return <XCircle className="w-16 h-16 text-red-500 animate-pulse" />;
      default:
        return <Shield className="w-16 h-16 text-primary" />;
    }
  };

  const getStatusMessage = () => {
    switch (authStatus) {
      case 'checking':
        return {
          title: 'Authenticating Product...',
          subtitle: 'Please wait while we verify your product authenticity',
          color: 'text-foreground'
        };
      case 'authentic':
        return {
          title: 'Product Authenticated!',
          subtitle: 'Your product is genuine and verified',
          color: 'text-green-600'
        };
      case 'not-authentic':
        return {
          title: 'Authentication Failed',
          subtitle: 'We could not verify this product',
          color: 'text-red-600'
        };
      default:
        return {
          title: 'Product Authentication',
          subtitle: 'Preparing to verify your product',
          color: 'text-foreground'
        };
    }
  };

  const statusMessage = getStatusMessage();

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${getTemplateClasses('section')}`}>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
            {getStatusIcon()}
          </div>
          
          <CardTitle className={`text-2xl font-bold ${statusMessage.color}`}>
            {statusMessage.title}
          </CardTitle>
          
          <p className="text-muted-foreground mt-2">
            {statusMessage.subtitle}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {authStatus === 'checking' && (
            <div className="space-y-4">
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
              </div>
              <div className="text-center text-sm text-muted-foreground space-y-1">
                <p>✓ Checking store alignment</p>
                <p>✓ Verifying product batch</p>
                <p className="opacity-50">• Confirming authenticity</p>
              </div>
            </div>
          )}

          {authStatus === 'authentic' && (
            <div className="text-center space-y-4">
              <div className="animate-bounce">
                <div className="w-12 h-12 bg-green-100 rounded-full mx-auto flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your product has been successfully verified as authentic!
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                Proceeding to product information...
              </p>
            </div>
          )}

          {authStatus === 'not-authentic' && (
            <div className="text-center space-y-4">
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  This product could not be authenticated. This product may be counterfeit or from an unauthorized retailer.
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground">
                Please contact the brand directly if you believe this is an error.
              </p>
              <Button 
                onClick={() => onNavigateToPage?.('final')}
                variant="outline" 
                className="w-full mt-4"
              >
                Close
              </Button>
            </div>
          )}

          {isPreview && authStatus === 'idle' && (
            <Button onClick={handleAuthentication} className="w-full">
              Start Authentication
              <Shield className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>

    </div>
  );
};