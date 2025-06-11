
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Clock, User, ArrowRight, Star } from 'lucide-react';

interface WorkItem {
  id: string;
  title: string;
  clientName: string;
  type: 'review' | 'action' | 'meeting' | 'deadline';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  estimatedTime: number; // in hours
  status: 'pending' | 'in_progress' | 'overdue';
}

const PersonalizedWorkQueue = () => {
  // Mock data - replace with real user-specific work items
  const workItems: WorkItem[] = [
    {
      id: '1',
      title: 'Gjennomgå risikovurdering',
      clientName: 'TechStart AS',
      type: 'review',
      priority: 'high',
      dueDate: '2024-06-12',
      estimatedTime: 2,
      status: 'overdue'
    },
    {
      id: '2',
      title: 'Kontantstrøm analyse',
      clientName: 'Retail Norge',
      type: 'action',
      priority: 'high',
      dueDate: '2024-06-13',
      estimatedTime: 4,
      status: 'pending'
    },
    {
      id: '3',
      title: 'Møte med klientledelse',
      clientName: 'Marine Solutions',
      type: 'meeting',
      priority: 'medium',
      dueDate: '2024-06-14',
      estimatedTime: 1,
      status: 'pending'
    },
    {
      id: '4',
      title: 'Revisjonsrapport levering',
      clientName: 'Green Energy AS',
      type: 'deadline',
      priority: 'high',
      dueDate: '2024-06-15',
      estimatedTime: 3,
      status: 'in_progress'
    },
    {
      id: '5',
      title: 'Dokumentasjon review',
      clientName: 'Food Corp',
      type: 'review',
      priority: 'low',
      dueDate: '2024-06-18',
      estimatedTime: 1.5,
      status: 'pending'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'review':
        return '🔍';
      case 'action':
        return '⚡';
      case 'meeting':
        return '👥';
      case 'deadline':
        return '🎯';
      default:
        return '📋';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue':
        return 'text-red-600 bg-red-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getDaysUntilDue = (dueDate: string) => {
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'I dag';
    if (days === 1) return 'I morgen';
    if (days < 0) return `${Math.abs(days)} dag${Math.abs(days) === 1 ? '' : 'er'} forsinket`;
    return `${days} dag${days === 1 ? '' : 'er'}`;
  };

  const totalEstimatedTime = workItems.reduce((sum, item) => sum + item.estimatedTime, 0);
  const highPriorityItems = workItems.filter(item => item.priority === 'high').length;
  const overdueItems = workItems.filter(item => item.status === 'overdue').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Min Arbeidsdag
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {totalEstimatedTime}t estimert
            </Badge>
            {overdueItems > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overdueItems} forsinket
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{workItems.length} oppgaver</span>
          <span>{highPriorityItems} høy prioritet</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {workItems.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-lg border transition-all hover:shadow-sm ${
              item.status === 'overdue' ? 'border-red-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-lg">{getTypeIcon(item.type)}</span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{item.title}</h4>
                    <Badge 
                      variant={getPriorityColor(item.priority) as any}
                      className="text-xs"
                    >
                      {item.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.clientName}
                  </p>
                  
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{item.estimatedTime}t</span>
                    </div>
                    <div className={`px-2 py-1 rounded ${getStatusColor(item.status)}`}>
                      {getDaysUntilDue(item.dueDate)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {item.priority === 'high' && (
                  <Star className="h-4 w-4 text-orange-500" />
                )}
                <Button variant="ghost" size="sm">
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        
        <div className="pt-2">
          <Button variant="outline" className="w-full">
            Se alle oppgaver ({workItems.length})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalizedWorkQueue;
