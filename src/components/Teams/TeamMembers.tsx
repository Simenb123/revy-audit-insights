import { logger } from '@/utils/logger';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserMinus, Crown } from 'lucide-react';
import { useRemoveTeamMember } from '@/hooks/useRemoveTeamMember';
import { TeamMemberWithProfile } from '@/hooks/useTeamMembers';

interface TeamMembersProps {
  teamId: string;
  members: TeamMemberWithProfile[];
  onUpdate: () => void;
}

const TeamMembers = ({ teamId, members, onUpdate }: TeamMembersProps) => {
  const removeTeamMemberMutation = useRemoveTeamMember();

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeTeamMemberMutation.mutateAsync(memberId);
      onUpdate();
    } catch (error) {
      logger.error('Error removing team member:', error);
    }
  };

  if (members.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Ingen medlemmer i teamet ennå</p>
        <p className="text-sm text-muted-foreground mt-1">
          Legg til medlemmer for å komme i gang
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => {
        const displayName = member.profile?.firstName && member.profile?.lastName
          ? `${member.profile.firstName} ${member.profile.lastName}`
          : member.profile?.email || 'Ukjent bruker';
        
        const initials = member.profile?.firstName && member.profile?.lastName
          ? `${member.profile.firstName[0]}${member.profile.lastName[0]}`.toUpperCase()
          : member.userId.substring(0, 2).toUpperCase();

        return (
          <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{displayName}</span>
                  {member.role === 'lead' && <Crown className="h-4 w-4 text-yellow-500" />}
                </div>
                {member.profile?.email && (
                  <p className="text-xs text-muted-foreground">
                    {member.profile.email}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {member.role}
                  </Badge>
                  <Badge variant={member.isActive ? "default" : "secondary"} className="text-xs">
                    {member.isActive ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Lagt til {new Date(member.assignedDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            {member.isActive && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRemoveMember(member.id)}
                disabled={removeTeamMemberMutation.isPending}
              >
                <UserMinus className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TeamMembers;
