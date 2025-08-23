import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TeamMemberWithProfile {
  id: string;
  teamId: string;
  userId: string;
  role: string;
  assignedDate: string;
  isActive: boolean;
  profile?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

// Fix the team members query - use profiles instead of joining
export function useClientTeamMembers(clientId: string) {
  return useQuery({
    queryKey: ['client-team-members', clientId],
    enabled: !!clientId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async (): Promise<TeamMemberWithProfile[]> => {
      if (!clientId) return [];

      // First get the client teams for this client
      const { data: clientTeams, error: teamsError } = await supabase
        .from('client_teams')
        .select('id')
        .eq('client_id', clientId);

      if (teamsError) throw teamsError;
      if (!clientTeams || clientTeams.length === 0) return [];

      const teamIds = clientTeams.map(team => team.id);

      // Get team members first
      const { data: teamMembers, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .in('team_id', teamIds)
        .eq('is_active', true)
        .order('assigned_date', { ascending: false });

      if (membersError) throw membersError;
      if (!teamMembers || teamMembers.length === 0) return [];

      // Then get profiles for those users
      const userIds = teamMembers.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

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
          profile: profile ? {
            id: profile.id,
            firstName: profile.first_name,
            lastName: profile.last_name,
            email: profile.email,
          } : undefined,
        };
      });
    },
  });
}