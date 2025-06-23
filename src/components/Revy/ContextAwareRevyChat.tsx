import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  FileText, 
  User, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Brain,
  Lightbulb
} from 'lucide-react';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import { Client } from '@/types/revio';
import { enhancedRevyService } from '@/services/enhancedRevyService';
import RevyInput from './Assistant/RevyInput';

interface ContextAwareRevyChatProps {
  client: Client;
  onClose?: () => void;
  className?: string;
}

const ContextAwareRevyChat: React.FC<ContextAwareRevyChatProps> = ({
  client,
  onClose,
  className = ''
}) => {
  const { documents } = useClientDocuments(client.id);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initial greeting with context
    const contextSummary = buildContextSummary();
    const greeting = `Hei! Jeg er AI-Revi, din intelligente revisjonsassistent. 

Jeg har oversikt over ${client.company_name || client.name} og kan hjelpe deg med:

${contextSummary}

Hva kan jeg hjelpe deg med i dag?`;

    setMessages([{
      sender: 'assistant',
      content: greeting,
      timestamp: new Date()
    }]);
  }, [client, documents]);

  const buildContextSummary = () => {
    const context = [];
    
    if (documents.length > 0) {
      const highConfidenceDocs = documents.filter(d => 
        d.ai_confidence_score && d.ai_confidence_score >= 0.8
      ).length;
      
      context.push(`📊 ${documents.length} dokumenter (${highConfidenceDocs} AI-validerte)`);
    }
    
    if (client.phase) {
      const phaseNames = {
        engagement: 'Oppdrags-fase',
        planning: 'Planlegging',
        execution: 'Gjennomføring', 
        completion: 'Ferdigstillelse',
        reporting: 'Rapportering'
      };
      context.push(`🎯 Fase: ${phaseNames[client.phase] || client.phase}`);
    }
    
    if (client.industry) {
      context.push(`🏢 Bransje: ${client.industry}`);
    }
    
    return context.length > 0 ? context.join('\n') : 'Generell revisjonsrådgivning';
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage = {
      sender: 'user' as const,
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Fix: Map user_id to uploaded_by for ClientDocument compatibility
      const mappedDocuments = documents.map(doc => ({
        ...doc,
        uploaded_by: doc.user_id || doc.uploaded_by || ''
      }));

      const response = await enhancedRevyService.getChatResponse(
        content,
        client,
        mappedDocuments,
        'context-aware'
      );

      const assistantMessage = {
        sender: 'assistant' as const,
        content: response.content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error getting chat response:', error);
      const errorMessage = {
        sender: 'assistant' as const,
        content: 'Beklager, jeg kunne ikke behandle forespørselen din akkurat nå. Prøv igjen.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getContextBadges = () => {
    const badges = [];
    
    if (documents.length > 0) {
      badges.push(
        <Badge key="docs" variant="secondary" className="text-xs">
          <FileText className="h-3 w-3 mr-1" />
          {documents.length} dokumenter
        </Badge>
      );
    }
    
    if (client.phase) {
      badges.push(
        <Badge key="phase" variant="outline" className="text-xs">
          <TrendingUp className="h-3 w-3 mr-1" />
          {client.phase}
        </Badge>
      );
    }
    
    return badges;
  };

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-Revi Kontekst-Chat
          </CardTitle>
          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{client.company_name || client.name}</span>
          {client.org_number && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span>Org.nr: {client.org_number}</span>
            </>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {getContextBadges()}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div
                  className={`text-xs mt-1 opacity-70 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString('no-NO', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 p-3 rounded-lg flex items-center gap-2">
                <div className="animate-spin">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <span>AI-Revi tenker...</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t">
          <RevyInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder="Spør AI-Revi om noe relatert til denne klienten..."
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ContextAwareRevyChat;
