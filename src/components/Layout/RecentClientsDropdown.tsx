import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { History, Trash2 } from 'lucide-react';
import { useRecentClients } from '@/hooks/useRecentClients';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';

export const RecentClientsDropdown = () => {
  const navigate = useNavigate();
  const { recentClients, clearHistory } = useRecentClients();

  const handleClientClick = (url: string) => {
    navigate(url);
  };

  const handleClearHistory = () => {
    clearHistory();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 text-white hover:bg-white/10"
        >
          <History className="h-4 w-4" />
          <span className="sr-only">Klienthistorikk</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Siste besøkte klienter</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recentClients.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <div className="text-sm">Ingen klienthistorikk ennå</div>
            <div className="text-xs mt-1">Besøk en klient for å se historikk her</div>
          </div>
        ) : (
          <>
            {recentClients.map((client) => (
              <DropdownMenuItem
                key={client.id}
                className="flex flex-col items-start p-3 cursor-pointer"
                onClick={() => handleClientClick(client.url)}
              >
                <div className="font-medium text-sm">{client.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(client.lastVisited), { 
                    addSuffix: true, 
                    locale: nb 
                  })}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive flex items-center gap-2"
              onClick={handleClearHistory}
            >
              <Trash2 className="h-4 w-4" />
              Tøm historikk
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};