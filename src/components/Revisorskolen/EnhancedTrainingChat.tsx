import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  BookOpen, 
  Lightbulb,
  User,
  Bot,
  FileText,
  Clock,
  Star
} from 'lucide-react';

// Reuse existing hooks and services
import { useTrainingContext } from '@/hooks/useTrainingContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EnhancedTrainingChatProps {
  sessionId: string;
  onInsightGenerated?: (insight: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  relatedArticles?: string[];
  suggestedActions?: string[];
}

interface ContextHint {
  type: 'article' | 'action' | 'insight';
  title: string;
  content: string;
  relevance: number;
}

export const EnhancedTrainingChat: React.FC<EnhancedTrainingChatProps> = ({
  sessionId,
  onInsightGenerated
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contextHints, setContextHints] = useState<ContextHint[]>([]);
  const [showContextPanel, setShowContextPanel] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: context } = useTrainingContext(sessionId);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Generate context hints based on training session
  useEffect(() => {
    if (context) {
      const hints: ContextHint[] = [];
      
      // Add article hints
      context.library?.slice(0, 2).forEach((article: any) => {
        hints.push({
          type: 'article',
          title: article.title,
          content: article.summary || 'Relevant fagartikkel for denne økten',
          relevance: 0.9
        });
      });

      // Add action hints
      context.actions?.slice(0, 2).forEach((action: any) => {
        hints.push({
          type: 'action',
          title: action.name,
          content: action.description || 'Tilgjengelig handlingsalternativ',
          relevance: 0.8
        });
      });

      // Add general insights
      hints.push({
        type: 'insight',
        title: 'Treningsfokus',
        content: context.session?.description || 'Fokusområde for denne økten',
        relevance: 1.0
      });

      setContextHints(hints);
    }
  }, [context]);

  // Initialize chat with welcome message
  useEffect(() => {
    if (context && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `🎓 Velkommen til treningsøkten "${context.session?.title}"!

Jeg er din personlige revisor-veileder og vil hjelpe deg gjennom denne praktiske økten. 

📋 **Dagens fokus:** ${context.session?.description || 'Praktisk revisjonsarbeid'}

💡 **Tips:** Still spørsmål underveis, og jeg vil guide deg med pedagogiske tilbakemeldinger og konkrete eksempler.

Hva ønsker du å starte med?`,
        timestamp: new Date().toISOString(),
        suggestedActions: context.actions?.slice(0, 3).map((a: any) => a.name) || []
      };
      
      setMessages([welcomeMessage]);
    }
  }, [context, messages.length]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Send to enhanced AI chat with training context
      const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
        body: {
          message: inputMessage.trim(),
          mode: 'training',
          sessionId: sessionId,
          conversationHistory: messages.slice(-4), // Last 4 messages for context
          sessionTitle: context?.session?.title
        }
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
        relatedArticles: data.relatedArticles,
        suggestedActions: data.suggestedActions
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Generate insights based on conversation
      if (data.insights) {
        onInsightGenerated?.(data.insights);
      }

    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Feil i chat",
        description: "Kunne ikke sende melding. Prøv igjen.",
        variant: "destructive"
      });

      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Beklager, jeg kunne ikke behandle din melding akkurat nå. Kan du prøve igjen?',
        timestamp: new Date().toISOString()
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

  const handleContextHintClick = (hint: ContextHint) => {
    let messageContent = '';
    
    switch (hint.type) {
      case 'article':
        messageContent = `Kan du forklare mer om "${hint.title}" og hvordan det relaterer til denne økten?`;
        break;
      case 'action':
        messageContent = `Hva innebærer handlingen "${hint.title}" i praksis?`;
        break;
      case 'insight':
        messageContent = `Kan du gi meg mer dypgående informasjon om ${hint.title.toLowerCase()}?`;
        break;
    }
    
    setInputMessage(messageContent);
  };

  const getHintIcon = (type: string) => {
    switch (type) {
      case 'article': return <FileText className="h-4 w-4" />;
      case 'action': return <Lightbulb className="h-4 w-4" />;
      case 'insight': return <Star className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getHintColor = (type: string) => {
    switch (type) {
      case 'article': return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'action': return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      case 'insight': return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };

  return (
    <div className="flex gap-4 h-[600px]">
      {/* Main Chat Area */}
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            AI-veileder
          </CardTitle>
          <CardDescription>
            Personlig revisor-mentor for praktisk læring
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col gap-4 p-4">
          {/* Messages */}
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {message.role === 'user' ? 
                      <User className="h-4 w-4" /> : 
                      <Bot className="h-4 w-4" />
                    }
                  </div>
                  
                  <div className={`flex-1 max-w-[80%] ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    <div className={`p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground ml-auto'
                        : 'bg-muted'
                    }`}>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      
                      {/* Related articles */}
                      {message.relatedArticles && message.relatedArticles.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-current/20">
                          <div className="text-xs opacity-80 mb-1">Relaterte artikler:</div>
                          <div className="space-y-1">
                            {message.relatedArticles.map((article, index) => (
                              <Badge key={index} variant="outline" className="text-xs mr-1">
                                <FileText className="h-3 w-3 mr-1" />
                                {article}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Suggested actions */}
                      {message.suggestedActions && message.suggestedActions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-current/20">
                          <div className="text-xs opacity-80 mb-1">Foreslåtte neste steg:</div>
                          <div className="space-y-1">
                            {message.suggestedActions.map((action, index) => (
                              <Badge key={index} variant="outline" className="text-xs mr-1">
                                <Lightbulb className="h-3 w-3 mr-1" />
                                {action}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(message.timestamp).toLocaleTimeString('nb-NO', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
                        <span className="text-sm text-muted-foreground ml-2">Veilederen tenker...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Still et spørsmål eller be om veiledning..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Context Panel */}
      {showContextPanel && (
        <Card className="w-80 flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Kontekst & tips</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowContextPanel(false)}
              >
                ×
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-4">
            {/* Session Info */}
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium">{context?.session?.title}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {context?.library?.length || 0} artikler • {context?.actions?.length || 0} handlinger
              </div>
            </div>

            {/* Context Hints */}
            <div className="space-y-2">
              <div className="text-sm font-medium mb-2">Kontekstuelle tips</div>
              {contextHints.map((hint, index) => (
                <button
                  key={index}
                  onClick={() => handleContextHintClick(hint)}
                  className={`w-full text-left p-2 rounded-lg border text-xs transition-colors ${getHintColor(hint.type)}`}
                >
                  <div className="flex items-start gap-2">
                    {getHintIcon(hint.type)}
                    <div className="flex-1">
                      <div className="font-medium">{hint.title}</div>
                      <div className="opacity-80 mt-1">{hint.content}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm font-medium mb-2">Hurtig-tips</div>
              <div className="space-y-1 text-xs">
                <div className="p-2 bg-blue-50 text-blue-700 rounded">
                  💡 Still "Hvorfor?" spørsmål for dypere forståelse
                </div>
                <div className="p-2 bg-green-50 text-green-700 rounded">
                  🔍 Be om praktiske eksempler fra revisjonsarbeid
                </div>
                <div className="p-2 bg-purple-50 text-purple-700 rounded">
                  📚 Referer til fagbiblioteket for dypere læring
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Show context button when panel is hidden */}
      {!showContextPanel && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowContextPanel(true)}
          className="self-start"
        >
          <BookOpen className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};