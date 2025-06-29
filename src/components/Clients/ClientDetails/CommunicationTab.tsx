import { logger } from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, Phone, Video, Plus } from 'lucide-react';
import { Client } from '@/types/revio';
import ChatRoom from '@/components/Communication/ChatRoom';
import OnlineUsers from '@/components/Communication/OnlineUsers';
import CreateTestDataButton from '@/components/Communication/CreateTestDataButton';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useUserPresence } from '@/hooks/useUserPresence';

interface CommunicationTabProps {
  client: Client;
}

const CommunicationTab = ({ client }: CommunicationTabProps) => {
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const { data: chatRooms = [], refetch: refetchRooms } = useChatRooms();
  const { presenceData: onlineUsers = [] } = useUserPresence();
  
  // Find or create client-specific room
  const clientRoom = chatRooms.find(room => room.name.includes(client.company_name));
  const roomId = clientRoom?.id || `client-${client.id}`;
  const roomName = clientRoom?.name || `${client.company_name} - Kommunikasjon`;

  useEffect(() => {
    if (clientRoom) {
      setActiveRoomId(clientRoom.id);
    }
  }, [clientRoom]);

  const handleCreateRoom = async () => {
    // Create a new room for this client
    try {
      // This would typically call a create room mutation
      logger.log('Creating room for client:', client.company_name);
      refetchRooms();
    } catch (error) {
      logger.error('Failed to create room:', error);
    }
  };

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
          <CreateTestDataButton />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Rooms List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat Rom
              </span>
              <Button size="sm" variant="ghost" onClick={handleCreateRoom}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {chatRooms.length > 0 ? (
                chatRooms.map((room) => (
                  <Button
                    key={room.id}
                    variant={activeRoomId === room.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveRoomId(room.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {room.name}
                  </Button>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Ingen chat rom funnet</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={handleCreateRoom}
                  >
                    Opprett rom
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <div className="lg:col-span-2">
          {activeRoomId ? (
            <ChatRoom 
              roomId={activeRoomId}
              roomName={roomName}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Velg et chat rom</h3>
                <p className="text-muted-foreground">
                  Velg et rom fra listen til venstre for å starte kommunikasjon.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Online Users Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Online Brukere
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OnlineUsers currentRoomId={activeRoomId || undefined} />
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
