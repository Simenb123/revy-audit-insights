
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MinusCircle, SendIcon, X, Loader2, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import RevyAvatar from './RevyAvatar';
import { useToast } from '@/hooks/use-toast';
import { useRevyContext } from '../RevyContext/RevyContextProvider';
import { generateAIResponse } from '@/services/revyService';
import { detectEnhancedContext, getEnhancedContextualTips, buildEnhancedMessage } from '@/services/enhancedRevyService';
import { seedKnowledgeBase } from '@/services/knowledgeSeederService';
import { RevyMessage, RevyContext } from '@/types/revio';
import { useLocation } from 'react-router-dom';

interface SmartRevyAssistantProps {
  embedded?: boolean;
  clientData?: any;
  userRole?: string;
}

const SmartRevyAssistant = ({ embedded = false, clientData, userRole }: SmartRevyAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [currentTip, setCurrentTip] = useState('');
  const [knowledgeSeeded, setKnowledgeSeeded] = useState(false);
  const [messages, setMessages] = useState<RevyMessage[]>([]);
  const { toast } = useToast();
  const { currentContext } = useRevyContext();
  const location = useLocation();
  
  // Enhanced context detection
  const enhancedContext = detectEnhancedContext(location.pathname, clientData);
  
  // Initialize with smart welcome message
  useEffect(() => {
    const initializeAssistant = async () => {
      if (messages.length === 0) {
        // Seed knowledge base on first load
        if (!knowledgeSeeded) {
          await seedKnowledgeBase();
          setKnowledgeSeeded(true);
        }

        // Get contextual tip
        const tip = await getEnhancedContextualTips(enhancedContext, clientData, userRole);
        setCurrentTip(tip);

        const welcomeMessage: RevyMessage = {
          id: '1',
          content: `Hei! Jeg er Revy, din AI-drevne revisjonsassistent. Jeg er nå oppgradert med tilgang til appens kunnskapsbase og kan gi deg mye bedre veiledning!

${tip}

Noen eksempler på hva du kan spørre meg om:
• "Hvordan kommer jeg i gang med Revio?"
• "Hvordan legger jeg til en ny klient?"
• "Hva er ISA 315 og hvordan bruker jeg den?"
• "Hvilke revisjonshandlinger bør jeg utføre for denne klienten?"`,
          timestamp: new Date().toISOString(),
          sender: 'revy'
        };
        
        setMessages([welcomeMessage]);
      }
    };

    initializeAssistant();
  }, [enhancedContext, clientData, userRole, messages.length, knowledgeSeeded]);

  // Update tip when context changes
  useEffect(() => {
    const updateTip = async () => {
      if (messages.length > 0) {
        const tip = await getEnhancedContextualTips(enhancedContext, clientData, userRole);
        setCurrentTip(tip);
        
        // Add contextual message when context changes significantly
        const contextMessage: RevyMessage = {
          id: Date.now().toString(),
          content: `💡 Jeg ser at du har byttet til ${getContextDisplayName(enhancedContext)}. ${tip}`,
          timestamp: new Date().toISOString(),
          sender: 'revy'
        };
        
        setMessages(prev => [...prev, contextMessage]);
      }
    };

    updateTip();
  }, [enhancedContext, clientData?.id]);

  const getContextDisplayName = (context: RevyContext): string => {
    const names: Record<RevyContext, string> = {
      'dashboard': 'dashboard',
      'client-overview': 'klientoversikt',
      'client-detail': 'klientdetaljer',
      'audit-actions': 'revisjonshandlinger',
      'risk-assessment': 'risikovurdering',
      'documentation': 'dokumentasjon',
      'collaboration': 'samarbeid',
      'communication': 'kommunikasjon',
      'team-management': 'teamledelse',
      'drill-down': 'dataanalyse',
      'mapping': 'kontomapping',
      'general': 'hovedområdet'
    };
    return names[context] || context;
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isTyping) return;
    
    const userMessage: RevyMessage = { 
      id: Date.now().toString(), 
      content: message,
      timestamp: new Date().toISOString(),
      sender: 'user'
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setMessage('');
    setIsTyping(true);
    
    try {
      // Build enhanced message with context
      const { message: enhancedMessage, enhancedContext: fullContext } = await buildEnhancedMessage(
        userMessage.content,
        enhancedContext,
        clientData,
        userRole
      );

      console.log('🧠 Sending enhanced message with context:', fullContext);
      
      // Generate AI response with enhanced context
      const responseText = await generateAIResponse(
        enhancedMessage, 
        enhancedContext,
        fullContext,
        userRole,
        sessionId
      );
      
      // Simulate streaming response
      const revyMessageId = (Date.now() + 1).toString();
      const initialRevyResponse: RevyMessage = {
        id: revyMessageId,
        content: '',
        timestamp: new Date().toISOString(),
        sender: 'revy'
      };
      
      setMessages(prev => [...prev, initialRevyResponse]);

      const words = responseText.split(' ');
      for (let i = 0; i < words.length; i++) {
        // A short delay to simulate typing
        await new Promise(r => setTimeout(r, 50));
        setMessages(prev => prev.map(msg => 
          msg.id === revyMessageId 
            ? { ...msg, content: words.slice(0, i + 1).join(' ') }
            : msg
        ));
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const fallbackResponse: RevyMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Beklager, jeg opplever tekniske problemer akkurat nå. Men jeg kan fortsatt hjelpe deg med grunnleggende spørsmål om Revio og revisjonsmetodikk. Prøv å spørre meg om ISA-standarder, klientadministrasjon eller appfunksjonalitet.',
        timestamp: new Date().toISOString(),
        sender: 'revy'
      };
      
      setMessages(prev => [...prev, fallbackResponse]);
      
      toast({
        title: "AI-feil",
        description: "Kunne ikke få svar fra AI-assistenten",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isTyping) {
      handleSendMessage();
    }
  };

  // Suggestions for common questions
  const suggestions = [
    "Hvordan legger jeg til en ny klient?",
    "Hva er ISA 315?",
    "Vis meg revisjonshandlinger for denne klienten",
    "Hvordan bruker jeg Revio effektivt?"
  ];

  // Embedded mode for sidebar
  if (embedded) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Smart status indicator */}
        <div className="p-2 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <div className="flex items-center gap-2 text-xs">
            <Sparkles className="h-3 w-3 text-blue-500" />
            <span className="text-blue-700 font-medium">AI Oppgradert</span>
            <Badge variant="secondary" className="text-xs">Smart kontekst</Badge>
          </div>
        </div>

        {/* Current context tip */}
        {currentTip && (
          <div className="p-2 bg-blue-50 border-b">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-blue-700">{currentTip}</p>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'revy' && (
                <div className="flex items-end gap-2 max-w-[90%]">
                  <RevyAvatar size="xs" />
                  <div className="bg-white border border-gray-200 p-2 rounded-lg rounded-bl-none shadow-sm text-sm">
                    {msg.content}
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
                  Analyserer med AI...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick suggestions */}
        {messages.length <= 2 && (
          <div className="p-2 border-t bg-gray-50">
            <div className="space-y-1">
              {suggestions.slice(0, 2).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setMessage(suggestion)}
                  className="text-xs text-blue-600 hover:text-blue-800 block truncate text-left w-full p-1 hover:bg-blue-50 rounded"
                >
                  💡 {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Input */}
        <div className="p-2 bg-white border-t">
          <div className="flex gap-1">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Spør meg om Revio eller revisjon..."
              className="flex-1 text-xs h-8"
              disabled={isTyping}
            />
            <Button 
              size="sm" 
              onClick={handleSendMessage} 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 h-8 w-8 p-0"
              disabled={isTyping || !message.trim()}
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
    );
  }

  // Original floating mode (keep existing code for backwards compatibility)
  return (
    <>
      {/* Floating button when closed */}
      {!isOpen && (
        <motion.div 
          className="fixed bottom-4 right-4 z-50"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          onClick={toggleOpen}
        >
          <div className="relative">
            <RevyAvatar size="lg" className="cursor-pointer hover:shadow-lg transition-shadow duration-300 animate-bounce-limited" />
            {/* Smart indicator */}
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full p-1">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Enhanced chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed bottom-0 right-0 z-50 w-96 bg-white shadow-xl rounded-tl-2xl overflow-hidden flex flex-col border-2 border-gradient-to-r from-blue-200 to-purple-200"
            style={{ height: isMinimized ? '48px' : '500px' }}
            initial={{ y: 400, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 400, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Enhanced header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 flex items-center justify-between cursor-pointer" onClick={toggleMinimize}>
              <div className="flex items-center gap-2">
                <RevyAvatar size="sm" />
                <div>
                  <span className="font-medium">Revy AI-Assistent</span>
                  <div className="flex items-center gap-1 text-xs opacity-90">
                    <Sparkles className="h-3 w-3" />
                    <span>Oppgradert med kontekst</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); toggleMinimize(); }}>
                  <MinusCircle size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={(e) => { e.stopPropagation(); toggleOpen(); }}>
                  <X size={16} />
                </Button>
              </div>
            </div>
            
            {!isMinimized && (
              <>
                {/* Context indicator */}
                {currentTip && (
                  <div className="p-2 bg-blue-50 border-b text-xs text-blue-700">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      <span>{currentTip}</span>
                    </div>
                  </div>
                )}

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
                            {msg.content}
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
                          Analyserer med AI...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Input */}
                <div className="p-3 bg-white border-t">
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Spør meg om Revio eller revisjon..."
                      className="flex-1"
                      disabled={isTyping}
                    />
                    <Button 
                      size="icon" 
                      onClick={handleSendMessage} 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      disabled={isTyping || !message.trim()}
                    >
                      {isTyping ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <SendIcon size={16} />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SmartRevyAssistant;
