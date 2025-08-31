import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  FileText, 
  Search, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface IntelligentLoadingFeedbackProps {
  isLoading: boolean;
  context?: string;
  isDocumentQuery?: boolean;
  hasClientDocuments?: boolean;
  enhancementApplied?: boolean;
  estimatedTime?: number;
}

interface LoadingStage {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  duration: number;
  color: string;
  description: string;
}

const IntelligentLoadingFeedback: React.FC<IntelligentLoadingFeedbackProps> = ({
  isLoading,
  context,
  isDocumentQuery = false,
  hasClientDocuments = false,
  enhancementApplied = false,
  estimatedTime = 15000
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Define loading stages based on context and features
  const getLoadingStages = (): LoadingStage[] => {
    const baseStages: LoadingStage[] = [
      {
        id: 'analyzing',
        label: 'Analyserer forespørsel',
        icon: Brain,
        duration: 2000,
        color: 'text-blue-500',
        description: 'Forstår kontekst og intent'
      }
    ];

    if (enhancementApplied) {
      baseStages.push({
        id: 'enhancing',
        label: 'Kontekstforbedring',
        icon: Sparkles,
        duration: 3000,
        color: 'text-purple-500',
        description: 'Optimaliserer prompt med AI-analyse'
      });
    }

    if (isDocumentQuery && hasClientDocuments) {
      baseStages.push({
        id: 'documents',
        label: 'Analyserer dokumenter',
        icon: FileText,
        duration: 4000,
        color: 'text-green-500',
        description: 'Leser og kategoriserer klientdokumenter'
      });
    }

    baseStages.push(
      {
        id: 'knowledge',
        label: 'Søker fagkunnskap',
        icon: Search,
        duration: 3000,
        color: 'text-orange-500',
        description: 'Finner relevante fagartikler og standarder'
      },
      {
        id: 'processing',
        label: 'Genererer svar',
        icon: Zap,
        duration: 3000,
        color: 'text-yellow-500',
        description: 'AI prosesserer informasjon og lager svar'
      }
    );

    return baseStages;
  };

  const stages = getLoadingStages();
  const totalDuration = stages.reduce((sum, stage) => sum + stage.duration, 0);

  useEffect(() => {
    if (!isLoading) {
      setCurrentStage(0);
      setProgress(0);
      setElapsedTime(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(elapsed);

      // Calculate which stage we should be in
      let cumulativeDuration = 0;
      let newStage = 0;
      
      for (let i = 0; i < stages.length; i++) {
        cumulativeDuration += stages[i].duration;
        if (elapsed < cumulativeDuration) {
          newStage = i;
          break;
        }
        newStage = i + 1;
      }

      setCurrentStage(Math.min(newStage, stages.length - 1));
      
      // Calculate progress (0-100%)
      const progressPercent = Math.min((elapsed / totalDuration) * 100, 95);
      setProgress(progressPercent);

    }, 100);

    return () => clearInterval(interval);
  }, [isLoading, totalDuration]);

  if (!isLoading) {
    return null;
  }

  const currentStageData = stages[currentStage];
  const isOverdue = elapsedTime > estimatedTime;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <currentStageData.icon className={`h-4 w-4 animate-pulse ${currentStageData.color}`} />
            <span className="font-medium text-sm">{currentStageData.label}</span>
            <Badge variant="secondary" className="text-xs">
              AI-Revy
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {Math.round(elapsedTime / 1000)}s
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {currentStageData.description}
          </p>
        </div>

        {/* Stage indicators */}
        <div className="flex items-center justify-between text-xs">
          {stages.map((stage, index) => {
            const StageIcon = stage.icon;
            const isCompleted = index < currentStage;
            const isCurrent = index === currentStage;
            
            return (
              <div
                key={stage.id}
                className={`flex flex-col items-center gap-1 ${
                  isCompleted ? 'text-green-500' : 
                  isCurrent ? stage.color : 
                  'text-muted-foreground/50'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <StageIcon className={`h-3 w-3 ${isCurrent ? 'animate-pulse' : ''}`} />
                )}
                <span className="text-xs whitespace-nowrap">
                  {stage.label.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>

        {/* Context-specific information */}
        <div className="flex flex-wrap gap-1">
          {context && (
            <Badge variant="outline" className="text-xs">
              {context}
            </Badge>
          )}
          {enhancementApplied && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
              Kontekstforbedret
            </Badge>
          )}
          {isDocumentQuery && hasClientDocuments && (
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
              Dokumentanalyse
            </Badge>
          )}
        </div>

        {/* Warning for long processing */}
        {isOverdue && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <div className="text-xs">
              <p className="font-medium text-orange-700 dark:text-orange-300">
                Tar lengre tid enn forventet
              </p>
              <p className="text-orange-600 dark:text-orange-400">
                Prosesserer store mengder data eller kompleks analyse
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IntelligentLoadingFeedback;