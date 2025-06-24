
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface LoadingErrorSectionProps {
  isLoading?: boolean;
  error?: any;
}

const LoadingErrorSection: React.FC<LoadingErrorSectionProps> = ({ 
  isLoading, 
  error 
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-muted animate-pulse rounded" />
        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            Feil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Kunne ikke laste dokumentinformasjon
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default LoadingErrorSection;
