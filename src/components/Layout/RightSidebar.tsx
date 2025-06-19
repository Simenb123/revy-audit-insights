
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, 
  X,
  PanelRightClose,
  PanelRightOpen,
  Send,
  Loader2
} from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface RightSidebarProps {
  isCollapsed?: boolean;
  onToggle: () => void;
}

interface Message {
  id: number;
  sender: 'revy' | 'user';
  content: string;
  timestamp: string;
}

const RightSidebar = ({ isCollapsed = false, onToggle }: RightSidebarProps) => {
  const isMobile = useIsMobile();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'revy',
      content: 'Hei! Jeg er AI-Revi assistenten. Hvordan kan jeg hjelpe deg i dag?',
      timestamp: new Date().toISOString()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = () => {
    if (!message.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: Date.now() + 1,
        sender: 'revy',
        content: 'Takk for spørsmålet ditt! Jeg er her for å hjelpe deg med revisjonsarbeid.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col w-full overflow-hidden bg-background">
        {/* Collapsed Content - Only the chat icon */}
        <div className="flex-1 min-h-0 p-2 flex justify-center items-center">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggle}
                  className="h-8 w-8 hover:bg-accent"
                >
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                AI-Revi Assistant
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col w-full overflow-hidden bg-background">
      {/* Expanded Header */}
      <div className="border-b border-border flex items-center justify-between p-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-base">AI-Revi Assistant</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8 hover:bg-accent"
          title={isMobile ? "Lukk" : "Trekk inn AI-assistant"}
        >
          {isMobile ? <X className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
        </Button>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 min-h-0 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] p-3 rounded-lg ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-900'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-blue-900">AI-Revi skriver...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Input Area */}
      <div className="border-t border-border p-4 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Skriv din melding..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Button 
            size="sm" 
            onClick={handleSendMessage}
            disabled={isLoading || !message.trim()}
            className="px-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
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
  );
};

export default RightSidebar;
