import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFirmEmployees } from '@/hooks/useFirmEmployees';
import { useCreateFirmEmployee } from '@/hooks/useCreateFirmEmployee';
import { useUpdateFirmEmployee } from '@/hooks/useUpdateFirmEmployee';
import { useDeleteFirmEmployee } from '@/hooks/useDeleteFirmEmployee';
import type { EmployeeStatus, FirmEmployee, UserRole } from '@/types/organization';
import { Trash2, Save, Plus, Search } from 'lucide-react';

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'employee', label: 'Medarbeider' },
  { value: 'manager', label: 'Manager' },
  { value: 'partner', label: 'Partner' },
  { value: 'admin', label: 'Administrator' },
];

const statusOptions: { value: EmployeeStatus; label: string }[] = [
  { value: 'pre_registered', label: 'Forhåndsregistrert' },
  { value: 'active', label: 'Aktiv' },
  { value: 'inactive', label: 'Inaktiv' },
  { value: 'student', label: 'Student' },
  { value: 'test', label: 'Test' },
];

function EmployeeRow({ emp, onSave, onDelete }: {
  emp: FirmEmployee;
  onSave: (changes: Partial<FirmEmployee>) => void;
  onDelete: () => void;
}) {
  const [role, setRole] = useState<UserRole>(emp.role);
  const [status, setStatus] = useState<EmployeeStatus>(emp.status);

  const hasChanges = role !== emp.role || status !== emp.status;

  return (
    <div className="grid grid-cols-12 gap-3 items-center py-2 border-b">
      <div className="col-span-4">
        <div className="font-medium">{emp.firstName} {emp.lastName}</div>
        <div className="text-sm text-muted-foreground">{emp.email || 'Ingen e-post'}</div>
      </div>
      <div className="col-span-3">
        <Select value={role} onValueChange={(v: UserRole) => setRole(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roleOptions.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-3">
        <Select value={status} onValueChange={(v: EmployeeStatus) => setStatus(v)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => onDelete()}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button size="sm" disabled={!hasChanges} onClick={() => onSave({ id: emp.id, role, status })}>
          <Save className="h-4 w-4 mr-1" />Lagre
        </Button>
      </div>
    </div>
  );
}

export default function FirmEmployeesManager() {
  const { data: employees = [], isLoading } = useFirmEmployees();
  const createMut = useCreateFirmEmployee();
  const updateMut = useUpdateFirmEmployee();
  const deleteMut = useDeleteFirmEmployee();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [status, setStatus] = useState<EmployeeStatus>('pre_registered');
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return employees;
    return employees.filter(e =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(f) ||
      (e.email || '').toLowerCase().includes(f)
    );
  }, [employees, filter]);

  const handleAdd = () => {
    if (!firstName || !lastName) return;
    createMut.mutate({ firstName, lastName, email: email || undefined, role, status });
    setFirstName(''); setLastName(''); setEmail(''); setRole('employee'); setStatus('pre_registered');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Forhåndsregistrer ansatte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-6">
            <div className="space-y-2 md:col-span-2">
              <Label>Fornavn</Label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Fornavn" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Etternavn</Label>
              <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Etternavn" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>E-post (valgfritt)</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="bruker@firma.no" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Rolle</Label>
              <Select value={role} onValueChange={(v: UserRole) => setRole(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg rolle" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v: EmployeeStatus) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(o => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex items-end">
              <Button className="w-full" onClick={handleAdd} disabled={createMut.isPending || !firstName || !lastName}>
                <Plus className="h-4 w-4 mr-2" />Legg til ansatt
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ansatte i firma</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Søk navn eller e-post" value={filter} onChange={(e) => setFilter(e.target.value)} />
            </div>
          </div>
          <div className="border rounded-md">
            <div className="grid grid-cols-12 gap-3 py-2 px-2 text-sm text-muted-foreground border-b bg-muted/30">
              <div className="col-span-4">Navn / e-post</div>
              <div className="col-span-3">Rolle</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-2 text-right">Handling</div>
            </div>
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Laster...</div>
            ) : filtered.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">Ingen ansatte registrert.</div>
            ) : (
              filtered.map(emp => (
                <div key={emp.id} className="px-2">
                  <EmployeeRow
                    emp={emp}
                    onDelete={() => deleteMut.mutate(emp.id)}
                    onSave={(changes) => updateMut.mutate({ id: emp.id, role: changes.role, status: changes.status })}
                  />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
