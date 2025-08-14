import React from 'react';
import { useCollaboration, CollaboratorUser } from '@/hooks/useCollaboration';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface RealTimeCollaboratorsProps {
  dashboardId: string;
  clientId: string;
  fiscalYear: number;
  className?: string;
}

interface CollaboratorCursorProps {
  collaborator: CollaboratorUser;
  position: { x: number; y: number };
}

function CollaboratorCursor({ collaborator, position }: CollaboratorCursorProps) {
  const getUserInitials = (displayName: string | null) => {
    if (!displayName) return '?';
    return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Generate a color based on user ID for consistent coloring
  const getUserColor = (userId: string) => {
    const colors = [
      'hsl(var(--primary))',
      'hsl(221 83% 53%)', // blue
      'hsl(142 71% 45%)', // green
      'hsl(262 83% 58%)', // purple
      'hsl(346 87% 43%)', // red
      'hsl(32 95% 44%)',  // orange
    ];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  return (
    <div
      className="fixed pointer-events-none z-50 transition-all duration-100"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-2px, -2px)'
      }}
    >
      {/* Cursor pointer */}
      <div
        className="w-4 h-4 relative"
        style={{ color: getUserColor(collaborator.id) }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M7.4 2.5c-.3 0-.5.1-.7.3-.2.2-.3.4-.3.7v11.7l3.2-2.2 1.7 3.3c.1.2.4.4.7.4h.2c.3-.1.5-.3.6-.6l1.7-3.3 3.2 2.2V3.5c0-.3-.1-.5-.3-.7-.2-.2-.4-.3-.7-.3H7.4z"/>
        </svg>
      </div>
      
      {/* User label */}
      <div
        className="absolute top-4 left-4 px-2 py-1 text-xs text-white rounded-md whitespace-nowrap font-medium shadow-lg"
        style={{ backgroundColor: getUserColor(collaborator.id) }}
      >
        {collaborator.display_name || 'Unknown User'}
      </div>
    </div>
  );
}

function CollaboratorAvatar({ collaborator }: { collaborator: CollaboratorUser }) {
  const getUserInitials = (displayName: string | null) => {
    if (!displayName) return '?';
    return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (lastSeen: string) => {
    const diff = Date.now() - new Date(lastSeen).getTime();
    if (diff < 30000) return 'bg-green-500'; // Active within 30 seconds
    if (diff < 300000) return 'bg-yellow-500'; // Active within 5 minutes
    return 'bg-gray-500'; // Inactive
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Avatar className="w-8 h-8 border-2 border-background shadow-sm">
              <AvatarImage src={collaborator.avatar_url || ''} />
              <AvatarFallback className="text-xs font-medium">
                {getUserInitials(collaborator.display_name)}
              </AvatarFallback>
            </Avatar>
            
            {/* Status indicator */}
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background',
                getStatusColor(collaborator.last_seen)
              )}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-sm">
            <p className="font-medium">{collaborator.display_name || 'Unknown User'}</p>
            <p className="text-muted-foreground">
              Active {formatDistanceToNow(new Date(collaborator.last_seen), { addSuffix: true })}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function RealTimeCollaborators({
  dashboardId,
  clientId,
  fiscalYear,
  className
}: RealTimeCollaboratorsProps) {
  const { collaborators, currentUser } = useCollaboration(dashboardId, clientId, fiscalYear);

  const activeCollaborators = collaborators.filter(c => c.is_active);

  if (!currentUser) {
    return null;
  }

  return (
    <>
      {/* Collaborator cursors */}
      {activeCollaborators
        .filter(c => c.cursor_position)
        .map(collaborator => (
          <CollaboratorCursor
            key={collaborator.id}
            collaborator={collaborator}
            position={collaborator.cursor_position!}
          />
        ))}

      {/* Collaborator list */}
      <div className={cn('flex items-center gap-2', className)}>
        {activeCollaborators.length > 0 && (
          <>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {activeCollaborators.length}
              </span>
            </div>
            
            <div className="flex -space-x-2">
              {activeCollaborators.slice(0, 5).map(collaborator => (
                <CollaboratorAvatar key={collaborator.id} collaborator={collaborator} />
              ))}
              
              {activeCollaborators.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center shadow-sm">
                  <span className="text-xs font-medium text-muted-foreground">
                    +{activeCollaborators.length - 5}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
        
        {activeCollaborators.length === 0 && (
          <Badge variant="outline" className="text-xs">
            <Users className="w-3 h-3 mr-1" />
            Working alone
          </Badge>
        )}
      </div>
    </>
  );
}