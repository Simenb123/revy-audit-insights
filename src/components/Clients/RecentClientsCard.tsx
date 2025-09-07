import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Building2, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useRecentClients } from '@/hooks/useRecentClients';
import { useNavigate } from 'react-router-dom';

const RecentClientsCard = () => {
  const { recentClients } = useRecentClients();
  const navigate = useNavigate();

  if (recentClients.length === 0) {
    return null;
  }

  // Show max 5 recent clients
  const displayClients = recentClients.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Siste besøkte klienter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayClients.map((client) => (
            <div
              key={client.id}
              onClick={() => navigate(client.url)}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{client.name}</p>
                  {client.orgNumber && (
                    <p className="text-xs text-muted-foreground">
                      Org.nr: {client.orgNumber}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(client.lastVisited), {
                    addSuffix: true,
                    locale: nb,
                  })}
                </span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentClientsCard;