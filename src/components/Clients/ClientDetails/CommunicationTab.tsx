import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Users, Phone, Video } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Kommunikasjon</h2>
          <p className="text-muted-foreground">
            Chat og samarbeid med teamet for {client.company_name}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Ring klient
          </Button>
          <Button variant="outline" size="sm">
            <Video className="h-4 w-4 mr-2" />
            Videomøte
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                </div>
              </CardContent>
            </Card>
          ) : roomId ? (
            <ChatRoom 
              roomId={roomId}
              roomName={roomName}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Ingen team-chat funnet</h3>
                <p className="text-muted-foreground">
                  Det finnes ikke et aktivt team for denne klienten ennå.
                  Et team-chat opprettes automatisk når et team blir tildelt klienten.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Online Brukere
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OnlineUsers currentRoomId={roomId || undefined} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hurtighandlinger</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" size="sm">
                📧 Send e-post til klient
              </Button>
              <Button variant="ghost" className="w-full justify-start" size="sm">
                📞 Planlegg møte
              </Button>
              <Button variant="ghost" className="w-full justify-start" size="sm">
                📋 Opprett oppgave
              </Button>
              <Button variant="ghost" className="w-full justify-start" size="sm">
                📎 Del dokument
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CommunicationTab;
