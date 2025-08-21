import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Play, CheckCircle, Clock, Target, Award } from 'lucide-react';
import { TrainingSession, SessionProgress } from '@/hooks/useTrainingSessions';

interface TrainingSessionCardProps {
  session: TrainingSession;
  progress?: SessionProgress | null;
  isLocked: boolean;
  onStart: (sessionId: string) => void;
  onContinue: (sessionId: string) => void;
}

export const TrainingSessionCard: React.FC<TrainingSessionCardProps> = ({
  session,
  progress,
  isLocked,
  onStart,
  onContinue
}) => {
  const getStatusIcon = () => {
    if (isLocked) return <Lock className="h-4 w-4" />;
    if (progress?.status === 'completed') return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (progress?.status === 'in_progress') return <Play className="h-4 w-4 text-blue-600" />;
    return <Target className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (isLocked) return 'Låst';
    if (progress?.status === 'completed') return 'Fullført';
    if (progress?.status === 'in_progress') return 'Pågående';
    return 'Ikke startet';
  };

  const getStatusColor = () => {
    if (isLocked) return 'secondary';
    if (progress?.status === 'completed') return 'default';
    if (progress?.status === 'in_progress') return 'default';
    return 'outline';
  };

  const getTotalScore = () => {
    if (!progress?.score) return 0;
    const score = progress.score;
    return Math.round(
      ((score.coverage || 0) + (score.risks || 0) + (score.time || 0)) / 3 * 100
    );
  };

  return (
    <Card className={`${isLocked ? 'opacity-60' : ''} hover:shadow-md transition-shadow`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-medium">
              Sesjon {session.session_index}
            </Badge>
            <Badge variant={getStatusColor() as any} className="text-xs">
              {getStatusIcon()}
              <span className="ml-1">{getStatusText()}</span>
            </Badge>
          </div>
          {progress?.status === 'completed' && (
            <div className="flex items-center gap-1 text-sm text-green-600">
              <Award className="h-4 w-4" />
              <span>{getTotalScore()}%</span>
            </div>
          )}
        </div>
        <CardTitle className="text-lg">{session.title}</CardTitle>
        <CardDescription className="text-sm">
          {session.summary}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Goals */}
          {session.goals && session.goals.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Læringsmål:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {session.goals.slice(0, 3).map((goal, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{goal}</span>
                  </li>
                ))}
                {session.goals.length > 3 && (
                  <li className="text-xs italic">
                    +{session.goals.length - 3} flere mål...
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Progress Info */}
          {progress && !isLocked && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{progress.time_spent_minutes} min</span>
              </div>
              {progress.status === 'completed' && progress.score && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span>Dekning: {Math.round((progress.score.coverage || 0) * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>Risiko: {Math.round((progress.score.risks || 0) * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Tid: {Math.round((progress.score.time || 0) * 100)}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            {isLocked ? (
              <Button disabled variant="outline" className="w-full">
                <Lock className="h-4 w-4 mr-2" />
                Ikke tilgjengelig
              </Button>
            ) : progress?.status === 'in_progress' ? (
              <Button 
                onClick={() => onContinue(session.id)} 
                className="w-full"
                variant="default"
              >
                <Play className="h-4 w-4 mr-2" />
                Fortsett sesjon
              </Button>
            ) : progress?.status === 'completed' ? (
              <Button 
                onClick={() => onContinue(session.id)} 
                variant="outline" 
                className="w-full"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Se resultater
              </Button>
            ) : (
              <Button 
                onClick={() => onStart(session.id)} 
                className="w-full"
              >
                <Target className="h-4 w-4 mr-2" />
                Start sesjon
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};