
import { logger } from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  FileText, 
  User, 
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Brain,
  Lightbulb,
  LogIn
} from 'lucide-react';
import { useClientDocuments } from '@/hooks/useClientDocuments';
import { useAuth } from '@/components/Auth/AuthProvider';
import { Client } from '@/types/revio';
import { getContextualSuggestions } from '@/services/enhancedRevyService';
import { RevyInput } from './Assistant/RevyInput';
import { useRevyMessageHandling } from './Assistant/useRevyMessageHandling';

interface ContextAwareRevyChatProps {
  client: Client;
  onClose?: () => void;
  className?: string;
}

const ContextAwareRevyChat: React.FC<ContextAwareRevyChatProps> = ({
  client,
  onClose,
  className = ''
}) => {
  const { session, isLoading: authLoading } = useAuth();
  const { documents = [] } = useClientDocuments(client?.id || '');
  const [isLoading, setIsLoading] = useState(false);

  // Ensure documents is always an array
  const safeDocuments = Array.isArray(documents) ? documents : [];

  const {
    messages,
    input,
    isLoading: messageLoading,
    isAnalyzingDocuments,
    handleInputChange,
    handleKeyDown,
    handleSendMessage,
    isAuthenticated,
    sessionId
  } = useRevyMessageHandling({
    context: 'client-detail',
    clientData: client,
    selectedVariant: { name: 'support' }
  });

  const getContextBadges = () => {
    const badges = [];
    
    if (safeDocuments.length > 0) {
      badges.push(
        <Badge key="docs" variant="secondary" className="text-xs">
          <FileText className="h-3 w-3 mr-1" />
          {safeDocuments.length} dokumenter
        </Badge>
      );
    }
    
    if (client?.phase) {
      badges.push(
        <Badge key="phase" variant="outline" className="text-xs">
          <TrendingUp className="h-3 w-3 mr-1" />
          {client.phase}
        </Badge>
      );
    }
    
    return badges;
  };

  // Show error state if no valid client
  if (!client?.id) {
    return (
      <Card className={`h-full flex flex-col ${className}`}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
          <p className="text-red-600">Ingen gyldig klient funnet</p>
          <p className="text-sm text-gray-500 mt-1">Kan ikke vise chat uten klient-informasjon</p>
        </CardContent>
      </Card>
    );
  }

  // Show authentication required state
  if (!isAuthenticated && !authLoading) {
    return (
      <Card className={`h-full flex flex-col ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-Revy Kontekst-Chat
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col items-center justify-center p-6">
          <LogIn className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Innlogging kreves</h3>
          <p className="text-muted-foreground text-center mb-4">
            Du må være innlogget for å bruke AI-Revy chat-funksjonen.
          </p>
          <Alert className="w-full max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Logg inn for å starte en samtale med AI-Revy om {client.company_name || client.name}.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show loading state
  if (authLoading || (isAuthenticated && !sessionId)) {
    return (
      <Card className={`h-full flex flex-col ${className}`}>
        <CardContent className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <p className="text-muted-foreground">Starter AI-Revy...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-Revy Kontekst-Chat
          </CardTitle>
          {onClose && (
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              ×
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{client.company_name || client.name}</span>
          {client.org_number && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <span>Org.nr: {client.org_number}</span>
            </>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2">
          {getContextBadges()}
          {sessionId && (
            <Badge variant="outline" className="text-xs">
              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
              Tilkoblet
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-full p-3 rounded-lg ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div
                  className={`text-xs mt-1 opacity-70 ${
                    msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString('no-NO', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))}
          
          {(messageLoading || isAnalyzingDocuments) && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 p-3 rounded-lg flex items-center gap-2">
                <div className="animate-spin">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <span>
                  {isAnalyzingDocuments ? 'Analyserer dokumenter...' : 'AI-Revy tenker...'}
                </span>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t">
          <RevyInput
            message={input}
            setMessage={(value) => handleInputChange({ target: { value } } as any)}
            handleSendMessage={handleSendMessage}
            isTyping={messageLoading}
            placeholder="Spør AI-Revy om noe relatert til denne klienten..."
            onKeyDown={handleKeyDown}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ContextAwareRevyChat;
