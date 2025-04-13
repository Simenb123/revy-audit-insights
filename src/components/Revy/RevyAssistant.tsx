
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MinusCircle, SendIcon, X } from 'lucide-react';
import RevyAvatar from './RevyAvatar';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  type: 'user' | 'revy';
  text: string;
}

const RevyAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'revy',
      text: 'Hei! Jeg er Revy, din revisjonsassistent. Hvordan kan jeg hjelpe deg i dag?'
    }
  ]);
  const { toast } = useToast();

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    const newMessages = [
      ...messages,
      { id: Date.now().toString(), type: 'user', text: message }
    ];
    setMessages(newMessages);
    setMessage('');
    
    // Simulate response
    setTimeout(() => {
      const responses = [
        'Jeg ser at du arbeider med regnskapsanalyse. Er det noe spesifikt du leter etter?',
        'Vil du at jeg skal forklare hvordan du kan bruke drill-down funksjonen for å analysere saldolinjer?',
        'Jeg kan hjelpe deg med å identifisere risikoområder i regnskapet basert på dataene du har lastet opp.',
        'Du kan dra og slippe kontoer for å tilpasse analysen din. Trenger du hjelp med dette?',
        'Tips: Klikk på en regnskapslinje for å se detaljene bak tallene!'
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      setMessages([
        ...newMessages,
        { id: Date.now().toString(), type: 'revy', text: randomResponse }
      ]);
    }, 1000);
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
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

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
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.type === 'revy' && (
                      <div className="flex items-end gap-2">
                        <RevyAvatar size="xs" />
                        <div className="chat-bubble-revy max-w-[85%]">
                          {msg.text}
                        </div>
                      </div>
                    )}
                    
                    {msg.type === 'user' && (
                      <div className="bg-blue-100 text-blue-900 p-3 rounded-2xl rounded-br-none max-w-[85%]">
                        {msg.text}
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
