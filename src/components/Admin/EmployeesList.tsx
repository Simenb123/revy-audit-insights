
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import InitialsTag from '@/components/People/InitialsTag';
import { useEmployees } from '@/hooks/useEmployees';
import { useUpdateEmployeeProfile } from '@/hooks/useUpdateEmployeeProfile';
import { Badge } from '@/components/ui/badge';

const EmployeesList: React.FC = () => {
  const { data: employees = [], isLoading } = useEmployees();
  const updateProfile = useUpdateEmployeeProfile();
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      const name = `${e.first_name ?? ''} ${e.last_name ?? ''}`.trim().toLowerCase();
      return name.includes(q) || (e.email ?? '').toLowerCase().includes(q) || (e.initials ?? '').toLowerCase().includes(q);
    });
  }, [employees, filter]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Ansattregister</CardTitle>
          <div className="w-full max-w-xs">
            <Input placeholder="Søk etter navn, e-post eller initialer" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-muted-foreground">Laster ansatte...</div>
        ) : filtered.length === 0 ? (
          <div className="text-muted-foreground">Ingen ansatte funnet</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((emp) => {
              const fullName = `${emp.first_name ?? ''} ${emp.last_name ?? ''}`.trim();
              const [initials, setInitials] = useState(emp.initials ?? '');
              const [color, setColor] = useState(emp.initials_color ?? '#64748b');

              return (
                <div key={emp.id} className="grid grid-cols-1 md:grid-cols-[auto,1fr,auto,auto,auto] items-center gap-3 p-3 border rounded-lg">
                  <InitialsTag initials={emp.initials} fullName={fullName} color={emp.initials_color ?? undefined} />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{fullName || emp.email || 'Ukjent'}</div>
                    <div className="text-xs text-muted-foreground truncate">{emp.email}</div>
                  </div>
                  <Badge variant="secondary" className="justify-self-start">{emp.user_role ?? 'ukjent'}</Badge>
                  <div className="flex items-center gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Initialer</Label>
                      <Input
                        value={initials}
                        onChange={(e) => setInitials(e.target.value.toUpperCase())}
                        className="w-24"
                        placeholder="SB / LOT"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Farge</Label>
                      <input
                        type="color"
                        value={color || '#64748b'}
                        onChange={(e) => setColor(e.target.value)}
                        className="h-9 w-12 rounded border border-border bg-background"
                        aria-label="Velg farge for initialer"
                      />
                    </div>
                  </div>
                  <div className="justify-self-end">
                    <Button
                      size="sm"
                      onClick={() =>
                        updateProfile.mutate({
                          id: emp.id,
                          initials: initials.trim(),
                          initials_color: color,
                        })
                      }
                      disabled={updateProfile.isPending}
                    >
                      Lagre
                    </Button>
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

export default EmployeesList;
