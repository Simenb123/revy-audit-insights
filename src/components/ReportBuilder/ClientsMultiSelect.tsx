import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useClientList } from '@/hooks/useClientList';
import { useScope } from '@/contexts/ScopeContext';

export function ClientsMultiSelect() {
  const { data: clients = [], isLoading } = useClientList();
  const { selectedClientIds, setSelectedClientIds } = useScope();

  const toggle = (id: string) => {
    if (selectedClientIds.includes(id)) {
      setSelectedClientIds(selectedClientIds.filter(cid => cid !== id));
    } else {
      setSelectedClientIds([...selectedClientIds, id]);
    }
  };

  const clearAll = () => setSelectedClientIds([]);

  if (isLoading) return <div className="text-sm opacity-70">Laster klienter…</div>;

  return (
    <div className="flex items-start gap-3">
      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto pr-2">
        {clients.map((c: any) => (
          <label key={c.id} className="flex items-center gap-2 text-sm">
            <Checkbox checked={selectedClientIds.includes(c.id)} onCheckedChange={() => toggle(c.id)} />
            <span className="truncate" title={c.company_name || c.name}>{c.company_name || c.name}</span>
          </label>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="outline" size="sm" onClick={clearAll}>Tøm</Button>
      </div>
    </div>
  );
}
