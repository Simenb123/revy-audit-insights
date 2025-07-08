
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  MessageSquare, 
  Video, 
  FileText, 
  Plus, 
  ArrowLeft,
  Building2,
  Calendar,
  Bell
} from 'lucide-react';
import { Link } from 'react-router-dom';
import CollaborativeWorkspace from '@/components/Communication/CollaborativeWorkspace';
import VideoCallInterface from '@/components/Communication/VideoCallInterface';
import EnhancedChatRoom from '@/components/Communication/EnhancedChatRoom';

interface WorkspaceData {
  id: string;
  name: string;
  description: string;
  members: string[];
  isOwner: boolean;
  lastActivity: string;
  unreadCount: number;
}

const Collaboration = () => {
  const [activeView, setActiveView] = useState<'overview' | 'workspace' | 'video' | 'chat'>('overview');
  const [selectedWorkspace, setSelectedWorkspace] = useState<WorkspaceData | null>(null);
  
  const [workspaces] = useState<WorkspaceData[]>([
    {
      id: 'ws1',
      name: 'Nordheim AS - Revisjon 2024',
      description: 'Hovedarbeidsområde for revisjonen av Nordheim AS',
      members: ['Sarah Berg', 'Erik Nordahl', 'Lisa Hansen'],
      isOwner: true,
      lastActivity: new Date().toISOString(),
      unreadCount: 3
    },
    {
      id: 'ws2',
      name: 'Sørland Byggverk - Q1 Gjennomgang',
      description: 'Kvartalsvis gjennomgang og risikovurdering',
      members: ['Erik Nordahl', 'Tom Andersen'],
      isOwner: false,
      lastActivity: new Date(Date.now() - 3600000).toISOString(),
      unreadCount: 0
    },
    {
      id: 'ws3',
      name: 'Intern opplæring - Nye standarder',
      description: 'Arbeidsområde for opplæring i nye regnskapsstandarder',
      members: ['Sarah Berg', 'Lisa Hansen', 'Tom Andersen', 'Maria Olsen'],
      isOwner: false,
      lastActivity: new Date(Date.now() - 86400000).toISOString(),
      unreadCount: 1
    }
  ]);

  const handleWorkspaceClick = (workspace: WorkspaceData) => {
    setSelectedWorkspace(workspace);
    setActiveView('workspace');
  };

  const handleBackToOverview = () => {
    setActiveView('overview');
    setSelectedWorkspace(null);
  };

  if (activeView === 'workspace' && selectedWorkspace) {
    return (
      <main className="w-full px-4 py-6 md:px-6 lg:px-8">
        <Button
          variant="outline"
          onClick={handleBackToOverview}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake til oversikt
        </Button>
        
        <CollaborativeWorkspace
          workspaceId={selectedWorkspace.id}
          workspaceName={selectedWorkspace.name}
          members={selectedWorkspace.members}
          isOwner={selectedWorkspace.isOwner}
        />
      </main>
    );
  }

  if (activeView === 'video') {
    return (
      <main className="w-full px-4 py-6 md:px-6 lg:px-8">
        <Button
          variant="outline"
          onClick={handleBackToOverview}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake til oversikt
        </Button>
        
        <VideoCallInterface
          roomId="demo-room"
          isHost={true}
          participants={['Sarah Berg', 'Erik Nordahl']}
        />
      </main>
    );
  }

  if (activeView === 'chat') {
    return (
      <main className="w-full px-4 py-6 md:px-6 lg:px-8">
        <Button
          variant="outline"
          onClick={handleBackToOverview}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Tilbake til oversikt
        </Button>
        
        <Card className="max-w-4xl mx-auto">
          <EnhancedChatRoom
            roomId="demo-chat"
            roomName="Generell diskusjon"
            participants={['Sarah Berg', 'Erik Nordahl', 'Lisa Hansen']}
          />
        </Card>
      </main>
    );
  }

  return (
    <main className="w-full px-4 py-6 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Samarbeid</h1>
          <p className="text-muted-foreground mt-1">
            Avanserte verktøy for teamsamarbeid og kommunikasjon
          </p>
        </div>
        <Link to="/dashboard">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Tilbake
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="workspaces" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workspaces" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Arbeidsområder
          </TabsTrigger>
          <TabsTrigger value="meetings" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Møter
          </TabsTrigger>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Meldinger
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Aktivitet
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workspaces" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Mine arbeidsområder</h2>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nytt arbeidsområde
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <Card 
                key={workspace.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleWorkspaceClick(workspace)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{workspace.name}</CardTitle>
                    {workspace.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {workspace.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{workspace.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{workspace.members.length + 1} medlemmer</span>
                      {workspace.isOwner && (
                        <Badge variant="outline" className="text-xs">Eier</Badge>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      Sist aktiv: {new Date(workspace.lastActivity).toLocaleDateString('no-NO')}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveView('chat');
                        }}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        Chat
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveView('video');
                        }}
                      >
                        <Video className="h-3 w-3 mr-1" />
                        Møte
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="meetings" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Videomøter</h2>
            <Button 
              className="gap-2"
              onClick={() => setActiveView('video')}
            >
              <Video className="h-4 w-4" />
              Start øyeblikkelig møte
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Planlagte møter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Revisjonsmøte - Nordheim AS</h4>
                    <p className="text-sm text-muted-foreground">I dag kl. 14:00 • 3 deltakere</p>
                  </div>
                  <Button size="sm">Bli med</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Ukentlig team-standup</h4>
                    <p className="text-sm text-muted-foreground">I morgen kl. 09:00 • 5 deltakere</p>
                  </div>
                  <Button variant="outline" size="sm">Planlagt</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Meldinger</h2>
            <Button 
              className="gap-2"
              onClick={() => setActiveView('chat')}
            >
              <MessageSquare className="h-4 w-4" />
              Ny samtale
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">Generell diskusjon</CardTitle>
                  <Badge variant="destructive" className="text-xs">2</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Siste melding: "Når er møtet i morgen?"
                </p>
                <p className="text-xs text-muted-foreground">5 deltakere • Aktiv</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">Nordheim AS Team</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Siste melding: "Dokumentene er klare for gjennomgang"
                </p>
                <p className="text-xs text-muted-foreground">3 deltakere • 2t siden</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <h2 className="text-xl font-semibold">Aktivitetsfeed</h2>
          
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">
                    S
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">Sarah Berg</span> opprettet et nytt arbeidsområde
                    </p>
                    <p className="text-xs text-muted-foreground">2 timer siden</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                    E
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">Erik Nordahl</span> lastet opp et dokument
                    </p>
                    <p className="text-xs text-muted-foreground">4 timer siden</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                    L
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">Lisa Hansen</span> fullførte en oppgave
                    </p>
                    <p className="text-xs text-muted-foreground">I går</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default Collaboration;
