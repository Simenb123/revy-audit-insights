
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send } from 'lucide-react';
import RevyAvatar from '@/components/Revy/RevyAvatar';

interface AiReviCardProps {
  title: string;
  description: string;
  className?: string;
}

const AiReviCard: React.FC<AiReviCardProps> = ({ title, description, className = '' }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai', content: string }>>([]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    setMessages(prev => [
      ...prev,
      { sender: 'user', content: message },
      { sender: 'ai', content: 'Takk for spørsmålet! Jeg jobber med å forstå konteksten og gi deg en relevant respons.' }
    ]);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card className={`${className} transition-all duration-300`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RevyAvatar size="sm" />
            <div>
              <CardTitle className="text-base">{title}</CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
          </div>
          
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {messages.length > 0 && (
          <ScrollArea className="h-48 mb-3 p-2 border rounded-md">
            <div className="space-y-2">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-2 rounded-lg text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Spør AI-Revi om hjelp..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-sm"
          />
          <Button 
            size="sm" 
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AiReviCard;
