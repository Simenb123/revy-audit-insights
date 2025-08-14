import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Widget } from '@/contexts/WidgetManagerContext';
import { AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: Date;
  actionRequired: boolean;
}

interface AlertsWidgetProps {
  widget: Widget;
}

export function AlertsWidget({ widget }: AlertsWidgetProps) {
  // Mock data - in real implementation this would come from API
  const mockAlerts: Alert[] = [
    {
      id: '1',
      type: 'warning',
      title: 'Budsjettoverskridelse',
      description: 'Markedsføringskostnader har overskredet månedlig budsjett med 15%',
      severity: 'high',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      actionRequired: true
    },
    {
      id: '2',
      type: 'error',
      title: 'Manglende bilag',
      description: '3 transaksjoner mangler bilag for å fullføre avstemming',
      severity: 'high',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      actionRequired: true
    },
    {
      id: '3',
      type: 'info',
      title: 'Påminnelse: Månedlig rapportering',
      description: 'Månedlig rapport må leveres innen 5 dager',
      severity: 'medium',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
      actionRequired: false
    },
    {
      id: '4',
      type: 'success',
      title: 'Avstemming fullført',
      description: 'Bankavstemming for september er fullført uten avvik',
      severity: 'low',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      actionRequired: false
    }
  ];

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'info':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertColor = (type: string, severity: string) => {
    if (severity === 'high') {
      return type === 'error' ? 'border-l-red-500 bg-red-50' : 'border-l-yellow-500 bg-yellow-50';
    }
    
    switch (type) {
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'info':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };

    const labels = {
      high: 'Høy',
      medium: 'Medium',
      low: 'Lav'
    };

    return (
      <Badge className={`text-xs ${colors[severity as keyof typeof colors]}`}>
        {labels[severity as keyof typeof labels]}
      </Badge>
    );
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

  const alertsByType = mockAlerts.reduce((acc, alert) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center justify-between">
          {widget.title}
          <div className="flex gap-1">
            {alertsByType.error > 0 && (
              <Badge className="bg-red-100 text-red-800 text-xs">
                {alertsByType.error} feil
              </Badge>
            )}
            {alertsByType.warning > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                {alertsByType.warning} adv.
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-3 rounded-lg border-l-4 ${getAlertColor(alert.type, alert.severity)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                      {getSeverityBadge(alert.severity)}
                      {alert.actionRequired && (
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          Handling påkrevd
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    {formatTimestamp(alert.timestamp)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {mockAlerts.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Ingen aktive varsler</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}