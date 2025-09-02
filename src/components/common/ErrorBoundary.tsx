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
    this.setState({
      error,
      errorInfo: errorInfo.componentStack
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full border-destructive">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-destructive/10 rounded-lg p-4">
                <h3 className="font-semibold text-destructive mb-2">Error Message:</h3>
                <p className="text-sm text-destructive/80 font-mono">
                  {this.state.error?.message || 'Unknown error occurred'}
                </p>
              </div>
              
              {this.state.errorInfo && (
                <div className="bg-muted rounded-lg p-4">
                  <h3 className="font-semibold text-muted-foreground mb-2">Stack Trace:</h3>
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