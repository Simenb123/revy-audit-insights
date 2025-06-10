import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MinusCircle, SendIcon, X } from 'lucide-react';
import RevyAvatar from './RevyAvatar';
import { useToast } from '@/hooks/use-toast';
import { useRevyContext } from '../RevyContext/RevyContextProvider';
import { generateResponse, getContextualTip } from '@/services/revyService';
import { RevyMessage } from '@/types/revio';

interface RevyAssistantProps {
  embedded?: boolean;
}

const RevyAssistant = ({ embedded = false }: RevyAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<RevyMessage[]>([
    {
      id: '1',
      content: 'Hei! Jeg er Revy, din revisjonsassistent. Hvordan kan jeg hjelpe deg i dag?',
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
      'client-admin': 'klientadmin',
      'general': 'generell'
    };
    
    return mapping[context] || context;
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const userMessage: RevyMessage = { 
      id: Date.now().toString(), 
      content: message,
      timestamp: new Date().toISOString(),
      sender: 'user'
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setMessage('');
    
    // Generate contextual response
    setTimeout(() => {
      const responseText = generateResponse(userMessage.content, currentContext);
      const revyResponse: RevyMessage = {
        id: Date.now().toString(),
        content: responseText,
        timestamp: new Date().toISOString(),
        sender: 'revy'
      };
      
      setMessages(prev => [...prev, revyResponse]);
    }, 800);
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
    if (e.key === 'Enter') {
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
                <div className="flex items-end gap-2">
                  <RevyAvatar size="xs" />
                  <div className="bg-white border border-gray-200 p-2 rounded-lg rounded-bl-none max-w-[85%] shadow-sm text-sm">
                    {msg.content}
                  </div>
                </div>
              )}
              
              {msg.sender === 'user' && (
                <div className="bg-blue-100 text-blue-900 p-2 rounded-lg rounded-br-none max-w-[85%] text-sm">
                  {msg.content}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Input */}
        <div className="p-3 bg-white border-t">
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Skriv en melding..."
              className="flex-1 text-sm"
            />
            <Button size="sm" onClick={handleSendMessage} className="bg-revio-500 hover:bg-revio-600">
              <SendIcon size={14} />
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
                <span className="font-medium">Revy Assistent</span>
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
                  />
                  <Button size="icon" onClick={handleSendMessage} className="bg-revio-500 hover:bg-revio-600">
                    <SendIcon size={16} />
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
