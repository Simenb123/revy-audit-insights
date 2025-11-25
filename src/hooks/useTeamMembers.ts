import { logger } from '@/utils/logger';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types/organization';

export interface TeamMemberWithProfile extends TeamMember {
  profile?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export function useTeamMembers(teamId: string) {
  return useQuery({
    queryKey: ['teamMembers', teamId],
    queryFn: async (): Promise<TeamMemberWithProfile[]> => {
      if (!teamId) return [];
      
      // First get team members
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (membersError) {
        logger.error('Error fetching team members:', membersError);
        return [];
      }

      if (!teamMembers || teamMembers.length === 0) return [];

      // Then get profiles for those users
      const userIds = teamMembers.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      if (profilesError) {
        logger.error('Error fetching profiles:', profilesError);
      }

      // Combine the data
      return teamMembers.map(member => {
        const profile = profiles?.find(p => p.id === member.user_id);
        return {
          id: member.id,
          teamId: member.team_id,
          userId: member.user_id,
          role: member.role,
          assignedDate: member.assigned_date,
          isActive: member.is_active,
          createdAt: member.created_at,
          profile: profile ? {
            id: profile.id,
            firstName: profile.first_name,
            lastName: profile.last_name,
            email: profile.email,
          } : undefined,
        };
      });
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
