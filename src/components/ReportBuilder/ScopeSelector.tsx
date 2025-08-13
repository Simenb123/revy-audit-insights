import React from 'react';
import { Button } from '@/components/ui/button';
import { useScope } from '@/contexts/ScopeContext';

export function ScopeSelector() {
  const { scopeType, setScopeType } = useScope();

  return (
    <div className="flex items-center gap-2" aria-label="Omfangsvelger">
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
      </div>
    </div>
  );
}
