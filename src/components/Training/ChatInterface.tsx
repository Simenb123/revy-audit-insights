
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare } from 'lucide-react';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  character: {
    id: string;
    name: string;
    role: string;
    personality: string;
    description: string;
  };
  onMessage: (message: string) => Promise<void>;
  messages: Message[];
  isLoading: boolean;
}

const ChatInterface = ({ character, onMessage, messages, isLoading }: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleSend = async () => {
    if (inputValue.trim() && !isLoading) {
      await onMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4">
      {/* Character Info */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">{character.name}</CardTitle>
              <p className="text-sm text-blue-700">{character.role}</p>
            </div>
            <Badge variant="secondary" className="ml-auto">Chat-modus</Badge>
          </div>
          <p className="text-sm text-gray-600">{character.description}</p>
        </CardHeader>
      </Card>

      {/* Chat Messages */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4 min-h-[400px] max-h-[400px] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-20">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Start samtalen med {character.name}</p>
                <p className="text-sm">Skriv din første melding nedenfor</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-900'
                  }`}>
                    <div className="text-xs opacity-70 mb-1">
                      {message.role === 'user' ? 'Du' : character.name} • 
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 p-3 rounded-lg max-w-[80%]">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm text-gray-500">{character.name} skriver...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Input Area */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Skriv din melding til ${character.name}...`}
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Trykk Enter for å sende • Shift+Enter for ny linje
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ChatInterface;
