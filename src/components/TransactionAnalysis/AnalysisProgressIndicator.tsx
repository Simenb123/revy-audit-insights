import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { AnalysisProgress, AnalysisStep } from '@/hooks/useAnalysisProgress';

interface AnalysisProgressIndicatorProps {
  progress: AnalysisProgress;
  className?: string;
}

export function AnalysisProgressIndicator({ 
  progress, 
  className = '' 
}: AnalysisProgressIndicatorProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}t ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getStepIcon = (step: AnalysisStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStepVariant = (status: AnalysisStep['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (progress.steps.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Analysefremdrift</CardTitle>
          <Badge variant={progress.isRunning ? 'default' : 'secondary'}>
            {progress.isRunning ? 'Pågår' : 'Fullført'}
          </Badge>
        </div>
        
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total fremdrift</span>
            <span>{Math.round(progress.overallProgress)}%</span>
          </div>
          <Progress value={progress.overallProgress} className="h-2" />
          
          {/* Time Information */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {progress.estimatedTimeRemaining && progress.isRunning
                ? `Estimert tid igjen: ${formatTime(progress.estimatedTimeRemaining)}`
                : progress.startTime && !progress.isRunning
                ? `Fullført på: ${formatTime(Date.now() - progress.startTime)}`
                : ''
              }
            </span>
            <span>
              {progress.currentStep && `Gjeldende: ${progress.steps.find(s => s.id === progress.currentStep)?.label}`}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {progress.steps.map((step, index) => (
            <div key={step.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    {index + 1}.
                  </span>
                  {getStepIcon(step)}
                  <span className="text-sm font-medium">{step.label}</span>
                  <Badge variant={getStepVariant(step.status)} className="text-xs">
                    {step.status === 'pending' && 'Venter'}
                    {step.status === 'running' && 'Pågår'}
                    {step.status === 'completed' && 'Fullført'}
                    {step.status === 'error' && 'Feil'}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  {step.status === 'running' && (
                    <span>{Math.round(step.progress)}%</span>
                  )}
                  {step.status === 'completed' && step.startTime && step.endTime && (
                    <span>{formatTime(step.endTime - step.startTime)}</span>
                  )}
                </div>
              </div>
              
              {/* Step Progress Bar */}
              {(step.status === 'running' || step.status === 'completed') && (
                <Progress 
                  value={step.progress} 
                  className="h-1.5" 
                />
              )}
              
              {/* Error Message */}
              {step.status === 'error' && step.error && (
                <div className="ml-6 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  {step.error}
                </div>
              )}
              
              {/* Sub-steps */}
              {step.subSteps && step.subSteps.length > 0 && (
                <div className="ml-6 space-y-1">
                  {step.subSteps.map((subStep) => (
                    <div key={subStep.id} className="flex items-center space-x-2 text-xs">
                      {getStepIcon(subStep)}
                      <span className="text-muted-foreground">{subStep.label}</span>
                      {subStep.status === 'running' && (
                        <span className="text-muted-foreground">({Math.round(subStep.progress)}%)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}