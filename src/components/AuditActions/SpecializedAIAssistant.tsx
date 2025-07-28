
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Send, Loader2, FileText, BookOpen, AlertTriangle } from 'lucide-react';
import { EnhancedAuditActionTemplate } from '@/types/enhanced-audit-actions';
import { useSpecializedAIChat } from '@/hooks/useSpecializedAIChat';

interface SpecializedAIAssistantProps {
  actionTemplate: EnhancedAuditActionTemplate;
  workingPaperData?: any;
}

const SpecializedAIAssistant = ({ actionTemplate, workingPaperData }: SpecializedAIAssistantProps) => {
  const [message, setMessage] = useState('');
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    clearMessages 
  } = useSpecializedAIChat(actionTemplate);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    await sendMessage(message, workingPaperData);
    setMessage('');
  };

  const getComplexityColor = (complexity: number) => {
    if (complexity <= 2) return 'bg-green-100 text-green-800';
    if (complexity <= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getComplexityLabel = (complexity: number) => {
    if (complexity <= 2) return 'Enkel';
    if (complexity <= 3) return 'Moderat';
    return 'Kompleks';
  };

  const suggestedQuestions = [
    "Hvilke ISA-standarder er mest relevante for denne handlingen?",
    "Hvilke dokumenter bør jeg samle inn først?",
    "Hva er de vanligste feilene ved denne typen handling?",
    "Kan du hjelpe meg med kvalitetskontroll av arbeidspapiret?",
    "Hvilke risikoer bør jeg være spesielt oppmerksom på?"
  ];

  return (
    <div className="space-y-4">
      {/* Context Information */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Spesialisert AI-assistent
            </CardTitle>
            <div className="flex gap-2">
              {actionTemplate.ai_metadata && (
                <Badge className={getComplexityColor(actionTemplate.ai_metadata.estimated_complexity)}>
                  {getComplexityLabel(actionTemplate.ai_metadata.estimated_complexity)}
                </Badge>
              )}
              <Badge variant="outline">
                {actionTemplate.subject_area}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Jeg er spesialisert på <strong>{actionTemplate.name}</strong> og kan hjelpe deg med:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
            {actionTemplate.isa_mappings && actionTemplate.isa_mappings.length > 0 && (
              <div className="flex items-center gap-1">
                <BookOpen size={12} />
                <span>{actionTemplate.isa_mappings.length} ISA-standarder</span>
              </div>
            )}
            {actionTemplate.document_mappings && actionTemplate.document_mappings.length > 0 && (
              <div className="flex items-center gap-1">
                <FileText size={12} />
                <span>{actionTemplate.document_mappings.length} dokumentkrav</span>
              </div>
            )}
            {actionTemplate.ai_metadata && (
              <div className="flex items-center gap-1">
                <AlertTriangle size={12} />
                <span>{actionTemplate.ai_metadata.risk_indicators.length} risikoindikatorer</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">Chat med spesialist</CardTitle>
            <Button variant="outline" size="sm" onClick={clearMessages}>
              Tøm chat
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages */}
          <ScrollArea className="h-64 w-full border rounded-md p-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Brain className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="mb-4">Hei! Jeg er din spesialiserte assistent for denne revisjonshandlingen.</p>
                <p className="text-sm">Still meg spørsmål om prosedyrer, ISA-standarder, dokumenter eller risiko.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-full rounded-lg p-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Suggested Questions */}
          {messages.length === 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Foreslåtte spørsmål:</div>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto py-1 px-2"
                    onClick={() => setMessage(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Spør om ISA-standarder, dokumenter, prosedyrer eller risiko..."
              className="min-h-[60px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!message.trim() || isLoading}
              className="self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SpecializedAIAssistant;
