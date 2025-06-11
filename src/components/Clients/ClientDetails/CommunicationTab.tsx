
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Users, Plus, Search } from 'lucide-react';
import { Client } from '@/types/revio';
import { useChatRooms } from '@/hooks/useChatRooms';
import { useMessages } from '@/hooks/useMessages';
import { useUserPresence } from '@/hooks/useUserPresence';
import ChatRoom from '@/components/Communication/ChatRoom';
import OnlineUsers from '@/components/Communication/OnlineUsers';

interface CommunicationTabProps {
  client: Client;
}

const CommunicationTab = ({ client }: CommunicationTabProps) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: chatRooms = [] } = useChatRooms();
  const { presenceData } = useUserPresence();
  
  // Filter chat rooms relevant to this client
  const clientRooms = chatRooms.filter(room => 
    room.name.toLowerCase().includes(client.companyName.toLowerCase()) ||
    room.description?.toLowerCase().includes(client.companyName.toLowerCase())
  );

  const filteredRooms = clientRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Kommunikasjon</h2>
          <p className="text-muted-foreground">
            Chat og samarbeid for {client.companyName}
          </p>
        </div>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Nytt Chat-rom
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[600px]">
        {/* Chat Rooms Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Chat-rom
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Søk rom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {filteredRooms.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Ingen chat-rom funnet for denne klienten
                </p>
              </div>
            ) : (
              filteredRooms.map((room) => (
                <div
                  key={room.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedRoomId === room.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedRoomId(room.id)}
                >
                  <div className="font-medium text-sm">{room.name}</div>
                  {room.description && (
                    <div className="text-xs opacity-75 mt-1">{room.description}</div>
                  )}
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {room.roomType}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          {selectedRoomId ? (
            <ChatRoom roomId={selectedRoomId} />
          ) : (
            <Card className="h-full">
              <CardContent className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Velg et chat-rom</h3>
                  <p className="text-muted-foreground">
                    Velg et chat-rom fra listen til venstre for å starte kommunikasjon.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Online Users */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Pålogget ({presenceData.filter(u => u.isOnline).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OnlineUsers users={presenceData.filter(u => u.isOnline)} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CommunicationTab;
