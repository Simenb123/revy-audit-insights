import { logger } from '@/utils/logger';
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Users, 
  CheckCircle, 
  MessageSquare,
  Volume2,
  ArrowLeft
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useVoiceCommands } from '@/hooks/useVoiceCommands';
import ModeSelector from './ModeSelector';
import ChatInterface from './ChatInterface';

interface AICharacter {
  id: string;
  name: string;
  role: string;
  personality: string;
  voice_id: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  scenario: string;
  objectives: string[];
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface SimulationSession {
  id: string;
  character: AICharacter;
  mode: 'audio' | 'chat';
  startTime: Date;
  status: 'active' | 'paused' | 'completed';
  progress: number;
  objectivesCompleted: string[];
  feedback: string[];
}

const AICharacterSimulator = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<AICharacter | null>(null);
  const [selectedMode, setSelectedMode] = useState<'audio' | 'chat' | null>(null);
  const [session, setSession] = useState<SimulationSession | null>(null);
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Audio-specific states
  const [isRecording, setIsRecording] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Use voice commands hook for fallback TTS
  const { speakText } = useVoiceCommands();

  // Pre-defined AI characters for different scenarios
  const characters: AICharacter[] = [
    {
      id: 'skeptical-cfo',
      name: 'Lars Hansen',
      role: 'Finansdirektør',
      personality: 'Skeptisk, detaljorientert, stiller mange spørsmål',
      voice_id: 'pqHfZKP75CvOlQylNhV4', // Bill voice from ElevenLabs
      description: 'En erfaren CFO som er skeptisk til revisorer og stiller kritiske spørsmål om prosessen.',
      difficulty: 'advanced',
      scenario: 'Oppstartsmøte - første gangs revisjon',
      objectives: [
        'Identifiser klientens forretningsmodell',
        'Kartlegg risikoområder',
        'Etabler tillit og profesjonalitet',
        'Få tilgang til nødvendige dokumenter',
        'Avtale tidsplan for revisjonen'
      ]
    },
    {
      id: 'nervous-founder',
      name: 'Kari Nordström',
      role: 'Gründer/CEO',
      personality: 'Nervøs, ny til revisjon, snakkesalig',
      voice_id: 'EXAVITQu4vr4xnSDxMaL', // Sarah voice
      description: 'En ung gründer som gjennomgår sin første revisjon og er usikker på prosessen.',
      difficulty: 'beginner',
      scenario: 'Oppstartsmøte - startup selskap',
      objectives: [
        'Berolig klienten om revisjonsprosessen',
        'Forklare revisorens rolle og ansvar',
        'Identifisere kritiske forretningsprosesser',
        'Kartlegge IT-systemer og kontroller',
        'Etablere kommunikasjonsrutiner'
      ]
    },
    {
      id: 'experienced-chairman',
      name: 'Ove Kristiansen',
      role: 'Styreleder',
      personality: 'Erfaren, direkte, effektivitetsfokusert',
      voice_id: 'JBFqnCBsd6RMkjVDRZzb', // George voice
      description: 'En rutinert styreleder med lang erfaring fra revisjoner og høye forventninger.',
      difficulty: 'intermediate',
      scenario: 'Oppstartsmøte - etablert selskap',
      objectives: [
        'Gjennomgå endringer siden forrige år',
        'Diskutere vesentlighetsnivå',
        'Planlegge effektiv gjennomføring',
        'Koordinere med tidligere revisor',
        'Avtale rapporteringsrutiner'
      ]
    }
  ];

  const startSimulation = async (character: AICharacter, mode: 'audio' | 'chat') => {
    try {
      if (mode === 'audio') {
        // Request microphone access for audio mode
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        streamRef.current = stream;
      }
      
      const newSession: SimulationSession = {
        id: crypto.randomUUID(),
        character,
        mode,
        startTime: new Date(),
        status: 'active',
        progress: 0,
        objectivesCompleted: [],
        feedback: []
      };
      
      setSelectedCharacter(character);
      setSelectedMode(mode);
      setSession(newSession);
      setConversation([]);
      
      // Start with AI greeting
      await generateAIResponse(`Du er ${character.name}, ${character.role}. ${character.personality}. 
        Scenario: ${character.scenario}. Start møtet med en naturlig hilsen og introduksjon. 
        Oppfør deg som denne karakteren ville gjort i et ekte oppstartsmøte med revisor.
        Snakk norsk og vær naturlig.`, character, mode);
      
      toast({
        title: "Simulering startet",
        description: `Du møter nå ${character.name} (${character.role}) i ${mode === 'audio' ? 'audio' : 'chat'}-modus`,
      });
      
    } catch (error) {
      logger.error('Error starting simulation:', error);
      toast({
        title: "Feil",
        description: mode === 'audio' ? "Kunne ikke starte simulering. Sjekk mikrofontilgang." : "Kunne ikke starte simulering.",
        variant: "destructive"
      });
    }
  };

  const generateAIResponse = async (userInput: string, character: AICharacter, mode: 'audio' | 'chat') => {
    try {
      setIsLoading(true);
      if (mode === 'audio') setIsAISpeaking(true);
      
      const systemPrompt = `Du er ${character.name}, en ${character.role}. 
        Personlighet: ${character.personality}
        Scenario: ${character.scenario}
        
        Du er i et oppstartsmøte med en revisor. Oppfør deg som denne karakteren ville gjort:
        - Vær konsistent med personligheten
        - Still relevante spørsmål basert på din rolle
        - Reagér naturlig på revisorens spørsmål
        - Vis den kunnskapen og bekymringene denne karakteren ville hatt
        - Snakk norsk og vær naturlig i tonen
        
        Ikke vær en AI-assistent - vær denne spesifikke karakteren i denne situasjonen.`;

      // Generate text response
      const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
        body: {
          message: userInput,
          context: 'character-simulation',
          systemPrompt,
          character: character.name,
          userRole: 'auditor'
        }
      });

      if (error) throw error;

      const aiResponse = data.response;
      
      // Add to conversation - only add user message for chat mode or initial prompt
      // For audio mode, user message is already added in processRecording
      const newMessages = [...conversation];
      const isInitialPrompt = userInput.includes(`Du er ${character.name}, ${character.role}.`);
      
      if (mode === 'chat' && !isInitialPrompt) {
        newMessages.push({ role: 'user', content: userInput, timestamp: new Date() });
      }
      
      newMessages.push({ role: 'ai', content: aiResponse, timestamp: new Date() });
      setConversation(newMessages);
      
      // Generate speech for audio mode
      if (mode === 'audio') {
        await generateSpeech(aiResponse, character.voice_id);
      }
      
    } catch (error) {
      logger.error('Error generating AI response:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke generere AI-svar",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      if (selectedMode === 'audio') setIsAISpeaking(false);
    }
  };

  const generateSpeech = async (text: string, voiceId: string) => {
    try {
      logger.log('Generating speech with voiceId:', voiceId);
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voiceId }
      });
      
      if (error) {
        logger.error('Supabase function error:', error);
        throw error;
      }

      // Check if the response contains an error (when ElevenLabs fails)
      if (data && typeof data === 'object' && 'error' in data) {
        logger.error('ElevenLabs API error:', data.error);
        
        // Fallback to useVoiceCommands speakText with OpenAI TTS
        logger.log('Falling back to OpenAI TTS');
        await speakText(text);
        return;
      }

      let audioBuffer: ArrayBuffer;
      
      if (data instanceof ArrayBuffer) {
        // Direct ArrayBuffer response
        audioBuffer = data;
      } else if (typeof data === 'string') {
        // Base64 string response - decode it
        logger.log('Received base64 string response, decoding...');
        try {
          const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
          audioBuffer = bytes.buffer;
        } catch (decodeError) {
          logger.error('Failed to decode base64 string:', decodeError);
          toast({
            title: "Lydfeil",
            description: "Kunne ikke dekode lyddata",
            variant: "destructive"
          });
          await speakText(text);
          return;
        }
      } else if (data && (data as any).audioContent) {
        // JSON response with audioContent property
        const bytes = Uint8Array.from(atob((data as any).audioContent), (c) => c.charCodeAt(0));
        audioBuffer = bytes.buffer;
      } else {
        logger.error('Invalid audio data format received:', typeof data, data);
        toast({
          title: "Lydfeil", 
          description: "Ukjent lydformat mottatt",
          variant: "destructive"
        });
        
        // Fallback to useVoiceCommands speakText
        logger.log('Falling back to OpenAI TTS due to invalid data format');
        await speakText(text);
        return;
      }

      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      await audio.play();
      
      logger.log('ElevenLabs speech playback successful');
      
    } catch (error) {
      logger.error('Error generating speech:', error);
      
      // Fallback to useVoiceCommands speakText for any other errors
      try {
        logger.log('Attempting fallback to OpenAI TTS');
        await speakText(text);
      } catch (fallbackError) {
        logger.error('Fallback TTS also failed:', fallbackError);
        toast({
          title: "Tale-syntese feilet",
          description: "Kunne ikke spille av AI-svar",
          variant: "destructive"
        });
      }
    }
  };

  const handleChatMessage = async (message: string) => {
    if (selectedCharacter && selectedMode === 'chat') {
      await generateAIResponse(message, selectedCharacter, 'chat');
      updateProgress();
    }
  };

  const startRecording = async () => {
    if (!streamRef.current) return;
    
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await processRecording(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
    } catch (error) {
      logger.error('Error starting recording:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke starte opptak",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processRecording = async (audioBlob: Blob) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });
      
      if (error) throw error;
      
      const transcription = data.text;
      
      if (transcription && selectedCharacter) {
        // Add user's transcribed speech to conversation immediately
        setConversation(prev => [...prev, { role: 'user', content: transcription, timestamp: new Date() }]);
        
        await generateAIResponse(transcription, selectedCharacter, 'audio');
        updateProgress();
      }
      
    } catch (error) {
      logger.error('Error processing recording:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke behandle opptak",
        variant: "destructive"
      });
    }
  };

  const updateProgress = () => {
    if (session) {
      const newProgress = Math.min(session.progress + 10, 100);
      setSession({ ...session, progress: newProgress });
    }
  };

  const endSimulation = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    setSelectedCharacter(null);
    setSelectedMode(null);
    setSession(null);
    setConversation([]);
    setIsRecording(false);
    setIsAISpeaking(false);
    
    toast({
      title: "Simulering avsluttet",
      description: "Takk for treningen! Se feedback nedenfor.",
    });
  };

  const handleModeSelect = (mode: 'audio' | 'chat') => {
    if (selectedCharacter) {
      startSimulation(selectedCharacter, mode);
    }
  };

  const goBackToCharacterSelection = () => {
    setSelectedCharacter(null);
    setSelectedMode(null);
  };

  const goBackToModeSelection = () => {
    setSelectedMode(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  // Character selection view
  if (!selectedCharacter) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">AI Oppstartsmøte Simulator</h2>
          <p className="text-gray-600">
            Tren på oppstartsmøter med AI-drevne klientkarakter. Øv på å stille de riktige spørsmålene.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character) => (
            <Card key={character.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8 text-blue-600" />
                  <Badge variant={
                    character.difficulty === 'beginner' ? 'secondary' :
                    character.difficulty === 'intermediate' ? 'default' : 'destructive'
                  }>
                    {character.difficulty === 'beginner' ? 'Nybegynner' :
                     character.difficulty === 'intermediate' ? 'Middels' : 'Avansert'}
                  </Badge>
                </div>
                <CardTitle className="text-lg">{character.name}</CardTitle>
                <p className="text-sm text-gray-600">{character.role}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{character.description}</p>
                <p className="text-xs text-gray-500 mb-4">{character.scenario}</p>
                
                <div className="space-y-2 mb-4">
                  <p className="text-xs font-medium">Læringsmål:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {character.objectives.slice(0, 3).map((objective, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <CheckCircle className="h-3 w-3 mt-0.5 text-green-500" />
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Button 
                  onClick={() => setSelectedCharacter(character)}
                  className="w-full"
                >
                  Velg {character.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Mode selection view
  if (selectedCharacter && !selectedMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={goBackToCharacterSelection}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tilbake til karakterer
          </Button>
          <div>
            <h3 className="text-xl font-semibold">Møte med {selectedCharacter.name}</h3>
            <p className="text-gray-600">{selectedCharacter.role} • {selectedCharacter.scenario}</p>
          </div>
        </div>
        
        <ModeSelector onModeSelect={handleModeSelect} />
      </div>
    );
  }

  // Active session view
  if (selectedCharacter && selectedMode && session) {
    return (
      <div className="space-y-6">
        {/* Session Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={goBackToModeSelection}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Endre modus
                </Button>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {selectedMode === 'audio' ? <Mic className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                    Møte med {selectedCharacter.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {selectedCharacter.role} • {selectedCharacter.scenario} • 
                    <Badge variant="outline" className="ml-2">
                      {selectedMode === 'audio' ? 'Audio-modus' : 'Chat-modus'}
                    </Badge>
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={endSimulation}>
                Avslutt møte
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Fremdrift</span>
                  <span>{session.progress || 0}%</span>
                </div>
                <Progress value={session.progress || 0} className="w-full" />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                {selectedCharacter.objectives.map((objective, index) => (
                  <div key={index} className="space-y-1">
                    <CheckCircle className={`h-6 w-6 mx-auto ${
                      session.objectivesCompleted.includes(objective) 
                        ? 'text-green-500' 
                        : 'text-gray-300'
                    }`} />
                    <p className="text-xs">{objective}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mode-specific interface */}
        {selectedMode === 'chat' ? (
          <ChatInterface 
            character={selectedCharacter}
            onMessage={handleChatMessage}
            messages={conversation}
            isLoading={isLoading}
          />
        ) : (
          <>
            {/* Voice Controls for Audio Mode */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    size="lg"
                    variant={isRecording ? "destructive" : "default"}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isAISpeaking}
                    className="rounded-full w-16 h-16"
                  >
                    {isRecording ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                  </Button>
                  
                  <div className="text-center">
                    {isAISpeaking && (
                      <div className="flex items-center gap-2 text-blue-600">
                        <Volume2 className="h-5 w-5" />
                        <span className="text-sm">{selectedCharacter.name} snakker...</span>
                      </div>
                    )}
                    {isRecording && (
                      <div className="flex items-center gap-2 text-red-600">
                        <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                        <span className="text-sm">Tar opp...</span>
                      </div>
                    )}
                    {!isRecording && !isAISpeaking && (
                      <span className="text-sm text-gray-600">Trykk for å snakke</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conversation Log for Audio Mode */}
            {conversation.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Samtalelogg
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {conversation.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-full p-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <div className="text-xs text-gray-500 mb-1">
                            {message.role === 'user' ? 'Du' : selectedCharacter.name} • 
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    );
  }

  return null;
};

export default AICharacterSimulator;
