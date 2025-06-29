import { logger } from '@/utils/logger';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types/organization';

export function useTeamMembers(teamId: string) {
  return useQuery({
    queryKey: ['teamMembers', teamId],
    queryFn: async (): Promise<TeamMember[]> => {
      if (!teamId) return [];
      
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching team members:', error);
        return [];
      }

      return data.map(member => ({
        id: member.id,
        teamId: member.team_id,
        userId: member.user_id,
        role: member.role,
        assignedDate: member.assigned_date,
        isActive: member.is_active,
        createdAt: member.created_at
      }));
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
