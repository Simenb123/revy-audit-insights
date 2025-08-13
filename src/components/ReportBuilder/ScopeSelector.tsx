import React from 'react';
import { Button } from '@/components/ui/button';
import { useScope } from '@/contexts/ScopeContext';
import { ClientsMultiSelect } from './ClientsMultiSelect';

export function ScopeSelector() {
  const { scopeType, setScopeType } = useScope();

  return (
    <div className="flex flex-col gap-2" aria-label="Omfangsvelger">
      <div className="flex items-center gap-2">
        <span className="text-sm opacity-80">Omfang:</span>
        <div className="flex gap-1">
          <Button
            variant={scopeType === 'client' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setScopeType('client')}
            aria-pressed={scopeType === 'client'}
          >
            Klient
          </Button>
          <Button
            variant={scopeType === 'firm' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setScopeType('firm')}
            aria-pressed={scopeType === 'firm'}
          >
            Firma
          </Button>
          <Button
            variant={scopeType === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setScopeType('custom')}
            aria-pressed={scopeType === 'custom'}
          >
            Egendefinert
          </Button>
        </div>
      </div>
      {scopeType === 'custom' && (
        <div className="pl-14">
          <ClientsMultiSelect />
        </div>
      )}
    </div>
  );
}
