import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface StableErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface StableErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  description?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Enhanced Error Boundary specifically designed to handle React Error #310
 * and other hook-related errors that occur during rapid state changes.
 */
class StableErrorBoundary extends Component<StableErrorBoundaryProps, StableErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: StableErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): StableErrorBoundaryState {
    // Check if this is the React Error #310 (minified React error about hook call order)
    const isHookError = error.message?.includes('Minified React error #310') || 
                       error.message?.includes('Invalid hook call') ||
                       error.message?.includes('Cannot read properties of null');
    
    console.error('[StableErrorBoundary] Caught error:', {
      message: error.message,
      isHookError,
      stack: error.stack
    });

    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[StableErrorBoundary] Error details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Call the error handler if provided
    this.props.onError?.(error, errorInfo);

    // For hook-related errors, automatically retry after a short delay
    if (error.message?.includes('Minified React error #310') || 
        error.message?.includes('Invalid hook call')) {
      console.log('[StableErrorBoundary] Detected React Error #310, scheduling automatic retry...');
      
      this.retryTimeoutId = setTimeout(() => {
        console.log('[StableErrorBoundary] Automatic retry triggered');
        this.handleRetry();
      }, 1000);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    console.log('[StableErrorBoundary] Manual retry triggered');
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Check if a custom fallback is provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {this.props.title || 'Midlertidig feil'}
            </CardTitle>
            <CardDescription>
              {this.props.description || 'En feil oppstod under lasting av komponenten. Dette er vanligvis midlertidig.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={this.handleRetry}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Prøv igjen
            </Button>
            {this.state.error?.message && (
              <details className="mt-4">
                <summary className="text-sm text-muted-foreground cursor-pointer">
                  Tekniske detaljer
                </summary>
                <pre className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default StableErrorBoundary;