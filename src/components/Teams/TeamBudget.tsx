
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InitialsTag from '@/components/People/InitialsTag';
import { TeamMember } from '@/types/organization';
import { useTeamAllocations } from '@/hooks/useTeamAllocations';
import { useSaveTeamAllocations } from '@/hooks/useSaveTeamAllocations';
import { useEmployees } from '@/hooks/useEmployees';

interface TeamBudgetProps {
  teamId: string;
  clientId: string;
  members: TeamMember[];
}

const currentYear = new Date().getFullYear();

const TeamBudget: React.FC<TeamBudgetProps> = ({ teamId, clientId, members }) => {
  const [year, setYear] = useState<number>(currentYear);
  const { data: allocations = [], isLoading } = useTeamAllocations(teamId, year);
  const { data: employees = [] } = useEmployees();
  const saveAllocations = useSaveTeamAllocations();

  // Map user profiles for display
  const profileById = useMemo(() => {
    const map = new Map<string, { fullName: string; initials?: string | null; color?: string | null }>();
    employees.forEach((e) => {
      const fullName = `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim();
      map.set(e.id, { fullName, initials: e.initials, color: e.initials_color });
    });
    return map;
  }, [employees]);

  // Local state: user_id -> budget_hours
  const [hoursMap, setHoursMap] = useState<Record<string, number>>({});

  useEffect(() => {
    const map: Record<string, number> = {};
    allocations.forEach((a) => {
      map[a.user_id] = Number(a.budget_hours || 0);
    });
    // Ensure members without allocation get zero
    members.forEach((m) => {
      if (map[m.userId] === undefined) map[m.userId] = 0;
    });
    setHoursMap(map);
  }, [allocations, members]);

  const total = useMemo(() => Object.values(hoursMap).reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0), [hoursMap]);

  const handleChange = (userId: string, value: string) => {
    const num = value === '' ? 0 : Number(value);
    setHoursMap((prev) => ({ ...prev, [userId]: Number.isFinite(num) ? num : 0 }));
  };

  const handleSave = () => {
    const rows = members.map((m) => ({
      client_id: clientId,
      team_id: teamId,
      user_id: m.userId,
      period_year: year,
      budget_hours: Number(hoursMap[m.userId] || 0),
      notes: null as string | null,
    }));
    saveAllocations.mutate(rows);
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Label className="text-xs">År</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value || String(currentYear), 10))}
                className="w-28"
              />
            </div>
            <div className="text-sm text-muted-foreground mt-6">Totalt: {total} timer</div>
          </div>
          <Button onClick={handleSave} disabled={saveAllocations.isPending}>
            {saveAllocations.isPending ? 'Lagrer...' : 'Lagre budsjett'}
          </Button>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground">Laster budsjett...</div>
        ) : members.length === 0 ? (
          <div className="text-muted-foreground">Ingen medlemmer i teamet ennå</div>
        ) : (
          <div className="space-y-2">
            {members.map((m) => {
              const profile = profileById.get(m.userId);
              const fullName = profile?.fullName || 'Ukjent';
              const v = hoursMap[m.userId] ?? 0;
              return (
                <div
                  key={m.id}
                  className="grid grid-cols-1 md:grid-cols-[auto,1fr,auto] items-center gap-3 p-3 border rounded-lg"
                >
                  <InitialsTag initials={profile?.initials ?? undefined} fullName={fullName} color={profile?.color ?? undefined} />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{fullName}</div>
                    <div className="text-xs text-muted-foreground truncate">{m.role}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      value={String(v)}
                      onChange={(e) => handleChange(m.userId, e.target.value)}
                      className="w-28"
                    />
                    <span className="text-sm text-muted-foreground">timer</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamBudget;
