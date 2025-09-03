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
              Det oppstod en teknisk feil under populasjonsanalysen. Dette kan skyldes store datamengder, nettverksproblemer eller serverkonfigurasjon.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Mulige årsaker:</p>
                    <ul className="text-muted-foreground space-y-1 text-xs">
                      <li>• Manglende regnskapsdata for det valgte året</li>
                      <li>• Nettverksproblemer eller tidsavbrudd</li>
                      <li>• Alle kontoer har nullsaldo</li>
                      <li>• Ingen kontoer matcher de valgte regnskapslinjene</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button onClick={this.handleRetry} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Prøv igjen
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  Last siden på nytt
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}