import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useChatRooms } from '@/hooks/useChatRooms';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, Building2, LogIn, AlertCircle } from 'lucide-react';
import ChatRoom from '@/components/Communication/ChatRoom';
import OnlineUsers from '@/components/Communication/OnlineUsers';
import CommunicationStatus from '@/components/Communication/CommunicationStatus';

const Communication = () => {
  const { session, user } = useAuth();
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useUserProfile();
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [selectedRoomName, setSelectedRoomName] = useState<string>('');
  
  const { data: teamRooms } = useChatRooms('team');
  const { data: departmentRooms } = useChatRooms('department');
  const { data: firmRooms } = useChatRooms('firm');

  console.log('Communication page - session:', !!session);
  console.log('Communication page - user:', !!user);
  console.log('Communication page - userProfile:', userProfile);
  console.log('Communication page - profileError:', profileError);
  console.log('Communication page - teamRooms:', teamRooms);
  console.log('Communication page - departmentRooms:', departmentRooms);
  console.log('Communication page - firmRooms:', firmRooms);

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

  const hasAnyRooms = (teamRooms?.length || 0) + (departmentRooms?.length || 0) + (firmRooms?.length || 0) > 0;

  // Show authentication prompt if not logged in
  if (!session || !user) {
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

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-16 w-16 text-orange-500 mx-auto" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Du må logge inn for å bruke kommunikasjonssystemet</h2>
                <p className="text-muted-foreground">
                  For å få tilgang til chat-funksjoner og kommunisere med teammedlemmer, må du først logge inn på kontoen din.
                </p>
              </div>
              <Link to="/auth">
                <Button className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Gå til innlogging
                </Button>
              </Link>
            </div>
            
            <div className="border-t pt-6 w-full">
              <h3 className="text-lg font-medium mb-4 text-center">System status</h3>
              <CommunicationStatus />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (profileLoading) {
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
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Laster brukerprofil...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

      {!hasAnyRooms ? (
        <CommunicationStatus />
      ) : (
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
      )}
    </div>
  );
};

export default Communication;
