
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from 'lucide-react';
import { useIsMobile } from "@/hooks/use-mobile";
import KnowledgeStatusIndicator from '../KnowledgeStatusIndicator';
import RevyAvatar from '../RevyAvatar';
import AIRevyVariantSelector from '@/components/AI/AIRevyVariantSelector';
import { RevyMessageList } from './RevyMessageList';
import { RevyMessage } from '@/types/revio';

interface EmbeddedRevyAssistantProps {
  messages: RevyMessage[];
  input: string;
  isLoading: boolean;
  selectedVariant?: any;
  contextDisplayName: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
}

const EmbeddedRevyAssistant = ({
  messages,
  input,
  isLoading,
  selectedVariant,
  contextDisplayName,
  onInputChange,
  onKeyDown,
  onSendMessage
}: EmbeddedRevyAssistantProps) => {
  const isMobile = useIsMobile();

  const handleVariantChange = (variant: any) => {
    console.log('🔄 Variant changed in embedded assistant:', variant.name);
    // The variant change will be handled by the parent component
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header with context indicator */}
      <div className={`border-b border-border flex-shrink-0 ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center gap-3">
          <RevyAvatar />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold ${isMobile ? 'text-sm' : 'text-base'}`}>AI-Revi</h3>
              {selectedVariant && (
                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {selectedVariant.display_name.replace('AI-Revi ', '')}
                </span>
              )}
            </div>
            <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {contextDisplayName} - {selectedVariant?.description || 'Din smarte revisjonsassistent'}
            </p>
          </div>
        </div>
        
        {/* AI Variant Selector - Compact version for embedded */}
        <div className="mt-2">
          <AIRevyVariantSelector 
            currentContext="client-detail"
            onVariantChange={handleVariantChange}
            compact={true}
          />
        </div>
        
        <div className="mt-2">
          <KnowledgeStatusIndicator />
        </div>
      </div>
      
      {/* Messages - Fixed height with proper scroll */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <RevyMessageList 
          messages={messages} 
          isTyping={isLoading} 
          isEmbedded={true}
        />
      </div>
      
      {/* Input */}
      <div className={`border-t border-border bg-background flex-shrink-0 ${isMobile ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder={`Spør ${selectedVariant?.display_name || 'AI-Revi'} om ${contextDisplayName.toLowerCase()}...`}
            value={input}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            disabled={isLoading}
            className={`flex-grow ${isMobile ? 'text-sm h-10' : ''}`}
          />
          <Button 
            type="submit" 
            onClick={onSendMessage} 
            disabled={isLoading || !input.trim()}
            size={isMobile ? 'sm' : 'default'}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isLoading ? (
              <Loader2 className={`animate-spin ${isMobile ? 'h-3 w-3' : 'h-4 w-4'}`} />
            ) : (
              <Send className={isMobile ? 'h-3 w-3' : 'h-4 w-4'} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmbeddedRevyAssistant;
