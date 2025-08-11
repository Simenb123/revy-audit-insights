
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TeamAllocation {
  id: string;
  client_id: string;
  team_id: string;
  user_id: string;
  period_year: number;
  budget_hours: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useTeamAllocations = (teamId: string | undefined, year: number) => {
  return useQuery({
    queryKey: ['team-allocations', teamId, year],
    queryFn: async (): Promise<TeamAllocation[]> => {
      if (!teamId) return [];
      // any-cast for å omgå typing frem til tabellen finnes i genererte typer
      const { data, error } = await (supabase as any)
        .from('team_member_allocations' as any)
        .select('*')
        .eq('team_id', teamId)
        .eq('period_year', year)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TeamAllocation[];
    },
    enabled: !!teamId,
    staleTime: 1000 * 60 * 2,
  });
};
