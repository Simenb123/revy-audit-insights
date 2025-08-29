import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TranscriptMessage, AgentConfig } from './types';
import AgentAvatar from './AgentAvatar';

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
  const getAgentColors = (key: string) => {
    const baseKey = key.startsWith('custom_') ? 'custom' : key;
    return {
      background: `hsl(var(--agent-${baseKey}-bg))`,
      color: `hsl(var(--agent-${baseKey}))`,
      borderColor: `hsl(var(--agent-${baseKey}) / 0.3)`,
    };
  };

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

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
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
            
            {agent?.model && (
              <Badge variant="secondary" className="text-xs h-5 px-2">
                {agent.model}
              </Badge>
            )}
          </div>

          {/* Message Text */}
          <div className="prose prose-sm max-w-none text-foreground">
            <p className="whitespace-pre-wrap text-sm leading-relaxed m-0">
              {message.content}
            </p>
          </div>
        </div>
      </div>

      {/* Timestamp - shown on hover */}
      <div className="absolute -right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <Badge variant="secondary" className="text-xs">
          {new Date(message.createdAt).toLocaleTimeString('nb-NO', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Badge>
      </div>
    </div>
  );
};

export default AgentMessage;