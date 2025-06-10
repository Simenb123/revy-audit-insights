
import React, { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useChatRooms } from '@/hooks/useChatRooms';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, Building2 } from 'lucide-react';
import ChatRoom from '@/components/Communication/ChatRoom';
import OnlineUsers from '@/components/Communication/OnlineUsers';

const Communication = () => {
  const { data: userProfile } = useUserProfile();
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedRoomName, setSelectedRoomName] = useState<string>('');
  
  const { data: teamRooms } = useChatRooms('team');
  const { data: departmentRooms } = useChatRooms('department');
  const { data: firmRooms } = useChatRooms('firm');

  const handleRoomSelect = (roomId: string, roomName: string) => {
    setSelectedRoomId(roomId);
    setSelectedRoomName(roomName);
  };

  // Auto-select first available room
  React.useEffect(() => {
    if (!selectedRoomId) {
      const firstRoom = teamRooms?.[0] || departmentRooms?.[0] || firmRooms?.[0];
      if (firstRoom) {
        handleRoomSelect(firstRoom.id, firstRoom.name);
      }
    }
  }, [teamRooms, departmentRooms, firmRooms, selectedRoomId]);

  return (
    <div className="w-full px-4 py-6 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Kommunikasjon</h1>
          <p className="text-muted-foreground mt-1">
            Real-time chat med teammedlemmer og avdelingen
          </p>
        </div>
      </div>

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList>
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Team-chat ({teamRooms?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="department">
            <Building2 className="h-4 w-4 mr-2" />
            Avdelingschat ({departmentRooms?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="firm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Firmachat ({firmRooms?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {teamRooms && teamRooms.length > 0 ? (
                <div className="space-y-4">
                  {/* Room selector */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Velg team-chat</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {teamRooms.map((room) => (
                          <button
                            key={room.id}
                            onClick={() => handleRoomSelect(room.id, room.name)}
                            className={`p-3 text-left rounded-lg border transition-colors ${
                              selectedRoomId === room.id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="font-medium">{room.name}</div>
                            {room.description && (
                              <div className="text-sm opacity-70">{room.description}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Chat room */}
                  {selectedRoomId && (
                    <Card className="h-96">
                      <ChatRoom roomId={selectedRoomId} roomName={selectedRoomName} />
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="h-96">
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Ingen team-chatter tilgjengelig</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Team-chatter opprettes automatisk når du blir lagt til i et team
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div>
              <OnlineUsers currentRoomId={selectedRoomId} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="department">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {departmentRooms && departmentRooms.length > 0 ? (
                <div className="space-y-4">
                  {/* Department room selector */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Avdelingschat</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {departmentRooms.map((room) => (
                          <button
                            key={room.id}
                            onClick={() => handleRoomSelect(room.id, room.name)}
                            className={`p-3 text-left rounded-lg border transition-colors ${
                              selectedRoomId === room.id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="font-medium">{room.name}</div>
                            {room.description && (
                              <div className="text-sm opacity-70">{room.description}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Chat room */}
                  {selectedRoomId && (
                    <Card className="h-96">
                      <ChatRoom roomId={selectedRoomId} roomName={selectedRoomName} />
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="h-96">
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Ingen avdelingschat tilgjengelig</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Du må være tilknyttet en avdeling for å se avdelingschat
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div>
              <OnlineUsers currentRoomId={selectedRoomId} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="firm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {firmRooms && firmRooms.length > 0 ? (
                <div className="space-y-4">
                  {/* Firm room selector */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Firmachat</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        {firmRooms.map((room) => (
                          <button
                            key={room.id}
                            onClick={() => handleRoomSelect(room.id, room.name)}
                            className={`p-3 text-left rounded-lg border transition-colors ${
                              selectedRoomId === room.id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="font-medium">{room.name}</div>
                            {room.description && (
                              <div className="text-sm opacity-70">{room.description}</div>
                            )}
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Chat room */}
                  {selectedRoomId && (
                    <Card className="h-96">
                      <ChatRoom roomId={selectedRoomId} roomName={selectedRoomName} />
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="h-96">
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Ingen firmachat tilgjengelig</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Firmachat må opprettes av administratoren
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <div>
              <OnlineUsers currentRoomId={selectedRoomId} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Communication;
