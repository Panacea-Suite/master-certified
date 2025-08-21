import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, AlertTriangle, XCircle, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';

interface AuthenticationStepProps {
  onNext: () => void;
  onPrev: () => void;
  onRunVerification: () => Promise<any>;
  onTrackEvent: (eventName: string, metadata?: any) => void;
  isLoading: boolean;
}

export const AuthenticationStep: React.FC<AuthenticationStepProps> = ({
  onNext,
  onPrev,
  onRunVerification,
  onTrackEvent,
  isLoading
}) => {
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted) {
      onTrackEvent('verify_started');
      setHasStarted(true);
    }
  }, [onTrackEvent, hasStarted]);

  const handleRunVerification = async () => {
    setIsVerifying(true);
    try {
      const result = await onRunVerification();
      setVerificationResult(result);
      
      // Auto-proceed based on result
      setTimeout(() => {
        onNext();
      }, 2000);
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'pass':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'warn':
        return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
      case 'fail':
        return <XCircle className="w-8 h-8 text-red-500" />;
      default:
        return <Shield className="w-8 h-8 text-primary" />;
    }
  };

  const getResultTitle = (result: string) => {
    switch (result) {
      case 'pass':
        return 'Product Verified Successfully';
      case 'warn':
        return 'Product Verified with Warnings';
      case 'fail':
        return 'Verification Failed';
      default:
        return 'Product Authentication';
    }
  };

  const getResultDescription = (result: string, reasons: string[] = []) => {
    switch (result) {
      case 'pass':
        return 'Your product has been successfully authenticated. All checks passed.';
      case 'warn':
        return `Your product is authentic but has some warnings: ${reasons.join(', ')}`;
      case 'fail':
        return `Unable to verify this product: ${reasons.join(', ')}`;
      default:
        return 'We\'ll now verify your product\'s authenticity using advanced security checks.';
    }
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'pass':
        return 'bg-green-50 border-green-200';
      case 'warn':
        return 'bg-yellow-50 border-yellow-200';
      case 'fail':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-muted/50';
    }
  };

  if (verificationResult?.result === 'fail') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            
            <CardTitle className="text-2xl font-bold text-red-600">
              Product Not Verified
            </CardTitle>
            
            <CardDescription className="text-base mt-2">
              We were unable to verify the authenticity of this product.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {verificationResult.reasons && verificationResult.reasons.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Issues found: {verificationResult.reasons.join(', ')}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3 text-sm">
              <h4 className="font-medium">What this means:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• This product may not be authentic</li>
                <li>• Contact the brand directly for assistance</li>
                <li>• Keep your receipt for reference</li>
              </ul>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Need help?</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Contact brand support for assistance with this product verification.
              </p>
              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </div>

            <Button variant="outline" onClick={onPrev} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center ${
            verificationResult ? getResultColor(verificationResult.result) : 'bg-primary/10'
          }`}>
            {isVerifying ? (
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            ) : (
              getResultIcon(verificationResult?.result)
            )}
          </div>
          
          <CardTitle className="text-2xl font-bold">
            {getResultTitle(verificationResult?.result)}
          </CardTitle>
          
          <CardDescription className="text-base mt-2">
            {getResultDescription(verificationResult?.result, verificationResult?.reasons)}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {!verificationResult && !isVerifying && (
            <>
              <div className="space-y-3 text-sm">
                <h4 className="font-medium">Verification includes:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• QR code authenticity check</li>
                  <li>• Batch validation</li>
                  <li>• Store location verification</li>
                  <li>• Expiration date validation</li>
                </ul>
              </div>

              <Button 
                onClick={handleRunVerification}
                className="w-full"
                size="lg"
              >
                Start Verification
                <Shield className="w-4 h-4 ml-2" />
              </Button>
            </>
          )}

          {isVerifying && (
            <div className="text-center space-y-4">
              <div className="animate-pulse">
                <div className="h-2 bg-primary/20 rounded-full">
                  <div className="h-2 bg-primary rounded-full w-3/4"></div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Running security checks...
              </p>
            </div>
          )}

          {verificationResult && (
            <>
              {verificationResult.batch_info && (
                <div className="space-y-3">
                  <h4 className="font-medium">Batch Information</h4>
                  <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Batch ID:</span>
                      <span className="font-mono">{verificationResult.batch_info.batch_id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{verificationResult.batch_info.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant={verificationResult.batch_info.status === 'generated' ? 'default' : 'secondary'}>
                        {verificationResult.batch_info.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}

              {verificationResult.result === 'warn' && verificationResult.reasons && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    Warnings: {verificationResult.reasons.join(', ')}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={onPrev} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <Button onClick={onNext} className="flex-1">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </>
          )}

          {!verificationResult && !isVerifying && (
            <Button variant="outline" onClick={onPrev} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};