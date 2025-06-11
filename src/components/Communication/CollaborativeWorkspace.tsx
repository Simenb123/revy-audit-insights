
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  FileText, 
  CheckSquare, 
  Plus,
  Video,
  Share2,
  Clock,
  AlertCircle
} from 'lucide-react';
import VideoCallInterface from './VideoCallInterface';
import FileSharing from './FileSharing';

interface WorkspaceActivity {
  id: string;
  type: 'message' | 'file_upload' | 'task_update' | 'meeting' | 'document_edit';
  user: string;
  action: string;
  timestamp: string;
  details?: string;
}

interface CollaborativeWorkspaceProps {
  workspaceId: string;
  workspaceName: string;
  members: string[];
  isOwner?: boolean;
}

const CollaborativeWorkspace = ({ 
  workspaceId, 
  workspaceName, 
  members, 
  isOwner = false 
}: CollaborativeWorkspaceProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showVideoCall, setShowVideoCall] = useState(false);
  
  const [activities] = useState<WorkspaceActivity[]>([
    {
      id: '1',
      type: 'file_upload',
      user: 'Sarah Berg',
      action: 'lastet opp Revisionsplan_2024.pdf',
      timestamp: new Date().toISOString(),
      details: 'Revisjon • 2.4 MB'
    },
    {
      id: '2',
      type: 'task_update',
      user: 'Erik Nordahl',
      action: 'fullførte oppgaven "Gjennomgang av inntektsføring"',
      timestamp: new Date(Date.now() - 1800000).toISOString()
    },
    {
      id: '3',
      type: 'message',
      user: 'Lisa Hansen',
      action: 'la til en kommentar i dokumentet "Risikomatrise"',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      details: 'Behøver avklaring på punkt 3.2'
    },
    {
      id: '4',
      type: 'meeting',
      user: 'System',
      action: 'Møte "Revisjonsmøte Q1" startet',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      details: '3 deltakere'
    }
  ]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'file_upload': return <FileText className="h-4 w-4" />;
      case 'task_update': return <CheckSquare className="h-4 w-4" />;
      case 'meeting': return <Video className="h-4 w-4" />;
      case 'document_edit': return <FileText className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'message': return 'text-blue-600';
      case 'file_upload': return 'text-green-600';
      case 'task_update': return 'text-purple-600';
      case 'meeting': return 'text-orange-600';
      case 'document_edit': return 'text-indigo-600';
      default: return 'text-gray-600';
    }
  };

  if (showVideoCall) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">{workspaceName} - Videomøte</h2>
          <Button 
            variant="outline" 
            onClick={() => setShowVideoCall(false)}
          >
            Tilbake til arbeidsområde
          </Button>
        </div>
        <VideoCallInterface 
          roomId={workspaceId} 
          isHost={isOwner}
          participants={members}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{workspaceName}</h2>
          <p className="text-muted-foreground">
            Samarbeidsområde for teamet • {members.length + 1} medlemmer
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowVideoCall(true)}
            className="gap-2"
          >
            <Video className="h-4 w-4" />
            Start møte
          </Button>
          {isOwner && (
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Inviter medlem
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Oversikt
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Filer
          </TabsTrigger>
          <TabsTrigger value="tasks" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Oppgaver
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Kalender
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Medlemmer */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Medlemmer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                      DU
                    </div>
                    <div>
                      <p className="font-medium text-sm">Du</p>
                      <p className="text-xs text-muted-foreground">
                        {isOwner ? 'Eier' : 'Medlem'}
                      </p>
                    </div>
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  {members.map((member, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
                        {member.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member}</p>
                        <p className="text-xs text-muted-foreground">Medlem</p>
                      </div>
                      <div className="ml-auto">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Aktivitet */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Siste aktivitet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`p-1 rounded ${getActivityColor(activity.type)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span> {activity.action}
                        </p>
                        {activity.details && (
                          <p className="text-xs text-muted-foreground">{activity.details}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleString('no-NO')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hurtighandlinger */}
          <Card>
            <CardHeader>
              <CardTitle>Hurtighandlinger</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-16 flex-col gap-2"
                  onClick={() => setShowVideoCall(true)}
                >
                  <Video className="h-6 w-6" />
                  Start møte
                </Button>
                <Button variant="outline" className="h-16 flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  Nytt dokument
                </Button>
                <Button variant="outline" className="h-16 flex-col gap-2">
                  <CheckSquare className="h-6 w-6" />
                  Ny oppgave
                </Button>
                <Button variant="outline" className="h-16 flex-col gap-2">
                  <Share2 className="h-6 w-6" />
                  Del arbeidsområde
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-6">
          <FileSharing 
            roomId={workspaceId} 
            canUpload={true}
            canDelete={isOwner}
          />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                Oppgaver
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Oppgavefunksjonalitet kommer snart</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Kalender
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Kalenderfunksjonalitet kommer snart</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Team Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Chat-funksjonalitet er tilgjengelig i kommunikasjonsseksjonen</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CollaborativeWorkspace;
