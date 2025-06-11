
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, Clock, CheckCircle, X, Eye } from 'lucide-react';

interface Notification {
  id: string;
  type: 'urgent' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  clientName?: string;
  actionRequired?: boolean;
  isRead: boolean;
}

const IntelligentNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'urgent',
      title: 'Kritisk risikoindikator',
      message: 'Norsk AS har negative kontantstrømmer 3 måneder på rad',
      timestamp: '2 min siden',
      clientName: 'Norsk AS',
      actionRequired: true,
      isRead: false
    },
    {
      id: '2',
      type: 'warning',
      title: 'Nærende deadline',
      message: 'Revisjonsrapport for Bergen Corp forfaller om 3 dager',
      timestamp: '15 min siden',
      clientName: 'Bergen Corp',
      actionRequired: true,
      isRead: false
    },
    {
      id: '3',
      type: 'info',
      title: 'Ny regnskapsdata mottatt',
      message: 'SAF-T fil importert for Oslo Enterprise',
      timestamp: '1 time siden',
      clientName: 'Oslo Enterprise',
      actionRequired: false,
      isRead: true
    },
    {
      id: '4',
      type: 'success',
      title: 'Revisjon fullført',
      message: 'Alle revisjonshandlinger for Stavanger Ltd er godkjent',
      timestamp: '2 timer siden',
      clientName: 'Stavanger Ltd',
      actionRequired: false,
      isRead: true
    }
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'urgent':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'success':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Intelligente Varsler
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <Button variant="outline" size="sm">
            Se alle
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Ingen nye varsler</p>
          </div>
        ) : (
          notifications.slice(0, 5).map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border transition-colors ${
                !notification.isRead 
                  ? 'bg-muted/50 border-primary/20' 
                  : 'bg-background border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                {getNotificationIcon(notification.type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <Badge 
                          variant={getNotificationBadge(notification.type) as any}
                          className="text-xs"
                        >
                          {notification.type}
                        </Badge>
                        {notification.actionRequired && (
                          <Badge variant="outline" className="text-xs">
                            Handling kreves
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {notification.clientName && (
                            <span className="text-xs font-medium text-primary">
                              {notification.clientName}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {notification.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNotification(notification.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default IntelligentNotifications;
