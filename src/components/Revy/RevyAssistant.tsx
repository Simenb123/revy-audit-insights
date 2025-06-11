import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MinusCircle, SendIcon, X, Loader2 } from 'lucide-react';
import RevyAvatar from './RevyAvatar';
import { useToast } from '@/hooks/use-toast';
import { useRevyContext } from '../RevyContext/RevyContextProvider';
import { generateAIResponse, getContextualTip } from '@/services/revyService';
import { RevyMessage } from '@/types/revio';

interface RevyAssistantProps {
  embedded?: boolean;
  clientData?: any;
  userRole?: string;
}

const RevyAssistant = ({ embedded = false, clientData, userRole }: RevyAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<RevyMessage[]>([
    {
      id: '1',
      content: 'Hei! Jeg er Revy, din AI-drevne revisjonsassistent. Hvordan kan jeg hjelpe deg i dag?',
      timestamp: new Date().toISOString(),
      sender: 'revy'
    }
  ]);
  const { toast } = useToast();
  const { currentContext } = useRevyContext();
  
  // Provide contextual tips when the context changes
  useEffect(() => {
    if ((isOpen || embedded) && messages.length <= 1) {
      const tip = getContextualTip(currentContext);
      const newMessage: RevyMessage = {
        id: Date.now().toString(),
        content: `Jeg ser at du er i ${contextToNorwegian(currentContext)}-visningen. ${tip}`,
        timestamp: new Date().toISOString(),
        sender: 'revy'
      };
      
      setMessages(prev => [...prev, newMessage]);
    }
  }, [currentContext, isOpen, embedded]);
  
  const contextToNorwegian = (context: string): string => {
    const mapping: Record<string, string> = {
      'dashboard': 'dashbord',
      'drill-down': 'drill-down',
      'risk-assessment': 'risikovurdering',
      'documentation': 'dokumentasjons',
      'mapping': 'mapping',
      'client-overview': 'klientoversikt',
      'client-detail': 'klientdetalj',
      'collaboration': 'samarbeids',
      'general': 'generell'
    };
    
    return mapping[context] || context;
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
      // Generate AI response with context
      const responseText = await generateAIResponse(
        userMessage.content, 
        currentContext,
        clientData,
        userRole
      );
      
      const revyResponse: RevyMessage = {
        id: (Date.now() + 1).toString(),
        content: responseText,
        timestamp: new Date().toISOString(),
        sender: 'revy'
      };
      
      setMessages(prev => [...prev, revyResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Fallback response
      const fallbackResponse: RevyMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Beklager, jeg opplever tekniske problemer akkurat nå. Prøv igjen senere, eller spør meg om noe annet.',
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
      
      // Show a contextual tip when opening
      if (messages.length <= 1) {
        const tip = getContextualTip(currentContext);
        const welcomeMessage: RevyMessage = {
          id: Date.now().toString(),
          content: tip,
          timestamp: new Date().toISOString(),
          sender: 'revy'
        };
        
        setMessages(prev => [...prev, welcomeMessage]);
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isTyping) {
      handleSendMessage();
    }
  };

  // Embedded mode for sidebar
  if (embedded) {
    return (
      <div className="h-full flex flex-col bg-white">
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
                  Tenker...
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Input */}
        <div className="p-2 bg-white border-t">
          <div className="flex gap-1">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Skriv en melding..."
              className="flex-1 text-xs h-8"
              disabled={isTyping}
            />
            <Button 
              size="sm" 
              onClick={handleSendMessage} 
              className="bg-revio-500 hover:bg-revio-600 h-8 w-8 p-0"
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
          <RevyAvatar size="lg" className="cursor-pointer hover:shadow-lg transition-shadow duration-300 animate-bounce-limited" />
        </motion.div>
      )}
      
      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed bottom-0 right-0 z-50 w-80 bg-white shadow-xl rounded-tl-2xl overflow-hidden flex flex-col"
            style={{ height: isMinimized ? '48px' : '400px' }}
            initial={{ y: 400, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 400, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="bg-revio-500 text-white p-2 flex items-center justify-between cursor-pointer" onClick={toggleMinimize}>
              <div className="flex items-center gap-2">
                <RevyAvatar size="sm" />
                <span className="font-medium">Revy AI-Assistent</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-revio-600" onClick={(e) => { e.stopPropagation(); toggleMinimize(); }}>
                  <MinusCircle size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-revio-600" onClick={(e) => { e.stopPropagation(); toggleOpen(); }}>
                  <X size={16} />
                </Button>
              </div>
            </div>
            
            {/* Messages */}
            {!isMinimized && (
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
                        Tenker...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Input */}
            {!isMinimized && (
              <div className="p-3 bg-white border-t">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Skriv en melding..."
                    className="flex-1"
                    disabled={isTyping}
                  />
                  <Button 
                    size="icon" 
                    onClick={handleSendMessage} 
                    className="bg-revio-500 hover:bg-revio-600"
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
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RevyAssistant;
