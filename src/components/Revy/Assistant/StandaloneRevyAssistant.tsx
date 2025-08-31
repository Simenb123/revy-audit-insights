import { logger } from '@/utils/logger';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from 'lucide-react';
import KnowledgeStatusIndicator from '../KnowledgeStatusIndicator';
import RevyAvatar from '../RevyAvatar';
import AIRevyVariantSelector from '@/components/AI/AIRevyVariantSelector';
import { RevyMessageList } from './RevyMessageList';
import { RevyMessage } from '@/types/revio';

interface StandaloneRevyAssistantProps {
  messages: RevyMessage[];
  input: string;
  isLoading: boolean;
  selectedVariant?: any;
  contextDisplayName: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSendMessage: () => void;
  // New optional props for pagination
  hasMoreMessages?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  totalMessageCount?: number;
}

const StandaloneRevyAssistant = ({
  messages,
  input,
  isLoading,
  selectedVariant,
  contextDisplayName,
  onInputChange,
  onKeyDown,
  onSendMessage,
  hasMoreMessages = false,
  isLoadingMore = false,
  onLoadMore,
  totalMessageCount = 0
}: StandaloneRevyAssistantProps) => {
  
  const handleVariantChange = (variant: any) => {
    logger.log('🔄 Variant changed in standalone assistant:', variant.name);
    // The variant change will be handled by the parent component
  };

  return (
    <Card className="flex flex-col w-full max-w-2xl mx-auto h-[600px]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <RevyAvatar />
          <div>
            <CardTitle className="text-lg font-semibold">AI-Revy</CardTitle>
            <p className="text-sm text-muted-foreground">
              {contextDisplayName} - {selectedVariant?.description || 'Din smarte revisjonsassistent'}
            </p>
          </div>
        </div>
        
        {/* AI Variant Selector - Full version for standalone */}
        <AIRevyVariantSelector
          currentContext="general"
          onVariantChange={handleVariantChange}
          compact={false}
        />
        
        <KnowledgeStatusIndicator />
      </CardHeader>
      <CardContent className="p-0 flex flex-col h-full">
        <div className="flex-grow overflow-y-auto">
          <RevyMessageList
            messages={messages}
            isTyping={isLoading}
            hasMoreMessages={hasMoreMessages}
            isLoadingMore={isLoadingMore}
            onLoadMore={onLoadMore}
            totalMessageCount={totalMessageCount}
          />
        </div>
        <div className="flex-shrink-0 sticky bottom-0 bg-background border-t">
          <div className="p-4">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder={`Spør ${selectedVariant?.display_name || 'AI-Revy'} om ${contextDisplayName.toLowerCase()}...`}
                value={input}
                onChange={onInputChange}
                onKeyDown={onKeyDown}
                disabled={isLoading}
                className="flex-grow"
              />
              <Button 
                type="submit" 
                onClick={onSendMessage} 
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {isLoading ? 'Laster...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StandaloneRevyAssistant;
