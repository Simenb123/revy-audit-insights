import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Loader2, 
  Play, 
  Pause, 
  RefreshCw,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface AnalysisStatusIndicatorProps {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  currentStep?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  onStart: () => void;
  onCancel: () => void;
  onRestart: () => void;
  isLoading?: boolean;
}

export const AnalysisStatusIndicator: React.FC<AnalysisStatusIndicatorProps> = ({
  status,
  progress = 0,
  currentStep,
  error,
  startedAt,
  completedAt,
  onStart,
  onCancel,
  onRestart,
  isLoading = false
}) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          label: 'Venter',
          description: 'Analyse er planlagt',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          badgeVariant: 'warning' as const
        };
      case 'running':
        return {
          icon: Loader2,
          label: 'Pågår',
          description: currentStep || 'Kjører AI-analyse...',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          badgeVariant: 'default' as const,
          animate: true
        };
      case 'completed':
        return {
          icon: CheckCircle,
          label: 'Fullført',
          description: completedAt ? `Fullført ${format(new Date(completedAt), 'dd.MM.yyyy HH:mm', { locale: nb })}` : 'Analyse fullført',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          badgeVariant: 'success' as const
        };
      case 'failed':
        return {
          icon: AlertTriangle,
          label: 'Feilet',
          description: error || 'Analyse feilet',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          badgeVariant: 'destructive' as const
        };
      case 'cancelled':
        return {
          icon: AlertTriangle,
          label: 'Avbrutt',
          description: 'Analyse ble avbrutt',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          badgeVariant: 'secondary' as const
        };
      default:
        return {
          icon: Activity,
          label: 'Ukjent',
          description: 'Ukjent status',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          badgeVariant: 'secondary' as const
        };
    }
  };

  const statusInfo = getStatusInfo();
  const IconComponent = statusInfo.icon;

  const getActions = () => {
    switch (status) {
      case 'pending':
      case 'failed':
      case 'cancelled':
        return [
          <Button key="start" onClick={onStart} disabled={isLoading} size="sm">
            <Play className="h-4 w-4 mr-2" />
            {status === 'pending' ? 'Start analyse' : 'Prøv igjen'}
          </Button>
        ];
      case 'running':
        return [
          <Button key="cancel" variant="outline" onClick={onCancel} size="sm">
            <Pause className="h-4 w-4 mr-2" />
            Avbryt
          </Button>
        ];
      case 'completed':
        return [
          <Button key="restart" variant="outline" onClick={onRestart} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Ny analyse
          </Button>
        ];
      default:
        return [];
    }
  };

  return (
    <Card className={`border-l-4 ${statusInfo.bgColor} border-l-primary`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <IconComponent 
              className={`h-5 w-5 ${statusInfo.color} ${statusInfo.animate ? 'animate-spin' : ''}`} 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">AI-Analyse</span>
                <Badge variant={statusInfo.badgeVariant}>
                  {statusInfo.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {statusInfo.description}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {getActions()}
          </div>
        </div>

        {status === 'running' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fremgang</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {currentStep && (
              <p className="text-xs text-muted-foreground">
                {currentStep}
              </p>
            )}
          </div>
        )}

        {status === 'completed' && startedAt && (
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>Startet: {format(new Date(startedAt), 'dd.MM.yyyy HH:mm', { locale: nb })}</span>
            {completedAt && (
              <span>
                Varighet: {Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 1000)}s
              </span>
            )}
          </div>
        )}

        {status === 'failed' && error && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            <strong>Feilmelding:</strong> {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};