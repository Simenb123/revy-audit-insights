import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AgentRoleKey, AgentConfig } from './types';
import { 
  Scale, 
  Sparkles, 
  ShieldAlert, 
  Gavel, 
  Target, 
  Brain, 
  Lightbulb, 
  User, 
  Shield,
  Bot
} from 'lucide-react';

interface AgentAvatarProps {
  agent: AgentConfig;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showModel?: boolean;
  className?: string;
}

const getAgentIcon = (key: AgentRoleKey) => {
  const iconProps = { className: 'h-4 w-4' };
  
  switch (key) {
    case 'moderator': return <Scale {...iconProps} />;
    case 'optimist': return <Sparkles {...iconProps} />;
    case 'devils_advocate': return <ShieldAlert {...iconProps} />;
    case 'lawyer': return <Gavel {...iconProps} />;
    case 'auditor': return <Target {...iconProps} />;
    case 'engineer': return <Brain {...iconProps} />;
    case 'creative': return <Lightbulb {...iconProps} />;
    case 'user_rep': return <User {...iconProps} />;
    case 'strategist': return <Shield {...iconProps} />;
    case 'notetaker': return <Bot {...iconProps} />;
    default: return <Bot {...iconProps} />;
  }
};

const getAgentColors = (key: AgentRoleKey) => {
  const baseKey = key.toString().startsWith('custom_') ? 'custom' : key;
  
  return {
    background: `hsl(var(--agent-${baseKey}-bg))`,
    color: `hsl(var(--agent-${baseKey}))`,
    borderColor: `hsl(var(--agent-${baseKey}))`,
  };
};

const AgentAvatar: React.FC<AgentAvatarProps> = ({
  agent,
  size = 'md',
  showName = false,
  showModel = false,
  className
}) => {
  const colors = getAgentColors(agent.key);
  const icon = getAgentIcon(agent.key);
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Avatar 
        className={cn(
          sizeClasses[size],
          'border-2 transition-all duration-200 hover:scale-105'
        )}
        style={{ 
          backgroundColor: colors.background,
          borderColor: colors.borderColor
        }}
      >
        <AvatarFallback 
          className="bg-transparent"
          style={{ color: colors.color }}
        >
          {icon}
        </AvatarFallback>
      </Avatar>
      
      {(showName || showModel) && (
        <div className="flex flex-col">
          {showName && (
            <span className="text-sm font-medium text-foreground">
              {agent.name}
            </span>
          )}
          {showModel && (
            <Badge 
              variant="outline" 
              className="text-xs h-4 px-1"
              style={{ borderColor: colors.color, color: colors.color }}
            >
              {agent.model || 'gpt-5-mini'}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentAvatar;