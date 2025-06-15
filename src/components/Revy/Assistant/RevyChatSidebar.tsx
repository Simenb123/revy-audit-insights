
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, MessageSquare, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RevyChatSession } from '@/types/revio';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';

interface RevyChatSidebarProps {
  sessions: RevyChatSession[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onCreateSession: () => void;
  isLoading: boolean;
}

export const RevyChatSidebar = ({
  sessions,
  activeSessionId,
  onSessionSelect,
  onCreateSession,
  isLoading
}: RevyChatSidebarProps) => {
  return (
    <div className="w-64 bg-gray-100/50 border-r flex flex-col h-full flex-shrink-0">
      <div className="p-2 border-b">
        <Button onClick={onCreateSession} className="w-full" variant="outline" size="sm" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <PlusCircle className="h-4 w-4 mr-2" />
          )}
          Ny samtale
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading && sessions.length === 0 && (
            <div className="text-center text-sm text-gray-500 p-4">Laster samtaler...</div>
          )}
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => onSessionSelect(session.id)}
              className={cn(
                "w-full text-left p-2 rounded-md hover:bg-gray-200 flex items-start gap-2",
                session.id === activeSessionId && "bg-blue-100 hover:bg-blue-200"
              )}
            >
              <MessageSquare className="h-4 w-4 mt-1 flex-shrink-0 text-gray-500" />
              <div className="flex-grow overflow-hidden">
                <p className="text-sm font-medium truncate">{session.title || 'Uten tittel'}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true, locale: nb })}
                </p>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

