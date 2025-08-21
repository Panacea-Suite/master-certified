import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ArrowRight } from 'lucide-react';
import type { FlowSession } from '@/hooks/useCertificationFlow';

interface WelcomeStepProps {
  session: FlowSession | null;
  onNext: () => void;
  onTrackEvent: (eventName: string, metadata?: any) => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  session,
  onNext,
  onTrackEvent
}) => {
  const handleStartVerification = () => {
    onTrackEvent('welcome_cta_clicked', {
      session_id: session?.id,
      campaign_id: session?.campaign.id,
      brand_id: session?.brand.id
    });
    onNext();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          {session?.brand.logo_url && (
            <div className="mx-auto mb-4 w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center">
              <img 
                src={session.brand.logo_url} 
                alt={`${session.brand.name} logo`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          
          <CardTitle className="text-2xl font-bold">
            Welcome to {session?.brand.name || 'Brand'} Certification
          </CardTitle>
          
          <CardDescription className="text-base mt-2">
            Verify the authenticity of your product and access exclusive content, 
            certificates of analysis, and brand information.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {session?.campaign.name && (
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <h3 className="font-medium text-sm text-muted-foreground">Product Campaign</h3>
              <p className="font-semibold">{session.campaign.name}</p>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>Verify product authenticity</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>Access certificates & test results</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span>Get exclusive brand content</span>
            </div>
          </div>

          <Button 
            onClick={handleStartVerification} 
            className="w-full" 
            size="lg"
          >
            Start Verification
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            This process will take less than 2 minutes to complete
          </p>
        </CardContent>
      </Card>
    </div>
  );
};