import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Brain, 
  Send, 
  Loader2, 
  Clock, 
  Zap,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Users,
  FileText,
  Settings
} from 'lucide-react';
import { useAIGlobal } from './AIGlobalProvider';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import { useAIRevyVariants } from '@/hooks/useAIRevyVariants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  variant?: string;
  cached?: boolean;
  processingTime?: number;
}

interface IntelligentAIChatProps {
  className?: string;
  contextData?: any;
  onResponseReceived?: (response: string) => void;
  enableStreaming?: boolean;
  showMetrics?: boolean;
}

const IntelligentAIChat: React.FC<IntelligentAIChatProps> = ({
  className,
  contextData,
  onResponseReceived,
  enableStreaming = true,
  showMetrics = false
}) => {
  const { state: aiState, sendMessage, setContext, setVariant, clearError } = useAIGlobal();
  const { state: revyState } = useRevyContext();
  const { variants, selectedVariant, switchVariant } = useAIRevyVariants(revyState.currentContext);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    responseTime: 0,
    cacheHits: 0,
    totalQueries: 0
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync with global AI variant
  useEffect(() => {
    if (selectedVariant && selectedVariant !== aiState.selectedVariant) {
      setVariant(selectedVariant);
    }
  }, [selectedVariant, aiState.selectedVariant, setVariant]);

  // Handle context changes
  useEffect(() => {
    if (revyState.currentContext !== aiState.currentContext) {
      setContext(revyState.currentContext, {
        ...revyState.contextData,
        ...contextData
      });
    }
  }, [revyState.currentContext, revyState.contextData, contextData, aiState.currentContext, setContext]);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      content: input.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    const startTime = Date.now();

    try {
      // Check if response is cached
      const cacheKey = JSON.stringify({
        message: input.trim(),
        context: aiState.currentContext,
        variant: aiState.selectedVariant?.name
      });
      
      const cachedResponse = aiState.responseCache.get(cacheKey);
      const isFromCache = !!cachedResponse;

      const response = await sendMessage(input.trim(), {
        clientData: contextData,
        streaming: enableStreaming,
        priority: 'normal',
        useCache: true
      });

      const processingTime = Date.now() - startTime;

      const aiMessage: Message = {
        id: `ai_${Date.now()}`,
        content: response,
        sender: 'ai',
        timestamp: new Date(),
        variant: aiState.selectedVariant?.display_name,
        cached: isFromCache,
        processingTime
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Update metrics
      setMetrics(prev => ({
        responseTime: processingTime,
        cacheHits: prev.cacheHits + (isFromCache ? 1 : 0),
        totalQueries: prev.totalQueries + 1
      }));

      onResponseReceived?.(response);
      
      if (isFromCache) {
        toast.success('Hurtig respons fra cache', {
          description: `Svarte på ${processingTime}ms`
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'En feil oppstod';
      
      const errorAiMessage: Message = {
        id: `error_${Date.now()}`,
        content: `⚠️ **Feil:** ${errorMessage}\n\nPrøv å omformulere spørsmålet ditt eller kontakt support hvis problemet vedvarer.`,
        sender: 'ai',
        timestamp: new Date(),
        variant: 'Error'
      };

      setMessages(prev => [...prev, errorAiMessage]);
      
      toast.error('AI-forespørsel feilet', {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, sendMessage, contextData, enableStreaming, aiState, onResponseReceived]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleVariantChange = useCallback((variant: any) => {
    switchVariant(variant);
    toast.info(`Byttet til ${variant.display_name}`, {
      description: variant.description
    });
  }, [switchVariant]);

  const handleRetry = useCallback(() => {
    if (messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.sender === 'user');
      if (lastUserMessage) {
        setInput(lastUserMessage.content);
        inputRef.current?.focus();
      }
    }
  }, [messages]);

  const getConnectionStatusIcon = () => {
    switch (aiState.connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'reconnecting':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <Card className={cn('flex flex-col h-full max-h-[600px]', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Revy</CardTitle>
            {getConnectionStatusIcon()}
          </div>
          
          <div className="flex items-center gap-2">
            {showMetrics && (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {metrics.responseTime}ms
                </div>
                <div className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {metrics.cacheHits}/{metrics.totalQueries}
                </div>
              </div>
            )}
            
            {/* Variant selector */}
            {variants.length > 1 && (
              <select
                value={selectedVariant?.id || ''}
                onChange={(e) => {
                  const variant = variants.find(v => v.id === e.target.value);
                  if (variant) handleVariantChange(variant);
                }}
                className="text-xs border rounded px-2 py-1"
              >
                {variants.map(variant => (
                  <option key={variant.id} value={variant.id}>
                    {variant.display_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        
        <CardDescription>
          {aiState.selectedVariant?.description || 'AI-assistent for revisjon og rådgivning'}
          {aiState.currentContext !== 'general' && (
            <Badge variant="outline" className="ml-2">
              {aiState.currentContext}
            </Badge>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Start en samtale med AI Revy</p>
                <p className="text-xs mt-1">
                  Spør om revisjonsoppgaver, fagstoff, eller klientarbeid
                </p>
              </div>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex',
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {message.content}
                  
                  {/* Message metadata */}
                  <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                    <span>
                      {message.timestamp.toLocaleTimeString('no-NO', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    
                    {message.sender === 'ai' && (
                      <div className="flex items-center gap-1">
                        {message.cached && (
                          <Badge variant="outline" className="text-xs h-4">
                            Cache
                          </Badge>
                        )}
                        {message.variant && (
                          <Badge variant="outline" className="text-xs h-4">
                            {message.variant}
                          </Badge>
                        )}
                        {message.processingTime && (
                          <span>{message.processingTime}ms</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {(isLoading || aiState.isProcessing) && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    {aiState.isStreaming ? 'Strømmer svar...' : 'Tenker...'}
                  </span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Error display */}
        {aiState.lastError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {aiState.lastError}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="text-destructive hover:text-destructive"
            >
              Lukk
            </Button>
          </div>
        )}

        {/* Input area */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Spør AI Revy om hjelp..."
              className="min-h-[60px] resize-none"
              disabled={isLoading || aiState.isProcessing}
            />
            <div className="flex flex-col gap-1">
              <Button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading || aiState.isProcessing}
                size="sm"
                className="h-[60px]"
              >
                {isLoading || aiState.isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
              
              {messages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  className="h-6 text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Quick actions */}
          <div className="flex flex-wrap gap-1">
            {aiState.recentQueries.slice(0, 3).map((query, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setInput(query)}
              >
                {query.length > 20 ? `${query.substring(0, 20)}...` : query}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IntelligentAIChat;