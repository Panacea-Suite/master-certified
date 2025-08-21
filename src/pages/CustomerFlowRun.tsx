import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { CertificationFlow } from '@/components/certification-flow/CertificationFlow';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

export const CustomerFlowRun: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { qrId } = useParams<{ qrId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session');
    const testMode = searchParams.get('test') === 'true';
    
    if (!sessionId) {
      setError('Missing session ID in URL');
      setLoading(false);
      return;
    }

    if (!qrId) {
      setError('Missing QR ID in URL');
      setLoading(false);
      return;
    }

    // Store session info for CertificationFlow
    sessionStorage.setItem('test_qr_id', qrId);
    sessionStorage.setItem('test_mode', testMode ? 'true' : 'false');
    
    setIsTestMode(testMode);
    setLoading(false);
  }, [searchParams, qrId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading flow...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p>{error}</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {isTestMode && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
          🧪 Test Mode - Data will be saved as test data and excluded from analytics
        </div>
      )}
      <CertificationFlow />
    </div>
  );
};