import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, Home, RefreshCw, HelpCircle } from 'lucide-react';

interface InvalidFlowStepProps {
  error?: string | null;
}

export const InvalidFlowStep: React.FC<InvalidFlowStepProps> = ({ error }) => {
  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          
          <CardTitle className="text-2xl font-bold text-red-600">
            Invalid QR Code
          </CardTitle>
          
          <CardDescription className="text-base mt-2">
            {error || 'This QR code is not valid or has expired. Please check the code and try again.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4 text-sm">
            <h4 className="font-medium">Common causes:</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0"></div>
                <span>The QR code may have expired</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0"></div>
                <span>The code might be damaged or unreadable</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0"></div>
                <span>The product may not be from an authorized source</span>
              </li>
            </ul>
          </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
            <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              What to do next
            </h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Double-check the QR code is clear and undamaged</li>
              <li>• Try scanning again with better lighting</li>
              <li>• Contact the brand directly for support</li>
              <li>• Verify you purchased from an authorized retailer</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            
            <Button variant="outline" onClick={handleGoHome} className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 text-center">Need Support?</h4>
            <div className="space-y-2">
              <Button variant="outline" className="w-full text-sm" size="sm">
                Contact Brand Support
              </Button>
              <Button variant="ghost" className="w-full text-sm" size="sm">
                Report This Issue
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            If you believe this is an error, please contact customer support with 
            the QR code information for assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};