
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SaveAllocationInput {
  client_id: string;
  team_id: string;
  user_id: string;
  period_year: number;
  budget_hours: number;
  notes?: string | null;
}

export const useSaveTeamAllocations = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rows: SaveAllocationInput[]) => {
      if (!rows.length) return;
      const { error } = await supabase
        .from('team_member_allocations')
        .upsert(rows, {
          onConflict: 'client_id,team_id,user_id,period_year',
        });

      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      // Invalidate queries tied to the team/year from first row (all rows share same team/year)
      const key = variables[0] ? ['team-allocations', variables[0].team_id, variables[0].period_year] : undefined;
      if (key) {
        queryClient.invalidateQueries({ queryKey: key as any });
      }
      toast({
        title: 'Budsjett lagret',
        description: 'Budsjetterte timer er oppdatert.',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Kunne ikke lagre budsjett',
        description: err.message,
        variant: 'destructive',
      });
    },
  });
};
