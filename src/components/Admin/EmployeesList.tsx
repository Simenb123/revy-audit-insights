
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import InitialsTag from '@/components/People/InitialsTag';
import { useEmployees } from '@/hooks/useEmployees';
import { useUpdateEmployeeProfile } from '@/hooks/useUpdateEmployeeProfile';
import EmployeeRow from './EmployeeRow';

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
            {filtered.map((emp) => (
              <EmployeeRow
                key={emp.id}
                emp={emp}
                isSaving={updateProfile.isPending}
                onSave={(id, initials, color) =>
                  updateProfile.mutate({
                    id,
                    initials,
                    initials_color: color,
                  })
                }
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeesList;
