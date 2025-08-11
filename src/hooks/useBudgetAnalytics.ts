import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEmployees } from './useEmployees';
import { useClientTeams } from './useClientTeams';

export interface BudgetAllocationRow {
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

export interface BudgetAnalytics {
  totalHours: number;
  byTeam: Array<{ teamId: string; name: string; hours: number }>
  byUser: Array<{ userId: string; name: string; initials?: string | null; color?: string | null; hours: number }>
  rows: BudgetAllocationRow[];
}

export const useBudgetAnalytics = (clientId: string | undefined, year: number | undefined, month?: number) => {
  const { data: employees = [] } = useEmployees();
  const { data: teams = [] } = useClientTeams(clientId);

  return useQuery({
    queryKey: ['budget-analytics', clientId, year, month],
    queryFn: async (): Promise<BudgetAnalytics> => {
      if (!clientId || !year) return { totalHours: 0, byTeam: [], byUser: [], rows: [] };

      // any-cast until generated types include the table
      let query = (supabase as any)
        .from('team_member_allocations' as any)
        .select('*')
        .eq('client_id', clientId)
        .eq('period_year', year);

      if (typeof month === 'number') {
        query = query.eq('period_month', month);
      } else {
        query = query.is('period_month', null);
      }

      const { data, error } = await query;

      if (error) throw error;

      const rows: BudgetAllocationRow[] = (data || []).map((r: any) => ({
        id: r.id,
        client_id: r.client_id,
        team_id: r.team_id,
        user_id: r.user_id,
        period_year: r.period_year,
        budget_hours: Number(r.budget_hours || 0),
        notes: r.notes ?? null,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));

      const totalHours = rows.reduce((sum, r) => sum + (Number.isFinite(r.budget_hours) ? r.budget_hours : 0), 0);

      const teamNameById = new Map<string, string>();
      teams.forEach(t => teamNameById.set(t.id, t.name));

      const userInfoById = new Map<string, { name: string; initials?: string | null; color?: string | null }>();
      employees.forEach(e => {
        const name = `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim() || e.email || e.id;
        userInfoById.set(e.id, { name, initials: e.initials, color: e.initials_color });
      });

      const byTeamMap = new Map<string, number>();
      const byUserMap = new Map<string, number>();

      rows.forEach(r => {
        byTeamMap.set(r.team_id, (byTeamMap.get(r.team_id) || 0) + r.budget_hours);
        byUserMap.set(r.user_id, (byUserMap.get(r.user_id) || 0) + r.budget_hours);
      });

      const byTeam = Array.from(byTeamMap.entries()).map(([teamId, hours]) => ({
        teamId,
        name: teamNameById.get(teamId) || 'Ukjent team',
        hours,
      })).sort((a, b) => b.hours - a.hours);

      const byUser = Array.from(byUserMap.entries()).map(([userId, hours]) => {
        const info = userInfoById.get(userId);
        return {
          userId,
          name: info?.name || 'Ukjent',
          initials: info?.initials,
          color: info?.color,
          hours,
        };
      }).sort((a, b) => b.hours - a.hours);

      return { totalHours, byTeam, byUser, rows };
    },
    enabled: !!clientId && !!year,
    staleTime: 1000 * 60 * 2,
  });
};
