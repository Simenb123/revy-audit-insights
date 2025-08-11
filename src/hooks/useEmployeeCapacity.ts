
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EmployeeCapacityRow {
  id: string;
  user_id: string;
  period_year: number;
  period_month: number | null;
  fte_percent: number;
  capacity_hours: number;
  planned_absence_hours: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useEmployeeCapacityForTeam = (teamId: string | undefined, year: number | undefined, month?: number) => {
  return useQuery({
    queryKey: ['employee-capacity', teamId, year, month],
    queryFn: async (): Promise<EmployeeCapacityRow[]> => {
      if (!teamId || !year) return [];

      // 1) Find active team members
      const { data: members, error: tmErr } = await (supabase as any)
        .from('team_members' as any)
        .select('user_id')
        .eq('team_id', teamId)
        .eq('is_active', true);
      if (tmErr) throw tmErr;
      const userIds = (members || []).map((m: any) => m.user_id);
      if (userIds.length === 0) return [];

      // 2) Fetch capacity rows for these users
      let query = (supabase as any)
        .from('employee_capacity' as any)
        .select('*')
        .in('user_id', userIds)
        .eq('period_year', year);

      if (typeof month === 'number') query = query.eq('period_month', month);
      else query = query.is('period_month', null);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as EmployeeCapacityRow[];
    },
    enabled: !!teamId && !!year,
    staleTime: 1000 * 60,
  });
};

export interface UpsertEmployeeCapacityInput {
  id?: string;
  user_id: string;
  period_year: number;
  period_month?: number | null; // null for yearly
  fte_percent?: number;
  capacity_hours?: number;
  planned_absence_hours?: number;
  notes?: string | null;
  created_by?: string | null;
}

export const useUpsertEmployeeCapacity = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rows: UpsertEmployeeCapacityInput[] | UpsertEmployeeCapacityInput) => {
      const payload = Array.isArray(rows) ? rows : [rows];
      const { error } = await (supabase as any)
        .from('employee_capacity' as any)
        .upsert(payload as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-capacity'] });
      toast({ title: 'Kapasitet lagret', description: 'Kapasitet er oppdatert.' });
    },
    onError: (err: any) => {
      toast({ title: 'Kunne ikke lagre kapasitet', description: err.message, variant: 'destructive' });
    },
  });
};
