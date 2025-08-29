import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { TranscriptMessage, AgentConfig } from './types';
import AgentAvatar from './AgentAvatar';
import { ChevronDown, ChevronUp, FileText, Search } from 'lucide-react';

// Helper function to get agent colors (matching AgentAvatar.tsx)
const getAgentColors = (key: string) => {
  const baseKey = key.startsWith('custom_') ? 'custom' : key;
  return {
    background: `hsl(var(--agent-${baseKey}-bg))`,
    color: `hsl(var(--agent-${baseKey}))`,
    borderColor: `hsl(var(--agent-${baseKey}) / 0.3)`,
  };
};

interface AgentMessageProps {
  message: TranscriptMessage;
  agent?: AgentConfig;
  isLastInRound?: boolean;
  className?: string;
}

const AgentMessage: React.FC<AgentMessageProps> = ({
  message,
  agent,
  isLastInRound = false,
  className
}) => {
  const [showSources, setShowSources] = useState(false);
  
  const colors = agent ? getAgentColors(agent.key.toString()) : {
    background: 'hsl(var(--muted))',
    color: 'hsl(var(--muted-foreground))',
    borderColor: 'hsl(var(--border))',
  };

  return (
    <div className={cn(
      'group relative animate-fade-in',
      isLastInRound && 'mb-6 pb-4 border-b border-dashed border-border/50',
      className
    )}>
      {/* Message bubble */}
      <div 
        className="flex gap-3 p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-sm"
        style={{ 
          backgroundColor: colors.background,
          borderLeftColor: colors.color
        }}
      >
        {/* Agent Avatar */}
        <div className="flex-shrink-0 pt-1">
          {agent ? (
            <AgentAvatar agent={agent} size="sm" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-medium text-muted-foreground">?</span>
            </div>
          )}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-medium text-sm" style={{ color: colors.color }}>
              {message.agentName || 'Unknown Agent'}
            </span>
            
            {typeof message.turnIndex === 'number' && (
              <Badge 
                variant="outline" 
                className="text-xs h-5 px-2"
                style={{ borderColor: colors.color, color: colors.color }}
              >
                Runde {message.turnIndex + 1}
              </Badge>
            )}
            
            {(message.modelUsed || agent?.model) && (
              <Badge variant="secondary" className="text-xs h-5 px-2">
                {message.modelUsed || agent?.model}
                {message.fallbackUsed && (
                  <span className="ml-1 text-yellow-600" title="Fallback-modell brukt">⚠</span>
                )}
              </Badge>
            )}
            
            {message.sources && message.sources.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-5 px-2 gap-1 ml-auto"
                onClick={() => setShowSources(!showSources)}
              >
                <Search className="h-3 w-3" />
                {message.sources.length} kilder
                {showSources ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            )}
          </div>

          {/* Message Text */}
          <div className="prose prose-sm max-w-none text-foreground mb-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed m-0">
              {message.content}
            </p>
          </div>

          {/* Sources panel */}
          {message.sources && message.sources.length > 0 && showSources && (
            <div className="mt-2 p-3 bg-muted/50 rounded-lg border-l-4" style={{ borderLeftColor: colors.color + '40' }}>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Dokumentkilder ({message.sources.length})</span>
              </div>
              <div className="space-y-1">
                {message.sources.map((source, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground bg-background/50 p-2 rounded border">
                    {source}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timestamp - shown on hover */}
      <div className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Badge variant="secondary" className="text-xs">
          {formatDistanceToNow(new Date(message.createdAt), { 
            addSuffix: true, 
            locale: nb 
          })}
        </Badge>
      </div>
    </div>
  );
};

export default AgentMessage;