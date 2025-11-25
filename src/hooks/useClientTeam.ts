import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';

interface ClientTeam {
  id: string;
  clientId: string;
  name: string;
  departmentId: string;
  chatRoomId?: string;
}

/**
 * Hook to fetch the team associated with a client, and its chat room
 */
export function useClientTeam(clientId?: string) {
  const { data: userProfile } = useUserProfile();
  
  return useQuery({
    queryKey: ['clientTeam', clientId],
    queryFn: async (): Promise<ClientTeam | null> => {
      if (!clientId || !userProfile) return null;

      // Fetch the team for this client
      const { data: teams, error: teamError } = await supabase
        .from('client_teams')
        .select('id, client_id, name, department_id')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .limit(1);

      if (teamError) throw teamError;
      if (!teams || teams.length === 0) return null;

      const team = teams[0];

      // Fetch the chat room for this team
      const { data: chatRooms, error: roomError } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('room_type', 'team')
        .eq('reference_id', team.id)
        .eq('is_active', true)
        .limit(1);

      if (roomError) throw roomError;

      return {
        id: team.id,
        clientId: team.client_id,
        name: team.name,
        departmentId: team.department_id,
        chatRoomId: chatRooms?.[0]?.id
      };
    },
    enabled: !!clientId && !!userProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
