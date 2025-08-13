import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PivotWidgetConfigProps {
  config: Record<string, any>;
  onUpdate: (key: string, value: any) => void;
}

const trialBalanceFieldOptions = [
  { value: 'account_number', label: 'Kontonummer' },
  { value: 'account_name', label: 'Kontonavn' },
  { value: 'standard_name', label: 'Standardkonto' },
];

const transactionFieldOptions = [
  { value: 'transaction_date', label: 'Dato' },
  { value: 'account_number', label: 'Kontonummer' },
  { value: 'description', label: 'Beskrivelse' },
];

const trialBalanceValueOptions = [
  { value: 'closing_balance', label: 'Saldo' },
  { value: 'debit_turnover', label: 'Debet' },
  { value: 'credit_turnover', label: 'Kredit' },
];

const transactionValueOptions = [
  { value: 'amount', label: 'Beløp' },
  { value: 'debit_amount', label: 'Debet' },
  { value: 'credit_amount', label: 'Kredit' },
];

const budgetFieldOptions = [
  { value: 'team_id', label: 'Team' },
  { value: 'user_id', label: 'Medlem' },
];

const budgetValueOptions = [
  { value: 'budget_hours', label: 'Timer' },
];

export function PivotWidgetConfig({ config, onUpdate }: PivotWidgetConfigProps) {
  const fieldOptions =
    config.dataSource === 'transactions'
      ? transactionFieldOptions
      : config.dataSource === 'budget'
      ? budgetFieldOptions
      : trialBalanceFieldOptions;
  const valueOptions =
    config.dataSource === 'transactions'
      ? transactionValueOptions
      : config.dataSource === 'budget'
      ? budgetValueOptions
      : trialBalanceValueOptions;

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="rowField">Radfelt</Label>
        <Select
          value={config.rowField || ''}
          onValueChange={(value) => onUpdate('rowField', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Velg rad" />
          </SelectTrigger>
          <SelectContent>
            {fieldOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="columnField">Kolonnefelt</Label>
        <Select
          value={config.columnField || ''}
          onValueChange={(value) => onUpdate('columnField', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Velg kolonne" />
          </SelectTrigger>
          <SelectContent>
            {fieldOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="valueField">Verdifelt</Label>
        <Select
          value={config.valueField || ''}
          onValueChange={(value) => onUpdate('valueField', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Velg verdi" />
          </SelectTrigger>
          <SelectContent>
            {valueOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
