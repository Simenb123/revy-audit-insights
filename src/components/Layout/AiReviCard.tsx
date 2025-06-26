
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, MessageSquare, X, Maximize2, Minimize2 } from 'lucide-react';
import { useSmartReviAssistant } from '@/hooks/revy/useSmartReviAssistant';
import { RevyInput } from '../Revy/Assistant/RevyInput';
import { RevyMessageList } from '../Revy/Assistant/RevyMessageList';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AiReviCardProps {
  context: string;
  clientData?: any;
  title?: string;
  description?: string;
  className?: string;
}

const AiReviCard: React.FC<AiReviCardProps> = ({
  context,
  clientData,
  title = "AI-Revi Assistent",
  description = "Din smarte revisjonsassistent",
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const {
    messages,
    message,
    setMessage,
    isTyping,
    handleSendMessage,
    currentTip,
    selectedVariant,
    handleVariantChange
  } = useSmartReviAssistant({
    clientData,
    userRole: 'employee',
    embedded: true
  });

  const handleToggleExpand = () => {
    // Collapse should also exit fullscreen
    if (isExpanded) {
      setIsFullscreen(false);
    }
    setIsExpanded(!isExpanded);
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const cardClasses = `w-full ${
    isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''
  } ${isExpanded ? 'flex flex-col h-full' : 'h-auto'} ${className}`;

  return (
    <Card className={cardClasses}>
      <CardHeader className="p-2 pb-1 space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bot className="h-4 w-4 text-purple-600" />
            {title}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleExpand}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </Button>
            {!isFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFullscreen}
                className="h-6 w-6 p-0"
              >
                <Maximize2 size={12} />
              </Button>
            )}
            {isFullscreen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleFullscreen}
                className="h-6 w-6 p-0"
              >
                <X size={12} />
              </Button>
            )}
          </div>
        </div>
        
        {isExpanded && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{description}</span>
            {selectedVariant && (
              <Badge variant="outline" className="text-xs">
                {selectedVariant.display_name}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-2 space-y-2 flex flex-col flex-1 min-h-0">
        {currentTip && !isExpanded && (
          <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border">
            💡 {currentTip}
          </div>
        )}
        
        {isExpanded && (
          <ScrollArea className="flex-1">
            <RevyMessageList
              messages={messages}
              isTyping={isTyping}
              isEmbedded={true}
            />
          </ScrollArea>
        )}

        <div className="mt-auto">
          <RevyInput
            message={message}
            setMessage={setMessage}
            handleSendMessage={handleSendMessage}
            isTyping={isTyping}
            isEmbedded={true}
            placeholder="Spør AI-Revi..."
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AiReviCard;
