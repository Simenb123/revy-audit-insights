import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MinusCircle, 
  SendIcon, 
  X, 
  Loader2, 
  AlertCircle, 
  Lightbulb,
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';
import RevyAvatar from './RevyAvatar';
import ActionableMessage from './ActionableMessage';
import { useToast } from '@/hooks/use-toast';
import { useRevyContext } from '../RevyContext/RevyContextProvider';
import { generateAIResponse, getContextualTip } from '@/services/revyService';
import { enhanceAIResponse, generateProactiveActions } from '@/services/revyEnhancementService';
import { RevyMessage } from '@/types/revio';
import { useAuth } from '@/components/Auth/AuthProvider';

interface EnhancedRevyAssistantProps {
  embedded?: boolean;
  clientData?: any;
  userRole?: string;
}

interface ProactiveSuggestion {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'risk' | 'efficiency' | 'quality' | 'timeline';
  action?: string;
}

const EnhancedRevyAssistant = ({ embedded = false, clientData, userRole }: EnhancedRevyAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [proactiveSuggestions, setProactiveSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [guestMode, setGuestMode] = useState(false);
  const [messages, setMessages] = useState<RevyMessage[]>([]);
  const { toast } = useToast();
  const { currentContext } = useRevyContext();
  const { session, user } = useAuth();

  // Initialize with appropriate welcome message
  useEffect(() => {
    const isGuest = !session?.user?.id;
    setGuestMode(isGuest);
    
    const welcomeMessage = isGuest 
      ? 'Hei! Jeg er Revy, din AI-revisjonsassistent. Du bruker gjestmodus med begrenset funksjonalitet. Logg inn for full tilgang til alle funksjoner!'
      : 'Hei! Jeg er Revy, din forbedrede AI-revisjonsassistent. Jeg har tilgang til utvidet fagstoff, klientdata og kan gi proaktive forslag. Hvordan kan jeg hjelpe deg i dag?';

    setMessages([{
      id: '1',
      content: welcomeMessage,
      timestamp: new Date().toISOString(),
      sender: 'revy'
    }]);
  }, [session]);

  // Generate proactive suggestions based on context and client data
  useEffect(() => {
    generateProactiveSuggestions();
  }, [currentContext, clientData]);

  // Enhanced connectivity monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Enhanced proactive suggestions with audit process intelligence
  const generateProactiveSuggestions = useCallback(async () => {
    const suggestions: ProactiveSuggestion[] = [];

    // Import audit process service
    const { analyzeAuditProcess } = await import('@/services/revyAuditProcessService');

    try {
      // Get audit process insights if we have client data
      if (clientData && clientData.id && !guestMode) {
        const auditInsights = await analyzeAuditProcess(clientData, userRole);
        
        // Generate suggestions based on audit insights
        if (auditInsights.requiredActions.length > 0) {
          suggestions.push({
            id: 'required-action',
            title: 'Manglende handlinger',
            description: `${auditInsights.requiredActions.length} påkrevde handlinger mangler`,
            priority: 'high',
            category: 'quality',
            action: `Hjelp meg med å identifisere og planlegge de manglende handlingene: ${auditInsights.requiredActions.join(', ')}`
          });
        }
        
        if (auditInsights.riskAreas.length > 0) {
          suggestions.push({
            id: 'risk-areas',
            title: 'Risikoområder',
            description: `${auditInsights.riskAreas.length} risikoområder krever oppmerksomhet`,
            priority: 'high',
            category: 'risk',
            action: `Gi meg veiledning om risikoområdene: ${auditInsights.riskAreas.join(', ')}`
          });
        }
        
        if (auditInsights.completionRate < 50) {
          suggestions.push({
            id: 'progress',
            title: 'Fremdrift',
            description: `Kun ${auditInsights.completionRate}% fullført - trenger optimalisering`,
            priority: 'medium',
            category: 'timeline',
            action: `Hjelp meg med å forbedre fremdriften på revisjonen. Gjeldende status er ${auditInsights.completionRate}% fullført`
          });
        }
        
        // Add next steps as suggestions
        if (auditInsights.nextSteps.length > 0) {
          suggestions.push({
            id: 'next-steps',
            title: 'Neste steg',
            description: auditInsights.nextSteps[0],
            priority: 'medium',
            category: 'efficiency',
            action: `Gi meg detaljert veiledning om: ${auditInsights.nextSteps[0]}`
          });
        }
      }
    } catch (error) {
      console.error('Error generating audit process suggestions:', error);
    }

    // Keep existing context-based suggestions as fallback
    if (currentContext === 'risk-assessment') {
      suggestions.push({
        id: 'risk-1',
        title: 'Automatisk risikoanalyse',
        description: 'Skal jeg analysere klientens risikoområder basert på bransje og størrelse?',
        priority: 'high',
        category: 'risk',
        action: 'Analyser risikoområder for denne klienten basert på bransje og historiske data'
      });
    }

    if (currentContext === 'client-detail' && clientData) {
      suggestions.push({
        id: 'client-1',
        title: 'Bransjesammenligning',
        description: `Sammenlign ${clientData.company_name} med bransjegjennomsnitt`,
        priority: 'medium',
        category: 'efficiency',
        action: `Gi meg en bransjesammenligning for ${clientData.company_name} innen ${clientData.industry}`
      });

      if (clientData.progress && clientData.progress < 50) {
        suggestions.push({
          id: 'timeline-1',
          title: 'Fremdriftsoptimalisering',
          description: 'Klienten er kun ' + clientData.progress + '% ferdig. Trenger du hjelp med prioritering?',
          priority: 'high',
          category: 'timeline',
          action: 'Hjelp meg med å prioritere revisjonsoppgaver for å øke fremdriften'
        });
      }
    }

    // Role-based suggestions with audit process focus
    if (userRole === 'partner') {
      suggestions.push({
        id: 'partner-1',
        title: 'Strategisk review',
        description: 'Gjennomfør strategisk review av revisjonstilnærming og kvalitet',
        priority: 'medium',
        category: 'quality',
        action: 'Gi meg en sjekkliste for strategisk review av revisjonsoppdraget'
      });
    } else if (userRole === 'manager') {
      suggestions.push({
        id: 'manager-1',
        title: 'Teamkoordinering',
        description: 'Optimaliser teamressurser og fremdriftsoppfølging',
        priority: 'medium',
        category: 'efficiency',
        action: 'Hjelp meg med å koordinere teamet og overvåke revisjonsfremdrift'
      });
    }

    setProactiveSuggestions(suggestions.slice(0, 3)); // Limit to 3 suggestions
  }, [currentContext, clientData, userRole, guestMode]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || message;
    if (!textToSend.trim() || isTyping) return;
    
    const userMessage: RevyMessage = { 
      id: Date.now().toString(), 
      content: textToSend,
      timestamp: new Date().toISOString(),
      sender: 'user'
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setMessage('');
    setIsTyping(true);
    setShowSuggestions(false);
    
    try {
      console.log('🚀 Sending enhanced AI request with audit process context...', { guestMode });
      
      // Enhanced AI response with audit process integration
      const responseText = await generateAIResponse(
        userMessage.content, 
        currentContext,
        guestMode ? null : {
          ...clientData,
          // Add audit-specific context
          subject_area: extractSubjectArea(userMessage.content),
          phase: clientData?.phase || 'planning'
        },
        guestMode ? 'guest' : userRole,
        sessionId
      );
      
      // Enhance the response with actionable content
      const enhancedResponse = enhanceAIResponse(responseText, currentContext, clientData);
      
      const revyResponse: RevyMessage = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        timestamp: new Date().toISOString(),
        sender: 'revy',
        enhanced: enhancedResponse // Add enhanced data to message
      };
      
      setMessages(prev => [...prev, revyResponse]);
      setRetryCount(0);
      
      // Regenerate suggestions after interaction
      setTimeout(generateProactiveSuggestions, 1000);
      
      // Show success feedback
      if (!embedded) {
        toast({
          title: guestMode ? "Revy svarte (gjestmodus)" : "Revy svarte med faglige referanser",
          description: guestMode ? "Begrenset funksjonalitet i gjestmodus" : "AI-assistenten ga deg et svar med fagstoff og prosessveiledning",
          duration: 2000
        });
      }
      
    } catch (error) {
      console.error('💥 Error getting AI response:', error);
      
      // Enhanced error handling with retry logic (only if not in guest mode)
      if (retryCount < 2 && isOnline && !guestMode) {
        setRetryCount(prev => prev + 1);
        toast({
          title: "Prøver på nytt...",
          description: `Forsøk ${retryCount + 1} av 3`,
          duration: 2000
        });
        
        // Retry after a short delay
        setTimeout(() => handleSendMessage(textToSend), 2000);
        return;
      }
      
      // Intelligent fallback response
      const fallbackResponse: RevyMessage = {
        id: (Date.now() + 1).toString(),
        content: getIntelligentFallback(error, currentContext, guestMode ? 'guest' : userRole),
        timestamp: new Date().toISOString(),
        sender: 'revy'
      };
      
      setMessages(prev => [...prev, fallbackResponse]);
      setRetryCount(0);
      
      toast({
        title: guestMode ? "Gjestmodus-begrensning" : "AI-feil",
        description: guestMode ? "Logg inn for bedre funksjonalitet" : "Bruker fallback-respons. Prøv igjen senere.",
        variant: guestMode ? "default" : "destructive",
        duration: 5000
      });
    } finally {
      setIsTyping(false);
    }
  };

  const extractSubjectArea = (messageContent: string): string | undefined => {
    const content = messageContent.toLowerCase();
    const subjectMappings = {
      'revenue': ['omsetning', 'inntekt', 'salg'],
      'expenses': ['kostnader', 'utgifter', 'lønn'],
      'assets': ['eiendeler', 'anleggsmidler', 'varelager'],
      'liabilities': ['gjeld', 'forpliktelser'],
      'equity': ['egenkapital', 'aksjekapital'],
      'cash': ['kontanter', 'bank', 'likviditet']
    };
    
    for (const [area, keywords] of Object.entries(subjectMappings)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        return area;
      }
    }
    
    return undefined;
  };

  const getIntelligentFallback = (error: any, context: string, role: string): string => {
    if (role === 'guest') {
      return 'Som gjest har du begrenset tilgang til AI-assistenten. Logg inn for full funksjonalitet og tilgang til personaliserte svar basert på dine klienter og prosjekter.';
    }

    const fallbacks = {
      'risk-assessment': 'Jeg har tekniske problemer, men her er noen generelle tips for risikovurdering: Start med å identifisere klientens bransje og nøkkelrisikoer. Vurder materialitetsnivå basert på størrelse og kompleksitet. Se ISA 315 for detaljerte retningslinjer.',
      'documentation': 'Tekniske problemer oppstått. For dokumentasjon, husk: ISA 230 krever at all dokumentasjon skal være tilstrekkelig og hensiktsmessig for å støtte revisjonskonklusjoner. Strukturer arbeidspapirene logisk og inkluder alle vesentlige vurderinger.',
      'client-detail': 'Midlertidig feil. For klientanalyse, se på nøkkeltall som omsetningsvekst, lønnsomhet og likviditet. Sammenlign med bransjegjennomsnitt og vurder trender over tid.',
      'collaboration': 'Teknisk feil. For teamarbeid: Sørg for klar rollefordeling, regelmessig kommunikasjon og dokumenterte beslutninger. Bruk standardiserte maler for konsistens.',
      'general': 'Jeg opplever tekniske problemer. Prøv igjen om litt, eller kontakt support hvis problemet vedvarer.'
    };
    
    const roleSpecific = role === 'partner' ? 
      ' Som partner bør du også vurdere klientporteføljens samlede risiko og strategiske implikasjoner.' :
      role === 'manager' ? 
      ' Som manager, sørg for at teamet følger etablerte prosedyrer og kvalitetsstandarder.' :
      ' Kontakt din manager hvis du trenger ytterligere veiledning eller støtte.';
    
    return (fallbacks[context as keyof typeof fallbacks] || fallbacks.general) + roleSpecific;
  };

  const handleSuggestionClick = (suggestion: ProactiveSuggestion) => {
    if (suggestion.action) {
      handleSendMessage(suggestion.action);
    }
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
      setShowSuggestions(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isTyping) {
      handleSendMessage();
    }
  };

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className={`flex items-center gap-1 text-xs ${
      guestMode ? 'text-orange-600' : 
      isOnline ? 'text-green-600' : 'text-red-600'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        guestMode ? 'bg-orange-500' : 
        isOnline ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
      {guestMode ? 'Gjest' : isOnline ? 'Online' : 'Offline'}
    </div>
  );

  // Proactive suggestions component
  const ProactiveSuggestions = () => (
    showSuggestions && proactiveSuggestions.length > 0 && (
      <div className="p-3 border-b bg-blue-50">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">Forslag fra Revy</span>
        </div>
        <div className="space-y-2">
          {proactiveSuggestions.map((suggestion) => (
            <div 
              key={suggestion.id}
              className="p-2 bg-white rounded border cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{suggestion.title}</span>
                    <Badge 
                      variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {suggestion.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                </div>
                <div className="ml-2">
                  {suggestion.category === 'risk' && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {suggestion.category === 'efficiency' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {suggestion.category === 'timeline' && <Clock className="h-4 w-4 text-orange-500" />}
                  {suggestion.category === 'quality' && <Users className="h-4 w-4 text-blue-500" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  );

  // Enhanced message rendering component
  const MessageContent = ({ msg }: { msg: RevyMessage }) => {
    if (msg.sender === 'revy' && msg.enhanced) {
      return (
        <ActionableMessage 
          content={msg.enhanced.content}
          links={msg.enhanced.links}
          sources={msg.enhanced.sources}
        />
      );
    }
    return <div className="whitespace-pre-wrap">{msg.content}</div>;
  };

  // Embedded mode
  if (embedded) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-2 border-b flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <RevyAvatar size="xs" />
            <span className="text-sm font-medium">Revy AI</span>
          </div>
          <ConnectionStatus />
        </div>
        
        {showSuggestions && proactiveSuggestions.length > 0 && (
          <div className="p-2 border-b bg-blue-50 flex-shrink-0">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Forslag fra Revy</span>
            </div>
            <div className="space-y-2">
              {proactiveSuggestions.map((suggestion) => (
                <div 
                  key={suggestion.id}
                  className="p-2 bg-white rounded border cursor-pointer hover:bg-blue-50 transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{suggestion.title}</span>
                        <Badge 
                          variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {suggestion.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{suggestion.description}</p>
                    </div>
                    <div className="ml-2">
                      {suggestion.category === 'risk' && <AlertCircle className="h-4 w-4 text-red-500" />}
                      {suggestion.category === 'efficiency' && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {suggestion.category === 'timeline' && <Clock className="h-4 w-4 text-orange-500" />}
                      {suggestion.category === 'quality' && <Users className="h-4 w-4 text-blue-500" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Messages with proper height management */}
        <div className="flex-1 min-h-0">
          <div className="h-full flex flex-col">
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-3 bg-gray-50">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.sender === 'revy' && (
                      <div className="flex items-end gap-2 max-w-[90%]">
                        <RevyAvatar size="xs" />
                        <div className="bg-white border border-gray-200 p-2 rounded-lg rounded-bl-none shadow-sm text-sm">
                          <MessageContent msg={msg} />
                        </div>
                      </div>
                    )}
                    
                    {msg.sender === 'user' && (
                      <div className="bg-blue-100 text-blue-900 p-2 rounded-lg rounded-br-none max-w-[90%] text-sm">
                        {msg.content}
                      </div>
                    )}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-end gap-2 max-w-[90%]">
                      <RevyAvatar size="xs" />
                      <div className="bg-white border border-gray-200 p-2 rounded-lg rounded-bl-none shadow-sm text-sm flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Analyserer...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Input fixed at bottom */}
            <div className="p-2 bg-white border-t flex-shrink-0">
              <div className="flex gap-1">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isOnline ? "Skriv en melding..." : "Offline - prøv igjen senere"}
                  className="flex-1 text-xs h-8"
                  disabled={isTyping || !isOnline}
                />
                <Button 
                  size="sm" 
                  onClick={() => handleSendMessage()} 
                  className="bg-revio-500 hover:bg-revio-600 h-8 w-8 p-0"
                  disabled={isTyping || !message.trim() || !isOnline}
                >
                  {isTyping ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <SendIcon size={12} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Floating mode (keep existing structure with enhancements)
  return (
    <>
      {!isOpen && (
        <motion.div 
          className="fixed bottom-4 right-4 z-50"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          onClick={toggleOpen}
        >
          <div className="relative">
            <RevyAvatar size="lg" className="cursor-pointer hover:shadow-lg transition-shadow duration-300" />
            {!isOnline && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="h-2 w-2 text-white" />
              </div>
            )}
            {proactiveSuggestions.length > 0 && isOnline && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">{proactiveSuggestions.length}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed bottom-0 right-0 z-50 w-80 bg-white shadow-xl rounded-tl-2xl overflow-hidden flex flex-col"
            style={{ height: isMinimized ? '48px' : '500px' }}
            initial={{ y: 500, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 500, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Enhanced Header */}
            <div className="bg-revio-500 text-white p-2 flex items-center justify-between cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
              <div className="flex items-center gap-2">
                <RevyAvatar size="sm" />
                <div>
                  <span className="font-medium">Revy AI</span>
                  <div className="text-xs opacity-80">
                    <ConnectionStatus />
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-revio-600">
                  <MinusCircle size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-revio-600" onClick={(e) => { e.stopPropagation(); toggleOpen(); }}>
                  <X size={16} />
                </Button>
              </div>
            </div>
            
            {!isMinimized && (
              <>
                <ProactiveSuggestions />
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.sender === 'revy' && (
                        <div className="flex items-end gap-2">
                          <RevyAvatar size="xs" />
                          <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none max-w-[85%] shadow-sm">
                            <MessageContent msg={msg} />
                          </div>
                        </div>
                      )}
                      
                      {msg.sender === 'user' && (
                        <div className="bg-blue-100 text-blue-900 p-3 rounded-2xl rounded-br-none max-w-[85%]">
                          {msg.content}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex items-end gap-2">
                        <RevyAvatar size="xs" />
                        <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Analyserer...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Enhanced Input */}
                <div className="p-3 bg-white border-t">
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={isOnline ? "Skriv en melding..." : "Offline - prøv igjen senere"}
                      className="flex-1"
                      disabled={isTyping || !isOnline}
                    />
                    <Button 
                      size="icon" 
                      onClick={() => handleSendMessage()} 
                      className="bg-revio-500 hover:bg-revio-600"
                      disabled={isTyping || !message.trim() || !isOnline}
                    >
                      {isTyping ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SendIcon size={16} />
                      )}
                    </Button>
                  </div>
                  {retryCount > 0 && (
                    <div className="text-xs text-orange-600 mt-1">
                      Prøver igjen... (forsøk {retryCount} av 3)
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EnhancedRevyAssistant;
