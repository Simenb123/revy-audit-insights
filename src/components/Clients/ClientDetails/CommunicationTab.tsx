import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Users, AlertCircle } from 'lucide-react';
import { Client } from '@/types/revio';
import ChatRoom from '@/components/Communication/ChatRoom';
import OnlineUsers from '@/components/Communication/OnlineUsers';
import { useClientTeam } from '@/hooks/useClientTeam';

interface CommunicationTabProps {
  client: Client;
}

const CommunicationTab = ({ client }: CommunicationTabProps) => {
  const { data: clientTeam, isLoading } = useClientTeam(client.id);
  
  const roomId = clientTeam?.chatRoomId;
  const roomName = clientTeam?.name 
    ? `${client.company_name} - ${clientTeam.name}` 
    : `${client.company_name} - Team Chat`;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!roomId) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground" />
          <div className="space-y-2">
            <h3 className="font-medium">Ingen team-chat funnet</h3>
            <p className="text-sm text-muted-foreground">
              Det finnes ikke et aktivt team for denne klienten ennå.<br />
              Et team-chat opprettes automatisk når et team blir tildelt klienten.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Chat Area */}
      <div className="lg:col-span-2">
        <ChatRoom 
          roomId={roomId}
          roomName={roomName}
        />
      </div>

      {/* Right Column - Online Users */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Online Brukere
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OnlineUsers currentRoomId={roomId} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunicationTab;
