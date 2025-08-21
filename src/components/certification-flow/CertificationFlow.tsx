import React, { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCertificationFlow } from '@/hooks/useCertificationFlow';
import { WelcomeStep } from './WelcomeStep';
import { StoreSelectorStep } from './StoreSelectorStep';
import { UserLoginStep } from './UserLoginStep';
import { AuthenticationStep } from './AuthenticationStep';
import { FinalPageStep } from './FinalPageStep';
import { InvalidFlowStep } from './InvalidFlowStep';
import { Loader2 } from 'lucide-react';

export const CertificationFlow: React.FC = () => {
  const { qrId } = useParams<{ qrId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const {
    currentStep,
    sessionId,
    session,
    storeMetadata,
    marketingOptIn,
    isLoading,
    error,
    user,
    startFlow,
    updateStore,
    linkUser,
    runVerification,
    refreshSession,
    trackEvent,
    goToNextStep,
    goToPrevStep,
    goToStep,
    setMarketingOptIn,
    setError
  } = useCertificationFlow();

  // Initialize flow on component mount (session-first logic)
  useEffect(() => {
    const sessionParam = searchParams.get('session');
    if (currentStep === 'scan') {
      if (sessionParam) {
        startFlow(undefined, sessionParam);
      } else if (qrId) {
        startFlow(qrId);
      }
    }
  }, [qrId, searchParams, currentStep]);

  // Redirect to home if neither session nor QR ID is provided
  useEffect(() => {
    const sessionParam = searchParams.get('session');
    if (!qrId && !sessionParam) {
      navigate('/');
    }
  }, [qrId, searchParams, navigate]);

  if (isLoading && currentStep === 'scan') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading verification flow...</p>
        </div>
      </div>
    );
  }

  if (currentStep === 'invalid') {
    return <InvalidFlowStep error={error} />;
  }

  switch (currentStep) {
    case 'welcome':
      return (
        <WelcomeStep
          session={session}
          onNext={goToNextStep}
          onTrackEvent={trackEvent}
        />
      );

    case 'store_selector':
      return (
        <StoreSelectorStep
          onNext={goToNextStep}
          onPrev={goToPrevStep}
          onUpdateStore={updateStore}
          onTrackEvent={trackEvent}
          isLoading={isLoading}
        />
      );

    case 'user_login':
      return (
        <UserLoginStep
          session={session}
          marketingOptIn={marketingOptIn}
          onNext={goToNextStep}
          onPrev={goToPrevStep}
          onLinkUser={linkUser}
          onTrackEvent={trackEvent}
          onSetMarketingOptIn={setMarketingOptIn}
          isLoading={isLoading}
        />
      );

    case 'authentication':
      return (
        <AuthenticationStep
          onNext={goToNextStep}
          onPrev={goToPrevStep}
          onRunVerification={runVerification}
          onTrackEvent={trackEvent}
          isLoading={isLoading}
        />
      );

    case 'final_page':
      return (
        <FinalPageStep
          session={session}
          onTrackEvent={trackEvent}
        />
      );

    default:
      return <InvalidFlowStep error="Unknown step in certification flow" />;
  }
};