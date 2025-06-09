
import React, { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Users, Building2, Send } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

const Communication = () => {
  const { data: userProfile } = useUserProfile();
  const [newMessage, setNewMessage] = useState('');

  const mockMessages = [
    {
      id: 1,
      sender: 'Anna Hansen',
      message: 'Hei alle sammen! Møtet i morgen er flyttet til kl 10:00.',
      timestamp: '2 timer siden',
      type: 'team'
    },
    {
      id: 2,
      sender: 'Per Olsen',
      message: 'Kan noen hjelpe meg med revisjonen av Klient ABC?',
      timestamp: '4 timer siden',
      type: 'department'
    }
  ];

  return (
    <div className="w-full px-4 py-6 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Kommunikasjon</h1>
          <p className="text-muted-foreground mt-1">
            Chat med teammedlemmer og avdelingen
          </p>
        </div>
      </div>

      <Tabs defaultValue="team" className="space-y-6">
        <TabsList>
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Team-chat
          </TabsTrigger>
          <TabsTrigger value="department">
            <Building2 className="h-4 w-4 mr-2" />
            Avdelingschat
          </TabsTrigger>
          <TabsTrigger value="announcements">
            <MessageSquare className="h-4 w-4 mr-2" />
            Kunngjøringer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-96">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team-chat
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col h-full">
                  <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
                    {mockMessages
                      .filter(m => m.type === 'team')
                      .map(message => (
                        <div key={message.id} className="p-3 bg-muted rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{message.sender}</span>
                            <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      ))}
                  </div>
                  
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Skriv en melding..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 min-h-[60px]"
                    />
                    <Button size="icon" className="self-end">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Teammedlemmer online</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Anna Hansen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Per Olsen</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <span className="text-sm text-muted-foreground">Kari Nordmann</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="department">
          <Card>
            <CardHeader>
              <CardTitle>Avdelingschat</CardTitle>
              <p className="text-muted-foreground">Chat med hele avdelingen</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                {mockMessages
                  .filter(m => m.type === 'department')
                  .map(message => (
                    <div key={message.id} className="p-3 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{message.sender}</span>
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  ))}
              </div>
              
              <div className="flex gap-2">
                <Input
                  placeholder="Skriv en melding til avdelingen..."
                  className="flex-1"
                />
                <Button>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements">
          <Card>
            <CardHeader>
              <CardTitle>Kunngjøringer</CardTitle>
              <p className="text-muted-foreground">Viktige meldinger og oppdateringer</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Ingen kunngjøringer ennå</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Kunngjøringer fra ledelsen vil vises her
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Communication;
