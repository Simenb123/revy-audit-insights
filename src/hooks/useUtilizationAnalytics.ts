
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmployees } from './useEmployees';

export interface UtilizationRow {
  userId: string;
  name: string;
  initials?: string | null;
  color?: string | null;
  capacityHours: number;
  allocatedHours: number;
  utilizationPct: number | null; // null when capacity is 0
}

export interface UtilizationResult {
  rows: UtilizationRow[];
  totals: {
    capacityHours: number;
    allocatedHours: number;
    utilizationPct: number | null;
  }
}

export const useUtilizationAnalytics = (teamId: string | undefined, year: number | undefined, month?: number) => {
  const { data: employees = [] } = useEmployees();

  return useQuery({
    queryKey: ['utilization-analytics', teamId, year, month],
    queryFn: async (): Promise<UtilizationResult> => {
      if (!teamId || !year) return { rows: [], totals: { capacityHours: 0, allocatedHours: 0, utilizationPct: null } };

      // 1) Fetch team members
      const { data: members, error: tmErr } = await (supabase as any)
        .from('team_members' as any)
        .select('user_id')
        .eq('team_id', teamId)
        .eq('is_active', true);
      if (tmErr) throw tmErr;
      const userIds: string[] = (members || []).map((m: any) => m.user_id);
      if (userIds.length === 0) return { rows: [], totals: { capacityHours: 0, allocatedHours: 0, utilizationPct: null } };

      // 2) Parallel fetch allocations and capacity
      const allocationsQuery = (async () => {
        let q = (supabase as any)
          .from('team_member_allocations' as any)
          .select('user_id, budget_hours')
          .eq('team_id', teamId)
          .eq('period_year', year);
        if (typeof month === 'number') q = q.eq('period_month', month);
        else q = q.is('period_month', null);
        const { data, error } = await q;
        if (error) throw error;
        return (data || []) as Array<{ user_id: string; budget_hours: number }>;
      })();

      const capacityQuery = (async () => {
        let q = (supabase as any)
          .from('employee_capacity' as any)
          .select('user_id, capacity_hours')
          .in('user_id', userIds)
          .eq('period_year', year);
        if (typeof month === 'number') q = q.eq('period_month', month);
        else q = q.is('period_month', null);
        const { data, error } = await q;
        if (error) throw error;
        return (data || []) as Array<{ user_id: string; capacity_hours: number }>;
      })();

      const [allocations, capacities] = await Promise.all([allocationsQuery, capacityQuery]);

      const allocByUser = new Map<string, number>();
      allocations.forEach((a) => allocByUser.set(a.user_id, (allocByUser.get(a.user_id) || 0) + (a.budget_hours || 0)));

      const capByUser = new Map<string, number>();
      capacities.forEach((c) => capByUser.set(c.user_id, (capByUser.get(c.user_id) || 0) + (c.capacity_hours || 0)));

      // Map employee display info
      const profileById = new Map<string, { name: string; initials?: string | null; color?: string | null }>();
      employees.forEach((e: any) => {
        const name = `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim() || e.email || 'Ukjent';
        profileById.set(e.id, { name, initials: e.initials, color: e.initials_color });
      });

      const rows = userIds.map((uid) => {
        const p = profileById.get(uid) || { name: 'Ukjent' };
        const capacity = capByUser.get(uid) || 0;
        const allocated = allocByUser.get(uid) || 0;
        const utilization = capacity > 0 ? Math.min(allocated / capacity, 10) : null; // cap to avoid absurd numbers
        return {
          userId: uid,
          name: p.name,
          initials: p.initials,
          color: p.color,
          capacityHours: capacity,
          allocatedHours: allocated,
          utilizationPct: utilization,
        } as UtilizationRow;
      });

      const totals = rows.reduce(
        (acc, r) => {
          acc.capacityHours += r.capacityHours;
          acc.allocatedHours += r.allocatedHours;
          return acc;
        },
        { capacityHours: 0, allocatedHours: 0 }
      ) as { capacityHours: number; allocatedHours: number };

      const totalUtil = totals.capacityHours > 0 ? totals.allocatedHours / totals.capacityHours : null;

      return { rows, totals: { ...totals, utilizationPct: totalUtil } };
    },
    enabled: !!teamId && !!year,
    staleTime: 1000 * 30,
  });
};
