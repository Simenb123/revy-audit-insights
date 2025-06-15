
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Plus, Target, AlertCircle, CheckCircle } from 'lucide-react';
import { Client } from '@/types/revio';

interface ScheduleTabProps {
  client: Client;
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'upcoming' | 'in_progress' | 'completed' | 'overdue';
  type: 'deadline' | 'meeting' | 'delivery' | 'review';
  assignedTo?: string;
  dependencies?: string[];
}

const ScheduleTab = ({ client }: ScheduleTabProps) => {
  const [selectedView, setSelectedView] = useState<'timeline' | 'calendar'>('timeline');

  // Mock data - replace with real data from your backend
  const milestones: Milestone[] = [
    {
      id: '1',
      title: 'Planleggingsmøte',
      description: 'Kickoff møte for revisjonsarbeidet',
      dueDate: '2024-06-15',
      status: 'completed',
      type: 'meeting',
      assignedTo: 'John Doe'
    },
    {
      id: '2',
      title: 'Dokumentasjon mottatt',
      description: 'Alle regnskapsdokumenter fra klient',
      dueDate: '2024-06-25',
      status: 'in_progress',
      type: 'delivery'
    },
    {
      id: '3',
      title: 'Risikovurdering ferdig',
      description: 'Fullføre initial risikovurdering',
      dueDate: '2024-07-05',
      status: 'upcoming',
      type: 'deadline',
      dependencies: ['2']
    },
    {
      id: '4',
      title: 'Utførelse av revisjonshandlinger',
      description: 'Gjennomføre detaljerte revisjonshandlinger',
      dueDate: '2024-07-20',
      status: 'upcoming',
      type: 'deadline',
      dependencies: ['3']
    },
    {
      id: '5',
      title: 'Ledelsesmøte',
      description: 'Presentasjon av foreløpige funn',
      dueDate: '2024-07-25',
      status: 'upcoming',
      type: 'meeting',
      dependencies: ['4']
    },
    {
      id: '6',
      title: 'Sluttrapport levering',
      description: 'Ferdig revisjonsrapport til klient',
      dueDate: '2024-08-10',
      status: 'upcoming',
      type: 'delivery',
      dependencies: ['5']
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Target className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting':
        return '👥';
      case 'delivery':
        return '📄';
      case 'review':
        return '🔍';
      default:
        return '📋';
    }
  };

  const upcomingMilestones = milestones.filter(m => m.status === 'upcoming' || m.status === 'in_progress');
  const completedMilestones = milestones.filter(m => m.status === 'completed');
  const overdueMilestones = milestones.filter(m => m.status === 'overdue');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Tidsplan & Milepæler</h2>
          <p className="text-muted-foreground">
            Revisjonsfremdrift og viktige datoer for {client.company_name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSelectedView('timeline')}>
            <Target className="h-4 w-4 mr-2" />
            Tidslinje
          </Button>
          <Button variant="outline" onClick={() => setSelectedView('calendar')}>
            <Calendar className="h-4 w-4 mr-2" />
            Kalender
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ny Milepæl
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Totalt</p>
                <p className="text-2xl font-bold">{milestones.length}</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Kommende</p>
                <p className="text-2xl font-bold text-blue-600">{upcomingMilestones.length}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fullført</p>
                <p className="text-2xl font-bold text-green-600">{completedMilestones.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Forsinket</p>
                <p className="text-2xl font-bold text-red-600">{overdueMilestones.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline View */}
      {selectedView === 'timeline' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Milepæler Tidslinje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>
              
              <div className="space-y-6">
                {milestones.map((milestone, index) => (
                  <div key={milestone.id} className="relative flex items-start">
                    {/* Timeline dot */}
                    <div className={`absolute left-6 w-4 h-4 rounded-full border-2 border-background ${getStatusColor(milestone.status)}`}>
                      {milestone.status === 'completed' && (
                        <CheckCircle className="h-2 w-2 text-green-600 absolute top-0.5 left-0.5" />
                      )}
                    </div>
                    
                    {/* Milestone content */}
                    <div className="ml-16 flex-1">
                      <Card className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getTypeIcon(milestone.type)}</span>
                              <h3 className="font-medium">{milestone.title}</h3>
                              <Badge className={getStatusColor(milestone.status)}>
                                {milestone.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(milestone.dueDate).toLocaleDateString('no-NO')}
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {milestone.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {milestone.assignedTo && (
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Ansvarlig: </span>
                                  <span className="font-medium">{milestone.assignedTo}</span>
                                </div>
                              )}
                              {milestone.dependencies && milestone.dependencies.length > 0 && (
                                <div className="text-xs">
                                  <span className="text-muted-foreground">Avhenger av: </span>
                                  <span className="font-medium">{milestone.dependencies.join(', ')}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex gap-1">
                              {getStatusIcon(milestone.status)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar View */}
      {selectedView === 'calendar' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Kalendervisning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Kalendervisning</h3>
              <p className="text-muted-foreground">
                Kalenderintegrasjon kommer snart. 
                Du kan i mellomtiden bruke tidslinjevisningen ovenfor.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ScheduleTab;
