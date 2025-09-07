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

  // Show max 3 recent clients for compact display
  const displayClients = recentClients.slice(0, 3);

  return (
    <Card className="w-80">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-4 h-4" />
          Siste besøkte
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {displayClients.map((client) => (
            <div
              key={client.id}
              onClick={() => navigate(client.url)}
              className="flex items-center justify-between p-2 rounded bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Building2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-xs truncate">{client.name}</p>
                  {client.orgNumber && (
                    <p className="text-xs text-muted-foreground truncate">
                      {client.orgNumber}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <span className="text-xs">
                  {formatDistanceToNow(new Date(client.lastVisited), {
                    addSuffix: true,
                    locale: nb,
                  }).replace('omtrent ', '')}
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