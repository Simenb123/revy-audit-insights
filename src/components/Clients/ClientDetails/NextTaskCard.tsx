import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, Clock, AlertCircle } from 'lucide-react';
import { Client } from '@/types/revio';

interface NextTaskCardProps {
  client: Client;
}

const NextTaskCard = ({ client }: NextTaskCardProps) => {
  // Mock data for next task - this would come from actual audit actions/tasks
  const getNextTask = () => {
    switch (client.phase) {
      case 'overview':
        return {
          title: 'Oppdragsvurdering',
          description: 'Gjennomfør aksept- og fortsettelsesprosedyrer',
          priority: 'high' as const,
          dueDate: '15. januar 2024'
        };
      case 'engagement':
        return {
          title: 'Planlegg revisjonsstrategien',
          description: 'Utvikle revisjonsplan og identifiser risikoområder',
          priority: 'medium' as const,
          dueDate: '30. januar 2024'
        };
      case 'planning':
        return {
          title: 'Varetelling 1',
          description: 'Utfør første varetelling og dokumenter prosedyrer',
          priority: 'high' as const,
          dueDate: '10. februar 2024'
        };
      case 'execution':
        return {
          title: 'Substanstesting',
          description: 'Fullfør detaljerte substanstester for hovedposter',
          priority: 'medium' as const,
          dueDate: '28. februar 2024'
        };
      case 'completion':
        return {
          title: 'Ferdigstill rapport',
          description: 'Gjennomgå og ferdigstill revisjonsrapport',
          priority: 'high' as const,
          dueDate: '15. mars 2024'
        };
      default:
        return null;
    }
  };

  const nextTask = getNextTask();

  if (!nextTask) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Neste oppgave
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Alle oppgaver fullført</p>
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return AlertCircle;
      case 'medium': return Clock;
      case 'low': return Target;
    }
  };

  const PriorityIcon = getPriorityIcon(nextTask.priority);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4" />
          Neste oppgave
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{nextTask.title}</h3>
          <Badge className={getPriorityColor(nextTask.priority)} variant="secondary">
            <PriorityIcon className="w-3 h-3 mr-1" />
            {nextTask.priority === 'high' ? 'Høy' : nextTask.priority === 'medium' ? 'Middels' : 'Lav'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{nextTask.description}</p>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          Frist: {nextTask.dueDate}
        </div>
      </CardContent>
    </Card>
  );
};

export default NextTaskCard;