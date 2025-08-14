import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Widget } from '@/contexts/WidgetManagerContext';
import { Calendar, ArrowUpRight, ArrowDownRight, Clock, User } from 'lucide-react';

interface Activity {
  id: string;
  type: 'transaction' | 'budget' | 'report' | 'approval';
  title: string;
  description: string;
  timestamp: Date;
  user: string;
  amount?: number;
  status: 'completed' | 'pending' | 'warning';
}

interface ActivityFeedWidgetProps {
  widget: Widget;
}

export function ActivityFeedWidget({ widget }: ActivityFeedWidgetProps) {
  const [showAll, setShowAll] = useState(false);

  // Mock data - in real implementation this would come from API
  const mockActivities: Activity[] = [
    {
      id: '1',
      type: 'transaction',
      title: 'Ny leverandørfaktura registrert',
      description: 'ACME Corp - Faktura #12345',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      user: 'Marie Hansen',
      amount: -15000,
      status: 'completed'
    },
    {
      id: '2',
      type: 'approval',
      title: 'Godkjenning påkrevd',
      description: 'Månedlig leverandørrapport',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      user: 'System',
      status: 'pending'
    },
    {
      id: '3',
      type: 'budget',
      title: 'Budsjettavvik oppdaget',
      description: 'Markedsføring overskrider budsjett med 12%',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
      user: 'Budsjettverktøy',
      status: 'warning'
    },
    {
      id: '4',
      type: 'report',
      title: 'Månedsrapport generert',
      description: 'September 2024 - Regnskap',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      user: 'Ole Kristiansen',
      status: 'completed'
    },
    {
      id: '5',
      type: 'transaction',
      title: 'Kundefaktura sendt',
      description: 'Kunde AS - Faktura #54321',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      user: 'Lisa Berg',
      amount: 25000,
      status: 'completed'
    }
  ];

  const displayedActivities = showAll ? mockActivities : mockActivities.slice(0, 3);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return <ArrowUpRight className="h-4 w-4" />;
      case 'budget':
        return <Calendar className="h-4 w-4" />;
      case 'report':
        return <Clock className="h-4 w-4" />;
      case 'approval':
        return <User className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `${diffMinutes} min siden`;
    } else if (diffHours < 24) {
      return `${diffHours}t siden`;
    } else {
      return `${diffDays}d siden`;
    }
  };

  const formatAmount = (amount: number) => {
    const formatted = new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));

    return amount >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-medium">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedActivities.map((activity) => (
            <div key={activity.id} className="flex gap-3 p-3 rounded-lg border">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{activity.title}</h4>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                      {activity.status === 'completed' ? 'Fullført' :
                       activity.status === 'pending' ? 'Venter' : 'Advarsel'}
                    </Badge>
                    {activity.amount && (
                      <span className={`text-xs font-medium ${
                        activity.amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatAmount(activity.amount)}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{activity.user}</span>
                  <span>•</span>
                  <span>{formatTimestamp(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
          
          {mockActivities.length > 3 && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAll(!showAll)}
              className="w-full"
            >
              {showAll ? 'Vis færre' : `Vis alle (${mockActivities.length})`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}