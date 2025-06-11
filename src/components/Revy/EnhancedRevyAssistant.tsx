
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Send, 
  Minimize2, 
  Maximize2, 
  X,
  Bot,
  User,
  Building,
  TrendingUp,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { generateAIResponse } from '@/services/revyService';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import { toast } from '@/components/ui/use-toast';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  context?: string;
}

const EnhancedRevyAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { 
    currentContext, 
    currentClient, 
    currentPhase, 
    isClientContext, 
    contextualData 
  } = useRevyContext();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Generate contextual welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      let welcomeMessage = 'Hei! Jeg er Revy, din intelligente revisjonsassistent. Hvordan kan jeg hjelpe deg i dag?';
      
      if (isClientContext && currentClient) {
        welcomeMessage = `Hei! Jeg er Revy. Jeg ser at du jobber med ${currentClient.companyName} ` +
          `${currentClient.industry ? `(${currentClient.industry})` : ''}. ` +
          `Klienten er i ${currentPhase}-fasen med ${currentClient.progress}% fremdrift. ` +
          `Hvordan kan jeg hjelpe deg med revisjonen?`;
      } else if (currentContext === 'client-overview') {
        welcomeMessage = 'Hei! Jeg ser at du er i klientoversikten. Jeg kan hjelpe deg med ' +
          'klientanalyser, risikovurderinger, eller spørsmål om revisjonsprosessen. Hva lurer du på?';
      }

      setMessages([{
        id: '1',
        content: welcomeMessage,
        isUser: false,
        timestamp: new Date(),
        context: currentContext
      }]);
    }
  }, [isOpen, currentContext, currentClient, currentPhase, isClientContext]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
      context: currentContext
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await generateAIResponse(
        inputValue,
        currentContext,
        contextualData,
        'employee', // Could be dynamic based on user role
        Date.now().toString()
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        isUser: false,
        timestamp: new Date(),
        context: currentContext
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke få svar fra Revy. Prøv igjen senere.",
        variant: "destructive"
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Beklager, jeg opplever tekniske problemer akkurat nå. Prøv igjen om litt.",
        isUser: false,
        timestamp: new Date(),
        context: currentContext
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getContextBadge = () => {
    if (isClientContext && currentClient) {
      return (
        <Badge variant="outline" className="flex items-center gap-1">
          <Building size={12} />
          {currentClient.companyName}
        </Badge>
      );
    }

    const contextLabels = {
      'client-overview': 'Klientoversikt',
      'client-detail': 'Klientdetaljer',
      'accounting-data': 'Regnskapsdata',
      'analysis': 'Analyser',
      'data-upload': 'Dataopplasting',
      'knowledge-base': 'Kunnskapsbase',
      'collaboration': 'Samarbeid',
      'dashboard': 'Dashboard',
      'general': 'Generell'
    };

    return (
      <Badge variant="secondary">
        {contextLabels[currentContext as keyof typeof contextLabels] || 'Ukjent'}
      </Badge>
    );
  };

  const getClientInsights = () => {
    if (!isClientContext || !currentClient) return null;

    return (
      <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-2">
        <div className="flex items-center gap-2 font-medium">
          <Building size={14} />
          Klientkontekst
        </div>
        <div className="space-y-1 text-muted-foreground">
          <div>📊 Fase: {currentPhase}</div>
          <div>📈 Fremdrift: {currentClient.progress}%</div>
          {currentClient.industry && <div>🏢 Bransje: {currentClient.industry}</div>}
        </div>
      </div>
    );
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 rounded-full w-14 h-14 shadow-lg z-50"
        size="lg"
      >
        <MessageCircle size={24} />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-4 right-4 z-50 shadow-xl transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="text-primary" size={20} />
            <CardTitle className="text-lg">Revy</CardTitle>
            {getContextBadge()}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 flex flex-col h-[520px]">
          {getClientInsights()}
          
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!message.isUser && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Bot size={16} className="text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-wrap ${
                      message.isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.isUser && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User size={16} />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-primary animate-pulse" />
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <Separator />

          <div className="p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isClientContext 
                  ? `Spør om ${currentClient?.companyName}...` 
                  : "Skriv melding til Revy..."
                }
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default EnhancedRevyAssistant;
