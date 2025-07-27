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
  Upload,
  Camera,
  Image as ImageIcon,
  Package,
  FileText,
  Wine,
  BookOpen,
  CheckSquare,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedRevyMessage, AIAction, ImageAnalysis } from '@/types/enhanced-ai-chat';
import { ActionButton } from './ActionButton';
import { ImageUpload } from './ImageUpload';

interface EnhancedAIChatProps {
  className?: string;
  contextData?: any;
  onResponseReceived?: (response: string) => void;
  enableImageUpload?: boolean;
  showMetrics?: boolean;
}

const EnhancedAIChat: React.FC<EnhancedAIChatProps> = ({
  className,
  contextData,
  onResponseReceived,
  enableImageUpload = true,
  showMetrics = false
}) => {
  const [messages, setMessages] = useState<EnhancedRevyMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    responseTime: 0,
    cacheHits: 0,
    totalQueries: 0
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: EnhancedRevyMessage = {
        id: `welcome_${Date.now()}`,
        sender: 'assistant',
        content: `Hei! Jeg er **AI-Revy**, din smarte assistent. Jeg kan hjelpe deg med:

🖼️ **Bildeanalyse** - Last opp bilder så foreslår jeg relevante handlinger
📋 **Sjekklisteforslag** - Jeg foreslår nye punkter basert på samtalen
🏠 **Hyttefunksjonalitet** - Inventar, vinlager, dokumenter og gjestebok

Bare send en melding eller last opp et bilde for å komme i gang!`,
        timestamp: new Date(),
        actions: []
      };
      setMessages([welcomeMessage]);
    }
  }, []);

  const handleImageUpload = useCallback((file: File) => {
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const clearImage = useCallback(() => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const analyzeImage = async (imageData: string): Promise<ImageAnalysis> => {
    try {
      const { data, error } = await supabase.functions.invoke('enhanced-ai-image-analysis', {
        body: {
          imageData,
          context: 'general'
        }
      });

      if (error) throw error;
      return data.analysis;
    } catch (error) {
      console.error('Error analyzing image:', error);
      // Return fallback analysis
      return {
        type: 'other',
        confidence: 0.5,
        description: 'Kunne ikke analysere bildet automatisk',
        suggestedActions: []
      };
    }
  };

  const generateActionSuggestions = (analysis: ImageAnalysis, userMessage: string): AIAction[] => {
    const actions: AIAction[] = [];

    // Generate actions based on image analysis
    if (analysis.type === 'inventory' && analysis.confidence > 0.6) {
      actions.push({
        id: 'add_to_inventory',
        type: 'inventory',
        title: 'Legg til i inventarlisten',
        description: 'Registrer dette objektet i hyttens inventar',
        icon: 'Package',
        handler: async () => {
          toast.success('Objekt lagt til i inventarlisten');
          // TODO: Implement actual inventory addition
        }
      });
    }

    if (analysis.type === 'document' || analysis.extractedText) {
      actions.push({
        id: 'save_as_document',
        type: 'documents',
        title: 'Legg til under dokumenter',
        description: 'Lagre som dokument i hyttens arkiv',
        icon: 'FileText',
        handler: async () => {
          toast.success('Dokument lagret i arkivet');
          // TODO: Implement document saving
        }
      });
    }

    if (analysis.type === 'wine' || userMessage.toLowerCase().includes('vin')) {
      actions.push({
        id: 'add_to_wine_cellar',
        type: 'wine_cellar',
        title: 'Legg til i vinlagerlisten',
        description: 'Registrer denne vinen i kjelleren',
        icon: 'Wine',
        handler: async () => {
          toast.success('Vin lagt til i lagerlisten');
          // TODO: Implement wine cellar addition
        }
      });
    }

    // General actions always available
    actions.push({
      id: 'save_to_guestbook',
      type: 'guestbook',
      title: 'Lagre som utkast til hytteboka',
      description: 'Lagre dette som en opplevelse i hytteboka',
      icon: 'BookOpen',
      handler: async () => {
        toast.success('Lagret som utkast til hytteboka');
        // TODO: Implement guestbook saving
      }
    });

    return actions;
  };

  const detectChecklistSuggestions = (message: string): AIAction[] => {
    const checklistKeywords = [
      'husk', 'ikke glem', 'må gjøre', 'skal gjøre', 'bør sjekke', 'viktig å',
      'trengs', 'nødvendig', 'sjekkliste', 'todo', 'oppgave'
    ];
    
    const messageLower = message.toLowerCase();
    const hasChecklistKeyword = checklistKeywords.some(keyword => messageLower.includes(keyword));
    
    if (hasChecklistKeyword) {
      return [{
        id: 'add_to_checklist',
        type: 'checklist',
        title: 'Legg til i sjekkliste',
        description: 'Opprett et nytt sjekklistepunkt basert på denne meldingen',
        icon: 'CheckSquare',
        handler: async () => {
          toast.success('Lagt til i sjekklisten');
          // TODO: Implement checklist addition
        }
      }];
    }
    
    return [];
  };

  const handleSendMessage = useCallback(async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMessage = input.trim();
    let imageAnalysis: ImageAnalysis | undefined;
    let imageUrl: string | undefined;

    setInput('');
    setIsLoading(true);
    
    const startTime = Date.now();

    // Handle image upload and analysis
    if (selectedImage) {
      try {
        // Convert image to base64 for analysis
        const reader = new FileReader();
        const imageData = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(selectedImage);
        });

        // Analyze image
        imageAnalysis = await analyzeImage(imageData);
        imageUrl = imagePreview || undefined;
      } catch (error) {
        console.error('Error processing image:', error);
        toast.error('Kunne ikke analysere bildet');
      }
    }

    // Create user message
    const newUserMessage: EnhancedRevyMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      content: userMessage || 'Kan du analysere dette bildet?',
      timestamp: new Date(),
      image: imageUrl ? {
        url: imageUrl,
        analysis: imageAnalysis
      } : undefined
    };

    setMessages(prev => [...prev, newUserMessage]);
    clearImage();

    try {
      // Generate action suggestions
      const actionSuggestions: AIAction[] = [];
      
      if (imageAnalysis) {
        actionSuggestions.push(...generateActionSuggestions(imageAnalysis, userMessage));
      }
      
      actionSuggestions.push(...detectChecklistSuggestions(userMessage));

      // Call enhanced AI function
      const { data, error } = await supabase.functions.invoke('enhanced-ai-chat', {
        body: {
          message: userMessage,
          imageAnalysis,
          context: 'general',
          includeActions: true
        }
      });

      if (error) throw error;

      const processingTime = Date.now() - startTime;

      const aiMessage: EnhancedRevyMessage = {
        id: `ai_${Date.now()}`,
        content: data.response,
        sender: 'assistant',
        timestamp: new Date(),
        actions: actionSuggestions
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Update metrics
      setMetrics(prev => ({
        responseTime: processingTime,
        cacheHits: prev.cacheHits,
        totalQueries: prev.totalQueries + 1
      }));

      onResponseReceived?.(data.response);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'En feil oppstod';
      
      const errorAiMessage: EnhancedRevyMessage = {
        id: `error_${Date.now()}`,
        content: `⚠️ **Feil:** ${errorMessage}\n\nPrøv å omformulere spørsmålet ditt eller kontakt support hvis problemet vedvarer.`,
        sender: 'assistant',
        timestamp: new Date(),
        actions: []
      };

      setMessages(prev => [...prev, errorAiMessage]);
      
      toast.error('AI-forespørsel feilet', {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, selectedImage, imagePreview, onResponseReceived]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const getIconComponent = (iconName: string) => {
    const icons = {
      Package,
      FileText,
      Wine,
      BookOpen,
      CheckSquare
    };
    const IconComponent = icons[iconName as keyof typeof icons];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />;
  };

  return (
    <Card className={cn('flex flex-col h-full max-h-[700px]', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <CardTitle className="text-lg">AI Revy Enhanced</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
          
          {showMetrics && (
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {metrics.responseTime}ms
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {metrics.totalQueries} forespørsler
              </div>
            </div>
          )}
        </div>
        
        <CardDescription>
          AI-assistent med bildeanalyse og smarte handlingsforslag
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Messages */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
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
                  {/* Image display */}
                  {message.image && (
                    <div className="mb-2">
                      <img
                        src={message.image.url}
                        alt={message.image.alt || 'Opplastet bilde'}
                        className="max-w-full h-auto rounded-md"
                        style={{ maxHeight: '200px' }}
                      />
                      {message.image.analysis && (
                        <div className="mt-1 text-xs opacity-70">
                          Gjenkjent som: {message.image.analysis.description}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Message content */}
                  <div dangerouslySetInnerHTML={{ 
                    __html: message.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/## (.*)/g, '<h3 class="font-semibold mt-2 mb-1">$1</h3>')
                      .replace(/- (.*)/g, '<li class="ml-4">$1</li>')
                  }} />
                  
                  {/* Action buttons */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs font-medium opacity-70">Foreslåtte handlinger:</div>
                      <div className="flex flex-wrap gap-2">
                        {message.actions.map((action) => (
                          <ActionButton
                            key={action.id}
                            action={action}
                            icon={getIconComponent(action.icon || 'CheckSquare')}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Message metadata */}
                  <div className="flex items-center justify-between mt-2 text-xs opacity-70">
                    <span>
                      {message.timestamp.toLocaleTimeString('no-NO', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    {selectedImage ? 'Analyserer bilde...' : 'Tenker...'}
                  </span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="space-y-2">
          {/* Image preview */}
          {imagePreview && (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-20 rounded-md border"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={clearImage}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Skriv en melding eller last opp et bilde..."
              className="min-h-[60px] resize-none"
              disabled={isLoading}
            />
            <div className="flex flex-col gap-1">
              {enableImageUpload && (
                <ImageUpload
                  onImageSelect={handleImageUpload}
                  disabled={isLoading}
                  ref={fileInputRef}
                />
              )}
              <Button
                onClick={handleSendMessage}
                disabled={(!input.trim() && !selectedImage) || isLoading}
                size="sm"
                className="h-[40px]"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedAIChat;