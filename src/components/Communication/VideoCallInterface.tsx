
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Monitor, 
  Users,
  Settings,
  MessageSquare
} from 'lucide-react';

interface VideoCallInterfaceProps {
  roomId: string;
  isHost?: boolean;
  participants?: string[];
}

const VideoCallInterface = ({ roomId, isHost = false, participants = [] }: VideoCallInterfaceProps) => {
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [showChat, setShowChat] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Simuler tilkobling til videoanrop
    const timer = setTimeout(() => {
      setCallStatus('connected');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
  };

  const toggleAudio = () => {
    setIsAudioOn(!isAudioOn);
  };

  const toggleScreenShare = () => {
    setIsScreenSharing(!isScreenSharing);
  };

  const endCall = () => {
    setCallStatus('ended');
  };

  if (callStatus === 'ended') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8 text-center">
          <PhoneOff className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">Anrop avsluttet</h3>
          <p className="text-muted-foreground mb-4">Takk for deltakelsen i møtet</p>
          <Button onClick={() => setCallStatus('connecting')}>
            Start nytt anrop
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Videomøte - {roomId}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={callStatus === 'connected' ? 'default' : 'secondary'}>
              {callStatus === 'connected' ? 'Tilkoblet' : 'Kobler til...'}
            </Badge>
            <Badge variant="outline">
              <Users className="h-3 w-3 mr-1" />
              {participants.length + 1} deltakere
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-96">
          {/* Hovedvideo */}
          <div className="lg:col-span-3 relative bg-gray-900 rounded-lg overflow-hidden">
            {callStatus === 'connecting' ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Kobler til videoanrop...</p>
                </div>
              </div>
            ) : (
              <>
                <video
                  ref={remoteVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                />
                {isScreenSharing && (
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-red-500">
                      <Monitor className="h-3 w-3 mr-1" />
                      Skjermdeling aktiv
                    </Badge>
                  </div>
                )}
              </>
            )}
            
            {/* Lokalt video (bilde-i-bilde) */}
            <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
              <video
                ref={localVideoRef}
                className={`w-full h-full object-cover ${!isVideoOn ? 'hidden' : ''}`}
                autoPlay
                playsInline
                muted
              />
              {!isVideoOn && (
                <div className="w-full h-full flex items-center justify-center">
                  <VideoOff className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* Deltakerliste og chat */}
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Deltakere ({participants.length + 1})
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Du {isHost && '(Vert)'}
                </div>
                {participants.map((participant, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {participant}
                  </div>
                ))}
              </div>
            </div>

            {showChat && (
              <div className="bg-muted rounded-lg p-4 flex-1">
                <h4 className="font-medium mb-3">Chat</h4>
                <div className="space-y-2 text-sm">
                  <div className="bg-background p-2 rounded text-xs">
                    <span className="font-medium">System:</span> Møtet har startet
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Kontroller */}
        <div className="flex justify-center items-center gap-4 mt-6 p-4 bg-muted rounded-lg">
          <Button
            variant={isAudioOn ? "default" : "destructive"}
            size="icon"
            onClick={toggleAudio}
          >
            {isAudioOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>

          <Button
            variant={isVideoOn ? "default" : "destructive"}
            size="icon"
            onClick={toggleVideo}
          >
            {isVideoOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>

          <Button
            variant={isScreenSharing ? "default" : "outline"}
            size="icon"
            onClick={toggleScreenShare}
          >
            <Monitor className="h-4 w-4" />
          </Button>

          <Button
            variant={showChat ? "default" : "outline"}
            size="icon"
            onClick={() => setShowChat(!showChat)}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>

          <Button variant="destructive" onClick={endCall}>
            <PhoneOff className="h-4 w-4 mr-2" />
            Avslutt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoCallInterface;
