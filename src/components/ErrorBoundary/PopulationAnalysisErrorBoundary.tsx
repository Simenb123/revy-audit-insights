import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Info, Calendar } from 'lucide-react';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class PopulationAnalysisErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Population Analysis Error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Feil i populasjonsanalyse
            </CardTitle>
            <CardDescription>
              Det oppstod en feil under populasjonsanalysen. Dette kan skyldes:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6 mb-4 text-sm text-muted-foreground space-y-1">
              <li>Nettverksproblemer eller database-tilgang</li>
              <li>Manglende regnskapsdata for valgt periode</li>
              <li>Konfigurasjonsfeil med regnskapslinjer eller kontoer</li>
              <li>Database-funksjonsfeil (overloading eller parameterfeil)</li>
            </ul>
            
            {this.state.error && (
              <div className="bg-muted p-3 rounded text-sm font-mono mb-4 max-h-32 overflow-y-auto">
                <strong>Teknisk feilmelding:</strong><br />
                {this.state.error.message}
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs">Stack trace</summary>
                    <pre className="text-xs mt-1 whitespace-pre-wrap">{this.state.error.stack}</pre>
                  </details>
                )}
              </div>
            )}
            
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={this.handleRetry}
                variant="default"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Prøv igjen
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                Last siden på nytt
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}