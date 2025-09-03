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
  authConfig?: any; // Configuration from the sub-page manager
  authState?: 'idle' | 'checking' | 'authentic' | 'not-authentic'; // Force specific state for preview
}

export const AuthenticationSection: React.FC<AuthenticationSectionProps> = ({
  section,
  selectedStore,
  approvedStores = [],
  onNavigateToPage,
  onAuthComplete,
  isPreview = false,
  authConfig, // New prop for authentication configuration
  authState // Forced state for preview mode
}) => {
  const { getTemplateClasses } = useTemplateStyle();
  const [authStatus, setAuthStatus] = useState<'idle' | 'checking' | 'authentic' | 'not-authentic'>('idle');

  // Use forced authState in preview mode, otherwise use internal state
  const currentAuthStatus = authState || authStatus;
  
  console.log('🔍 AuthenticationSection - authState prop:', authState, 'internal authStatus:', authStatus, 'final currentAuthStatus:', currentAuthStatus);

  // Get sub-page configurations
  const getSubPageConfig = (type: 'idle' | 'checking' | 'authentic' | 'not-authentic') => {
    return authConfig?.subPages?.[`auth-${type}`] || {};
  };

  // Auto-start authentication when component loads or when user has selected store
  useEffect(() => {
    if (!isPreview && selectedStore && authStatus === 'idle') {
      // Start immediately without delay to avoid showing the button
      handleAuthentication();
    }
  }, [selectedStore, authStatus, isPreview]);

  // Initialize with checking state if conditions are met
  useEffect(() => {
    if (!isPreview && selectedStore && authStatus === 'idle') {
      setAuthStatus('checking');
    }
  }, [selectedStore, isPreview]);

  const handleAuthentication = () => {
    setAuthStatus('checking');
    
    // Add smooth animation transition
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
    const currentConfig = getSubPageConfig(currentAuthStatus);
    
    switch (currentAuthStatus) {
      case 'checking':
        return <Loader2 
          className="w-16 h-16 animate-spin" 
          style={{ color: currentConfig.progressColor || '#3b82f6' }}
        />;
      case 'authentic':
        return <CheckCircle className="w-16 h-16 text-green-500 animate-pulse" />;
      case 'not-authentic':
        return <XCircle className="w-16 h-16 text-red-500 animate-pulse" />;
      default:
        return <Shield className="w-16 h-16 text-primary" />;
    }
  };

  const getStatusMessage = () => {
    const idleConfig = getSubPageConfig('idle');
    const checkingConfig = getSubPageConfig('checking');
    const authenticConfig = getSubPageConfig('authentic');
    const notAuthenticConfig = getSubPageConfig('not-authentic');

    switch (currentAuthStatus) {
      case 'checking':
        return {
          title: checkingConfig.title || 'Authenticating Product...',
          subtitle: checkingConfig.subtitle || 'Please wait while we verify your product authenticity',
          color: checkingConfig.titleColor || 'text-foreground'
        };
      case 'authentic':
        return {
          title: authenticConfig.title || 'Product Authenticated!',
          subtitle: authenticConfig.subtitle || 'Your product is genuine and verified',
          color: authenticConfig.titleColor || 'text-green-600'
        };
      case 'not-authentic':
        return {
          title: notAuthenticConfig.title || 'Product Not Authentic',
          subtitle: notAuthenticConfig.subtitle || 'This product could not be authenticated',
          color: notAuthenticConfig.titleColor || 'text-red-600'
        };
      default:
        return {
          title: idleConfig.title || 'Product Authentication',
          subtitle: idleConfig.subtitle || 'Preparing to verify your product',
          color: idleConfig.titleColor || 'text-foreground'
        };
    }
  };

  const statusMessage = getStatusMessage();
  const currentConfig = getSubPageConfig(currentAuthStatus);

  return (
    <div 
      className={`min-h-screen flex items-center justify-center p-4 ${getTemplateClasses('section')}`}
      style={{ backgroundColor: currentConfig.backgroundColor || '#ffffff' }}
    >
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center">
            {getStatusIcon()}
          </div>
          
          <CardTitle 
            className={`text-2xl font-bold`}
            style={{ color: currentConfig.titleColor || statusMessage.color }}
          >
            {statusMessage.title}
          </CardTitle>
          
          <p 
            className="text-lg mt-2"
            style={{ color: currentConfig.subtitleColor || '#6b7280' }}
          >
            {statusMessage.subtitle}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentAuthStatus === 'checking' && (
            <div className="space-y-4 animate-fade-in">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-2 rounded-full animate-pulse" 
                  style={{ 
                    width: '75%',
                    backgroundColor: currentConfig.progressColor || '#3b82f6'
                  }}
                ></div>
              </div>
              <div className="text-center text-sm text-muted-foreground space-y-1 animate-fade-in">
                <p className="animate-fade-in">✓ Checking store alignment</p>
                <p className="animate-fade-in" style={{ animationDelay: '0.3s' }}>✓ Verifying product batch</p>
                <p className="opacity-50 animate-fade-in" style={{ animationDelay: '0.6s' }}>• Confirming authenticity</p>
              </div>
            </div>
          )}

          {currentAuthStatus === 'authentic' && (
            <div className="text-center space-y-4 animate-scale-in">
              <div className="animate-bounce">
                <div className="w-12 h-12 bg-green-100 rounded-full mx-auto flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <Alert className="border-green-200 bg-green-50 animate-fade-in">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your product has been successfully verified as authentic!
                </AlertDescription>
              </Alert>
              <p className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.2s' }}>
                Proceeding to product information...
              </p>
            </div>
          )}

          {currentAuthStatus === 'not-authentic' && (
            <div className="text-center space-y-4 animate-scale-in">
              <Alert className="border-red-200 bg-red-50 animate-fade-in">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription style={{ color: currentConfig.titleColor || '#dc2626' }}>
                  {currentConfig.failureMessage || 'This product could not be authenticated. This product may be counterfeit or from an unauthorized retailer.'}
                </AlertDescription>
              </Alert>
              <p className="text-sm animate-fade-in" style={{ 
                animationDelay: '0.2s',
                color: currentConfig.subtitleColor || '#6b7280' 
              }}>
                {currentConfig.contactMessage || 'Please contact the brand directly if you believe this is an error.'}
              </p>
              <Button 
                onClick={() => onNavigateToPage?.('final')}
                variant="outline" 
                className="w-full mt-4 animate-fade-in hover-scale"
                style={{ 
                  animationDelay: '0.4s',
                  backgroundColor: currentConfig.buttonColor || '#6b7280',
                  color: currentConfig.buttonTextColor || '#ffffff'
                }}
              >
                {currentConfig.buttonText || 'Close'}
              </Button>
            </div>
          )}

          {isPreview && currentAuthStatus === 'idle' && (
            <Button 
              onClick={handleAuthentication} 
              className="w-full"
              style={{
                backgroundColor: currentConfig.buttonColor || '#3b82f6',
                color: currentConfig.buttonTextColor || '#ffffff'
              }}
            >
              {currentConfig.buttonText || 'Start Authentication'}
              <Shield className="w-4 h-4 ml-2" />
            </Button>
          )}
        </CardContent>
      </Card>

    </div>
  );
};