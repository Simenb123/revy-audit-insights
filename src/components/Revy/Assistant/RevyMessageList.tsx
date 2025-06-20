
import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageContentParser } from './MessageContentParser';
import RevyAvatar from '../RevyAvatar';
import DocumentReferenceViewer from '@/components/ClientDocuments/DocumentReferenceViewer';
import { RevyMessage } from '@/types/revio';
import { User, Bot } from 'lucide-react';

interface RevyMessageListProps {
  messages: RevyMessage[];
  isTyping: boolean;
  isEmbedded?: boolean;
}

export const RevyMessageList: React.FC<RevyMessageListProps> = ({
  messages,
  isTyping,
  isEmbedded = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Extract document references from message metadata
  const extractDocumentReferences = (message: RevyMessage) => {
    if (!message.metadata?.documentReferences) return [];
    
    return message.metadata.documentReferences.map((ref: any) => ({
      id: ref.id,
      fileName: ref.fileName || ref.file_name,
      category: ref.category,
      summary: ref.summary || ref.ai_analysis_summary,
      confidence: ref.confidence || ref.ai_confidence_score,
      textPreview: ref.textPreview,
      uploadDate: ref.uploadDate || ref.created_at,
      relevantText: ref.relevantText
    }));
  };

  return (
    <ScrollArea className={`flex-1 ${isEmbedded ? 'h-full' : 'h-96'} w-full`}>
      <div className="space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <RevyAvatar size="lg" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Hei! Jeg er AI-Revi
            </h3>
            <p className="mt-2 text-sm text-gray-600 max-w-sm">
              Din smarte revisjonsassistent. Jeg kan hjelpe deg med revisjon, 
              dokumentanalyse og mye mer. Hvordan kan jeg hjelpe deg i dag?
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const documentRefs = extractDocumentReferences(message);
            
            return (
              <div key={message.id} className="flex gap-3">
                {message.sender === 'user' ? (
                  <div className="flex items-start gap-3 justify-end w-full">
                    <div className="bg-blue-500 text-white p-3 rounded-lg max-w-xs lg:max-w-md">
                      <p className="text-sm">{message.content}</p>
                    </div>
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 w-full">
                    <RevyAvatar />
                    <div className="flex-1 space-y-3">
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <MessageContentParser content={message.content} />
                      </div>
                      
                      {/* Show document references if available */}
                      {documentRefs.length > 0 && (
                        <DocumentReferenceViewer 
                          documents={documentRefs}
                          title="Refererte dokumenter"
                          maxHeight="300px"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        
        {isTyping && (
          <div className="flex items-start gap-3">
            <RevyAvatar />
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};
