
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Brain, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import { formatDate } from '@/lib/formatters';

interface Notification {
  id: string;
  type: 'ai_insight' | 'risk_alert' | 'prediction' | 'recommendation' | 'system';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: string;
  read: boolean;
  actionRequired: boolean;
}

const IntelligentNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'ai'>('all');

  useEffect(() => {
    // Simuler AI-genererte notifikasjoner
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'ai_insight',
        title: 'AI Innsikt: Uvanlig utgiftsmønster oppdaget',
        message: 'Nordheim AS viser 23% økning i konsulentkostnader sammenlignet med tilsvarende periode i fjor.',
        priority: 'high',
        timestamp: new Date().toISOString(),
        read: false,
        actionRequired: true
      },
      {
        id: '2',
        type: 'prediction',
        title: 'Prediksjon: Likviditetsutfordring',
        message: 'AI-modell predikerer potensielle likviditetsutfordringer for Sørland Byggverk AS i Q3.',
        priority: 'medium',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        read: false,
        actionRequired: true
      },
      {
        id: '3',
        type: 'recommendation',
        title: 'Optimeringsforslag: Automatiser bilagsføring',
        message: 'Basert på transaksjonsvolumet kan automatisering spare 15 timer per måned.',
        priority: 'low',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        read: true,
        actionRequired: false
      },
      {
        id: '4',
        type: 'risk_alert',
        title: 'Risikovarsel: Endring i kundefordringer',
        message: 'Vesentlig økning i kundefordringer eldre enn 90 dager for 3 klienter.',
        priority: 'high',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        read: false,
        actionRequired: true
      },
      {
        id: '5',
        type: 'system',
        title: 'System: Ny AI-modell tilgjengelig',
        message: 'Oppdatert risikovurderingsmodell med 12% forbedret nøyaktighet er nå aktiv.',
        priority: 'low',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        read: true,
        actionRequired: false
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ai_insight': return <Brain className="h-4 w-4" />;
      case 'risk_alert': return <AlertTriangle className="h-4 w-4" />;
      case 'prediction': return <Brain className="h-4 w-4" />;
      case 'recommendation': return <CheckCircle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ai_insight': return 'text-blue-600 bg-blue-50';
      case 'risk_alert': return 'text-red-600 bg-red-50';
      case 'prediction': return 'text-purple-600 bg-purple-50';
      case 'recommendation': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'unread') return !notif.read;
    if (filter === 'ai') return ['ai_insight', 'prediction', 'recommendation'].includes(notif.type);
    return true;
  });

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            AI Varsler
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filter buttons */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Alle ({notifications.length})
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Uleste ({unreadCount})
          </Button>
          <Button
            variant={filter === 'ai' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('ai')}
          >
            AI ({notifications.filter(n => ['ai_insight', 'prediction', 'recommendation'].includes(n.type)).length})
          </Button>
        </div>

        {/* Notifications list */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  notification.read ? 'bg-muted/50' : 'bg-background'
                } hover:bg-muted`}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${getTypeColor(notification.type)}`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <Badge className={getPriorityColor(notification.priority)}>
                      {notification.priority.toUpperCase()}
                    </Badge>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      dismissNotification(notification.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                
                <h4 className={`font-medium text-sm mb-1 ${!notification.read ? 'font-semibold' : ''}`}>
                  {notification.title}
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  {notification.message}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(notification.timestamp)}
                  </span>
                  {notification.actionRequired && (
                    <Badge variant="outline" className="text-xs">
                      Handling påkrevd
                    </Badge>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Ingen varsler funnet</p>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="pt-4 border-t">
          <Button variant="outline" size="sm" className="w-full">
            <Brain className="h-4 w-4 mr-2" />
            Generer AI-rapport
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default IntelligentNotifications;
