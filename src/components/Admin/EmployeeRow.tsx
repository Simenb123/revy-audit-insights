
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import InitialsTag from '@/components/People/InitialsTag';
import type { EmployeeProfile } from '@/hooks/useEmployees';

type EmployeeRowProps = {
  emp: EmployeeProfile;
  onSave: (id: string, initials: string, color: string) => void;
  isSaving: boolean;
};

const EmployeeRow: React.FC<EmployeeRowProps> = ({ emp, onSave, isSaving }) => {
  const fullName = `${emp.first_name ?? ''} ${emp.last_name ?? ''}`.trim();
  const [initials, setInitials] = useState(emp.initials ?? '');
  const [color, setColor] = useState(emp.initials_color ?? '#64748b');

  return (
    <div className="grid grid-cols-1 md:grid-cols-[auto,1fr,auto,auto,auto] items-center gap-3 p-3 border rounded-lg">
      <InitialsTag initials={emp.initials ?? undefined} fullName={fullName} color={emp.initials_color ?? undefined} />
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
          onClick={() => onSave(emp.id, initials.trim(), color)}
          disabled={isSaving}
        >
          Lagre
        </Button>
      </div>
    </div>
  );
};

export default EmployeeRow;
