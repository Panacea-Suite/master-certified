import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Enhanced logging for Supabase errors and runtime issues
    if (typeof window !== 'undefined') {
      const isTraceMode = new URLSearchParams(window.location.search).get('trace') === '1';
      
      if (isTraceMode) {
        console.error('[TRACE] ErrorBoundary Full Context:', {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack
          },
          errorInfo: errorInfo,
          url: window.location.href,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    this.setState({
      error,
      errorInfo: errorInfo.componentStack
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  // Helper to detect common error types
  getErrorType = () => {
    const errorMessage = this.state.error?.message || '';
    
    if (errorMessage.includes('Permission denied') || errorMessage.includes('RLS') || errorMessage.includes('42501')) {
      return 'rls';
    }
    if (errorMessage.includes('PGRST') || errorMessage.includes('not found')) {
      return 'notfound';
    }
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      return 'network';
    }
    return 'unknown';
  };

  getErrorSuggestion = () => {
    const errorType = this.getErrorType();
    const errorMessage = this.state.error?.message || '';
    
    switch (errorType) {
      case 'rls':
        return {
          title: 'Permission Issue',
          message: 'This appears to be a database permission error. The data may not be accessible to anonymous users.',
          action: 'Check Row Level Security policies for anonymous access'
        };
      case 'notfound':
        return {
          title: 'Data Not Found',
          message: 'The requested campaign or flow data could not be found.',
          action: 'Verify the campaign ID in the URL is correct'
        };
      case 'network':
        return {
          title: 'Network Error',
          message: 'Unable to connect to the database.',
          action: 'Check your internet connection and try again'
        };
      default:
        return {
          title: 'Runtime Error',
          message: 'An unexpected error occurred during flow execution.',
          action: 'Try reloading the page'
        };
    }
  };

  render() {
    if (this.state.hasError) {
      const errorSuggestion = this.getErrorSuggestion();
      
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full border-destructive">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-destructive">{errorSuggestion.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-destructive/10 rounded-lg p-4">
                <h3 className="font-semibold text-destructive mb-2">What happened:</h3>
                <p className="text-sm text-destructive/80 mb-2">
                  {errorSuggestion.message}
                </p>
                <p className="text-xs text-destructive/60 font-mono border-t border-destructive/20 pt-2">
                  {this.state.error?.message || 'Unknown error occurred'}
                </p>
              </div>
              
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-semibold text-muted-foreground mb-2">What to try:</h3>
                <p className="text-sm text-muted-foreground">
                  {errorSuggestion.action}
                </p>
              </div>
              
              {this.state.errorInfo && (
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-semibold text-muted-foreground mb-2">Technical Details:</h3>
                  <pre className="text-xs text-muted-foreground overflow-auto max-h-32 font-mono">
                    {this.state.errorInfo.slice(0, 500)}
                    {this.state.errorInfo.length > 500 && '...'}
                  </pre>
                </div>
              )}
              
              <div className="flex justify-center pt-4">
                <Button onClick={this.handleReload} variant="default">
                  Reload Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}