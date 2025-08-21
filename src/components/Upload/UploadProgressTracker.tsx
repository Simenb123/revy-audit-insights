import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Clock, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadStep {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress?: number;
  error?: string;
  metadata?: Record<string, any>;
}

interface UploadProgressTrackerProps {
  steps: UploadStep[];
  currentStepIndex: number;
  overallProgress: number;
  title?: string;
  className?: string;
}

const UploadProgressTracker: React.FC<UploadProgressTrackerProps> = ({
  steps,
  currentStepIndex,
  overallProgress,
  title = "Upload Fremgang",
  className
}) => {
  const getStepIcon = (step: UploadStep, index: number) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'active':
        return <Upload className="w-5 h-5 text-primary animate-pulse" />;
      default:
        return (
          <div className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-medium',
            index <= currentStepIndex 
              ? 'border-primary text-primary bg-primary/10' 
              : 'border-muted-foreground text-muted-foreground'
          )}>
            {index + 1}
          </div>
        );
    }
  };

  const getStepBadge = (status: UploadStep['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400">
            Ferdig
          </Badge>
        );
      case 'error':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400">
            Feil
          </Badge>
        );
      case 'active':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400">
            Aktiv
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Venter
          </Badge>
        );
    }
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const hasErrors = steps.some(step => step.status === 'error');

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {completedSteps}/{steps.length} steg
            </span>
            {hasErrors && (
              <Badge variant="destructive" className="text-xs">
                Feil oppstod
              </Badge>
            )}
          </div>
        </CardTitle>
        <div className="space-y-2">
          <Progress value={overallProgress} className="h-2" />
          <div className="text-xs text-muted-foreground text-right">
            {Math.round(overallProgress)}% fullført
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4">
              {getStepIcon(step, index)}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{step.title}</h4>
                  {getStepBadge(step.status)}
                </div>
                
                {step.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {step.description}
                  </p>
                )}
                
                {step.status === 'active' && step.progress !== undefined && (
                  <div className="space-y-1">
                    <Progress value={step.progress} className="h-1" />
                    <div className="text-xs text-muted-foreground">
                      {Math.round(step.progress)}%
                    </div>
                  </div>
                )}
                
                {step.error && (
                  <div className="text-sm text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {step.error}
                  </div>
                )}
                
                {step.metadata && Object.keys(step.metadata).length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {Object.entries(step.metadata).map(([key, value]) => (
                      <div key={key}>
                        {key}: {String(value)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadProgressTracker;