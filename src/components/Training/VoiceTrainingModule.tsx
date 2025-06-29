import { logger } from '@/utils/logger';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Play, Pause, Volume2, Headphones } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceTrainingModuleProps {
  scenarioId: string;
  scenarioName: string;
  onComplete?: (feedback: any) => void;
}

const VoiceTrainingModule = ({ scenarioId, scenarioName, onComplete }: VoiceTrainingModuleProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<any>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;
      
      // Set up audio visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 256;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average);
          requestAnimationFrame(updateAudioLevel);
        }
      };
      updateAudioLevel();
      
      // Set up recording
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await processAudio(audioBlob);
      };
      
      mediaRecorder.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      
      toast({
        title: "Opptak startet",
        description: "Snakk tydelig inn i mikrofonen",
      });
      
    } catch (error) {
      logger.error('Error starting recording:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke starte opptak. Sjekk mikrofontilgang.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setAudioLevel(0);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    
    try {
      // Convert to base64 for API
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Transcribe audio
      const { data: transcriptionData, error: transcriptionError } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });
      
      if (transcriptionError) throw transcriptionError;
      
      const transcribedText = transcriptionData.text;
      setTranscript(transcribedText);
      
      // Analyze the response for training feedback
      const { data: feedbackData, error: feedbackError } = await supabase.functions.invoke('revy-ai-chat', {
        body: {
          message: `Analyser følgende revisorrespons i kontekst av ${scenarioName}: "${transcribedText}". 
                   Gi feedback på:
                   1. Profesjonalitet og kommunikasjonsstil
                   2. Relevante spørsmål stilt
                   3. Revisjonsstandarder dekket (ISA-krav)
                   4. Forbedringsområder
                   5. Score (1-10)
                   
                   Formater som JSON med følgende struktur:
                   {
                     "score": number,
                     "strengths": string[],
                     "improvements": string[],
                     "isa_compliance": string[],
                     "overall_feedback": string
                   }`,
          context: 'training-feedback',
          userRole: 'instructor'
        }
      });
      
      if (feedbackError) throw feedbackError;
      
      try {
        const parsedFeedback = JSON.parse(feedbackData.response);
        setFeedback(parsedFeedback);
        
        if (onComplete) {
          onComplete({
            transcript: transcribedText,
            feedback: parsedFeedback,
            scenarioId,
            timestamp: new Date()
          });
        }
      } catch (parseError) {
        // Fallback to text feedback if JSON parsing fails
        setFeedback({
          score: 7,
          strengths: ["Respons mottatt"],
          improvements: ["Analysering pågår"],
          isa_compliance: [],
          overall_feedback: feedbackData.response
        });
      }
      
      toast({
        title: "Analyse fullført",
        description: "Se din feedback nedenfor",
      });
      
    } catch (error) {
      logger.error('Error processing audio:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke behandle lydopptaket",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetSession = () => {
    setTranscript('');
    setFeedback(null);
    setAudioLevel(0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Stemmetrening: {scenarioName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            {/* Audio Level Visualization */}
            {isRecording && (
              <div className="flex items-center justify-center space-x-2">
                <div className="flex space-x-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-8 rounded-full transition-all ${
                        (audioLevel / 25.5) > i ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <Volume2 className="h-4 w-4 text-green-500" />
              </div>
            )}
            
            {/* Recording Controls */}
            <div className="space-y-4">
              <Button
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
                className="rounded-full w-20 h-20"
              >
                {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
              </Button>
              
              <div className="text-sm text-gray-600">
                {isRecording && "Tar opp... Snakk nå"}
                {isProcessing && "Behandler opptak..."}
                {!isRecording && !isProcessing && "Trykk for å starte opptak"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transcript */}
      {transcript && (
        <Card>
          <CardHeader>
            <CardTitle>Din respons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm italic">"{transcript}"</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback */}
      {feedback && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Feedback & Analyse
              <Badge variant={feedback.score >= 8 ? "default" : feedback.score >= 6 ? "secondary" : "destructive"}>
                Score: {feedback.score}/10
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {feedback.strengths && feedback.strengths.length > 0 && (
              <div>
                <h4 className="font-medium text-green-700 mb-2">Styrker</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {feedback.strengths.map((strength: string, index: number) => (
                    <li key={index} className="text-green-600">{strength}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {feedback.improvements && feedback.improvements.length > 0 && (
              <div>
                <h4 className="font-medium text-orange-700 mb-2">Forbedringsområder</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {feedback.improvements.map((improvement: string, index: number) => (
                    <li key={index} className="text-orange-600">{improvement}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {feedback.isa_compliance && feedback.isa_compliance.length > 0 && (
              <div>
                <h4 className="font-medium text-blue-700 mb-2">ISA-standarder dekket</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {feedback.isa_compliance.map((standard: string, index: number) => (
                    <li key={index} className="text-blue-600">{standard}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {feedback.overall_feedback && (
              <div>
                <h4 className="font-medium mb-2">Generell tilbakemelding</h4>
                <p className="text-sm text-gray-700">{feedback.overall_feedback}</p>
              </div>
            )}
            
            <div className="flex space-x-2 pt-4">
              <Button onClick={resetSession} variant="outline">
                Prøv igjen
              </Button>
              <Button onClick={() => onComplete?.(feedback)}>
                Neste øvelse
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoiceTrainingModule;
