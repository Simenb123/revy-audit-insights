import React from 'react';
import { formatCurrency } from '@/lib/formatters';
import { useFormulaCalculation } from '@/hooks/useFormulaCalculation';

export function KpiBenchmarkPanel({
  fiscalYear,
  clients,
  formulaId,
  customFormula,
  selectedVersion,
  displayAsPercentage,
  showCurrency,
  onValue,
}: {
  fiscalYear: number;
  clients: Array<{ id: string; name: string; group: string }>;
  formulaId?: string;
  customFormula?: string;
  selectedVersion?: string;
  displayAsPercentage: boolean;
  showCurrency: boolean;
  onValue: (id: string, value: number) => void;
}) {
  const groups = React.useMemo(() => {
    const g = new Map<string, Array<{ id: string; name: string }>>();
    clients.forEach((c) => {
      const key = c.group || 'Uten gruppe';
      if (!g.has(key)) g.set(key, []);
      g.get(key)!.push({ id: c.id, name: c.name });
    });
    return Array.from(g.entries());
  }, [clients]);

  return (
    <div className="space-y-4">
      {groups.map(([groupName, items]) => (
        <div key={groupName} className="border rounded-md">
          <div className="px-3 py-2 text-sm font-medium">{groupName}</div>
          <div className="px-3 pb-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Klient</div>
              <div className="text-right text-muted-foreground">Verdi</div>
              {items.map((it) => (
                <ClientFormulaValue
                  key={it.id}
                  clientId={it.id}
                  name={it.name}
                  fiscalYear={fiscalYear}
                  formulaId={formulaId}
                  customFormula={customFormula}
                  selectedVersion={selectedVersion}
                  displayAsPercentage={displayAsPercentage}
                  showCurrency={showCurrency}
                  onValue={onValue}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ClientFormulaValue({
  clientId,
  name,
  fiscalYear,
  formulaId,
  customFormula,
  selectedVersion,
  displayAsPercentage,
  showCurrency,
  onValue,
}: {
  clientId: string;
  name: string;
  fiscalYear: number;
  formulaId?: string;
  customFormula?: string;
  selectedVersion?: string;
  displayAsPercentage: boolean;
  showCurrency: boolean;
  onValue: (id: string, value: number) => void;
}) {
  const result = useFormulaCalculation({ clientId, fiscalYear, formulaId, customFormula, selectedVersion, enabled: !!clientId && !!fiscalYear });

  React.useEffect(() => {
    const val = result.data?.isValid ? Number(result.data.value) : NaN;
    if (!Number.isNaN(val)) onValue(clientId, val);
  }, [clientId, result.data?.isValid, result.data?.value, onValue]);

  const value = result.data?.isValid ? Number(result.data.value) : null;
  let formatted = 'N/A';
  if (value !== null) {
    if (displayAsPercentage) {
      formatted = `${value.toFixed(1)}%`;
    } else if (showCurrency) {
      formatted = formatCurrency(value);
    } else {
      formatted = new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);
    }
  }

  return (
    <>
      <div>{name}</div>
      <div className="text-right tabular-nums">{result.isLoading ? '…' : formatted}</div>
    </>
  );
}
