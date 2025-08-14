import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  Square,
  Settings,
  Headphones
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

interface VoiceInteractionManagerProps {
  onVoiceInput?: (transcript: string) => void;
  onTTSComplete?: () => void;
  isEnabled?: boolean;
}

interface VoiceSettings {
  language: 'nb-NO' | 'en-US';
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
}

const VoiceInteractionManager: React.FC<VoiceInteractionManagerProps> = ({
  onVoiceInput,
  onTTSComplete,
  isEnabled = false
}) => {
  const { toast } = useToast();
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    language: 'nb-NO',
    voice: 'Microsoft Liv Online (Natural) - Norwegian (Norway)',
    speed: 1.0,
    pitch: 1.0,
    volume: 0.8
  });
  
  const [recognition, setRecognition] = useState<any>(null);
  const [synthesis, setSynthesis] = useState<SpeechSynthesis | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const speechSynthesis = window.speechSynthesis;
    
    if (SpeechRecognition && speechSynthesis) {
      setIsSupported(true);
      
      // Initialize speech recognition
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = voiceSettings.language;
      
      recognitionInstance.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
        
        if (finalTranscript && onVoiceInput) {
          onVoiceInput(finalTranscript);
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        toast({
          title: "Stemmegjenkjenning feilet",
          description: "Kunne ikke gjenkjenne tale. Prøv igjen.",
          variant: "destructive",
        });
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recognitionInstance);
      setSynthesis(speechSynthesis);
      
      // Load available voices
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        setAvailableVoices(voices);
        
        // Find Norwegian voice if available
        const norwegianVoice = voices.find(voice => 
          voice.lang.startsWith('nb') || voice.lang.startsWith('no')
        );
        
        if (norwegianVoice) {
          setVoiceSettings(prev => ({ ...prev, voice: norwegianVoice.name }));
        }
      };
      
      // Load voices when they become available
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = loadVoices;
      }
      loadVoices();
      
    } else {
      setIsSupported(false);
      toast({
        title: "Stemmeinteraksjon ikke støttet",
        description: "Din nettleser støtter ikke stemmeinteraksjon.",
        variant: "destructive",
      });
    }
  }, [voiceSettings.language]);

  // Start voice recognition
  const startListening = async () => {
    if (!recognition || !isEnabled) return;
    
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setTranscript('');
      setIsListening(true);
      recognition.start();
      
      toast({
        title: "Lytter...",
        description: "Snakk nå, jeg lytter til deg.",
      });
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      toast({
        title: "Mikrofon ikke tilgjengelig",
        description: "Kunne ikke få tilgang til mikrofon.",
        variant: "destructive",
      });
    }
  };

  // Stop voice recognition
  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
  };

  // Text-to-speech function
  const speak = (text: string) => {
    if (!synthesis || !isEnabled) return;
    
    // Stop any ongoing speech
    synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find the selected voice
    const selectedVoice = availableVoices.find(voice => voice.name === voiceSettings.voice);
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.lang = voiceSettings.language;
    utterance.rate = voiceSettings.speed;
    utterance.pitch = voiceSettings.pitch;
    utterance.volume = voiceSettings.volume;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onTTSComplete) {
        onTTSComplete();
      }
    };
    
    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
      
      toast({
        title: "Tale-syntese feilet",
        description: "Kunne ikke generere tale.",
        variant: "destructive",
      });
    };
    
    synthesis.speak(utterance);
  };

  // Stop speech synthesis
  const stopSpeaking = () => {
    if (synthesis) {
      synthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Test voice output
  const testVoice = () => {
    const testText = voiceSettings.language === 'nb-NO' 
      ? "Hei! Dette er en test av stemmeassistenten. Jeg kan hjelpe deg med revisjonsoppgaver."
      : "Hello! This is a test of the voice assistant. I can help you with audit tasks.";
    
    speak(testText);
  };

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground">
            <MicOff className="h-8 w-8 mx-auto mb-2" />
            <p>Stemmeinteraksjon er ikke tilgjengelig i denne nettleseren.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Headphones className="h-5 w-5" />
          Stemmeinteraksjon
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Voice Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant={isListening ? "destructive" : "default"}
              size="lg"
              onClick={isListening ? stopListening : startListening}
              disabled={!isEnabled}
              className="flex items-center gap-2"
            >
              {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              {isListening ? 'Stopp lytting' : 'Start lytting'}
            </Button>
            
            <Button
              variant={isSpeaking ? "destructive" : "outline"}
              size="lg"
              onClick={isSpeaking ? stopSpeaking : testVoice}
              disabled={!isEnabled}
              className="flex items-center gap-2"
            >
              {isSpeaking ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              {isSpeaking ? 'Stopp tale' : 'Test stemme'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {isListening && (
              <Badge variant="destructive" className="animate-pulse">
                Lytter...
              </Badge>
            )}
            {isSpeaking && (
              <Badge variant="default" className="animate-pulse">
                Snakker...
              </Badge>
            )}
          </div>
        </div>

        {/* Transcript Display */}
        {transcript && (
          <Card className="p-4 bg-muted">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Gjenkjent tale:</h4>
              <p className="text-sm italic">"{transcript}"</p>
            </div>
          </Card>
        )}

        {/* Voice Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Stemmeinnstillinger</h4>
          
          {/* Language Selection */}
          <div className="space-y-2">
            <label className="text-sm">Språk:</label>
            <div className="flex gap-2">
              <Button
                variant={voiceSettings.language === 'nb-NO' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVoiceSettings(prev => ({ ...prev, language: 'nb-NO' }))}
              >
                Norsk
              </Button>
              <Button
                variant={voiceSettings.language === 'en-US' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setVoiceSettings(prev => ({ ...prev, language: 'en-US' }))}
              >
                English
              </Button>
            </div>
          </div>

          {/* Voice Selection */}
          <div className="space-y-2">
            <label className="text-sm">Stemme:</label>
            <select
              className="w-full p-2 border rounded text-sm"
              value={voiceSettings.voice}
              onChange={(e) => setVoiceSettings(prev => ({ ...prev, voice: e.target.value }))}
            >
              {availableVoices
                .filter(voice => voice.lang.startsWith(voiceSettings.language.slice(0, 2)))
                .map(voice => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Speed Control */}
          <div className="space-y-2">
            <label className="text-sm">Talehastighet: {voiceSettings.speed.toFixed(1)}x</label>
            <Slider
              value={[voiceSettings.speed]}
              onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, speed: value }))}
              min={0.5}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Volume Control */}
          <div className="space-y-2">
            <label className="text-sm">Volum: {Math.round(voiceSettings.volume * 100)}%</label>
            <Slider
              value={[voiceSettings.volume]}
              onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, volume: value }))}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Hurtighandlinger</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => speak("Hvordan kan jeg hjelpe deg med revisjonen i dag?")}
              disabled={!isEnabled || isSpeaking}
            >
              Velkomstmelding
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => speak("Revisjonen er fullført. Er det noe annet jeg kan hjelpe med?")}
              disabled={!isEnabled || isSpeaking}
            >
              Avslutningsmelding
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceInteractionManager;