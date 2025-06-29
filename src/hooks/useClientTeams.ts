import { logger } from '@/utils/logger';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ClientTeam } from '@/types/organization';
import { useUserProfile } from './useUserProfile';

export function useClientTeams(clientId?: string) {
  const { data: userProfile } = useUserProfile();
  
  return useQuery({
    queryKey: ['clientTeams', userProfile?.departmentId, clientId],
    queryFn: async (): Promise<ClientTeam[]> => {
      if (!userProfile?.departmentId) return [];
      
      let query = supabase
        .from('client_teams')
        .select('*')
        .eq('department_id', userProfile.departmentId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching client teams:', error);
        return [];
      }

      return data.map(team => ({
        id: team.id,
        clientId: team.client_id,
        departmentId: team.department_id,
        teamLeadId: team.team_lead_id,
        name: team.name,
        description: team.description,
        startDate: team.start_date,
        endDate: team.end_date,
        isActive: team.is_active,
        createdAt: team.created_at,
        updatedAt: team.updated_at
      }));
    },
    enabled: !!userProfile?.departmentId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
