import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useFormulaCalculation } from '@/hooks/useFormulaCalculation';
import { useFirmStandardAccounts, type FirmStandardAccount } from '@/hooks/useFirmStandardAccounts';
import { formatCurrency } from '@/lib/formatters';
import { useToast } from '@/hooks/use-toast';
import { useScope } from '@/contexts/ScopeContext';
import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
interface AccountLinesWidgetProps {
  widget: Widget;
}

interface RowDef {
  expr: string; // e.g. "[10]" or "[19-79]"
  label: string;
}

function AccountLineRow({
  clientId,
  clientIds,
  isGlobalMulti,
  fiscalYear,
  selectedVersion,
  expr,
  label,
  unitScale,
  showCurrency,
  showYoY,
  shareBaseValue,
}: {
  clientId?: string;
  clientIds?: string[];
  isGlobalMulti?: boolean;
  fiscalYear: number;
  selectedVersion?: string;
  expr: string;
  label: string;
  unitScale: 'none' | 'thousand' | 'million';
  showCurrency: boolean;
  showYoY: boolean;
  shareBaseValue?: number;
}) {
  const isMulti = !!isGlobalMulti && !!clientIds && clientIds.length > 0;

  const current = useFormulaCalculation({
    clientId,
    fiscalYear,
    customFormula: expr,
    selectedVersion,
    enabled: !isMulti && !!clientId && !!fiscalYear && !!expr,
  });
  const prev = useFormulaCalculation({
    clientId,
    fiscalYear: fiscalYear - 1,
    customFormula: expr,
    selectedVersion: undefined,
    enabled: !isMulti && showYoY && !!clientId && !!fiscalYear && !!expr,
  });
  const { toast } = useToast();

  const multiCurrent = useQueries({
    queries: isMulti
      ? (clientIds || []).map((id) => ({
          queryKey: ['account-line', 'current', id, fiscalYear, expr, selectedVersion],
          queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('calculate-formula', {
              body: { clientId: id, fiscalYear, customFormula: expr, selectedVersion },
            });
            if (error) throw new Error(error.message || 'Formula calculation failed');
            return data as any;
          },
          staleTime: 5 * 60 * 1000,
        }))
      : [],
  });

  const multiPrev = useQueries({
    queries: isMulti && showYoY
      ? (clientIds || []).map((id) => ({
          queryKey: ['account-line', 'prev', id, fiscalYear - 1, expr, selectedVersion],
          queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('calculate-formula', {
              body: { clientId: id, fiscalYear: fiscalYear - 1, customFormula: expr, selectedVersion: undefined },
            });
            if (error) throw new Error(error.message || 'Formula calculation failed');
            return data as any;
          },
          staleTime: 5 * 60 * 1000,
        }))
      : [],
  });

  const scale = (v: number) => {
    switch (unitScale) {
      case 'thousand':
        return v / 1_000;
      case 'million':
        return v / 1_000_000;
      default:
        return v;
    }
  };

  const formatAmount = (v: number) =>
    showCurrency ? formatCurrency(v) : new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 2 }).format(v);

  const loading = isMulti
    ? multiCurrent.some((q) => q.isLoading) || (showYoY && multiPrev.some((q) => q.isLoading))
    : current.isLoading || (showYoY && prev.isLoading);
  const hasError = isMulti
    ? multiCurrent.some((q) => q.error) || (showYoY && multiPrev.some((q) => q.error))
    : !!current.error || (showYoY && !!prev.error);

  let valueCell = '—';
  let prevValueCell: string | null = null;
  let yoyCell: string | null = null;
  let shareCell: string | null = null;

  if (!loading && !hasError) {
    if (isMulti) {
      const valids = multiCurrent.map((q) => q.data).filter((d: any) => d && d.isValid);
      if (valids.length > 0) {
        const sum = valids.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0);
        valueCell = formatAmount(scale(sum));

        if (typeof shareBaseValue === 'number' && shareBaseValue !== 0) {
          const pct = (sum / Math.abs(shareBaseValue)) * 100;
          shareCell = pct.toFixed(1) + '%';
        }

        if (showYoY) {
          const prevValids = multiPrev.map((q) => q.data).filter((d: any) => d && d.isValid);
          const prevSum = prevValids.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0);
          prevValueCell = formatAmount(scale(prevSum));
          if (prevSum !== 0) {
            const diffPct = ((sum - prevSum) / Math.abs(prevSum)) * 100;
            yoyCell = (diffPct > 0 ? '+' : '') + diffPct.toFixed(1) + '%';
          } else {
            yoyCell = '0%';
          }
        }
      }
    } else if (current.data?.isValid) {
      const val = scale(current.data.value);
      valueCell = formatAmount(val);

      if (typeof shareBaseValue === 'number' && shareBaseValue !== 0) {
        const pct = (current.data.value / Math.abs(shareBaseValue)) * 100;
        shareCell = pct.toFixed(1) + '%';
      }

      if (showYoY && prev.data?.isValid) {
        const prevVal = prev.data.value;
        prevValueCell = formatAmount(scale(prevVal));
        if (prevVal !== 0) {
          const diffPct = ((current.data.value - prevVal) / Math.abs(prevVal)) * 100;
          yoyCell = (diffPct > 0 ? '+' : '') + diffPct.toFixed(1) + '%';
        } else {
          yoyCell = '0%';
        }
      }
    }
  }

  React.useEffect(() => {
    if (!isMulti && !loading && expr.includes('-') && (!current.data?.isValid || current.data.value === 0)) {
      console.warn(`Kontointervall ${expr} mangler data`);
      toast({
        title: 'Manglende kontodata',
        description: `Kontointervall ${expr} mangler data.`,
      });
    }
  }, [isMulti, loading, current.data, expr, toast]);

  return (
    <TableRow>
      <TableCell className="text-xs">{label}</TableCell>
      <TableCell className="text-right text-xs">{valueCell}</TableCell>
      {showYoY && <TableCell className="text-right text-xs">{prevValueCell ?? '—'}</TableCell>}
      {shareCell !== null && <TableCell className="text-right text-xs">{shareCell}</TableCell>}
      {showYoY && <TableCell className="text-right text-xs">{yoyCell ?? '—'}</TableCell>}
    </TableRow>
  );
}

export function AccountLinesWidget({ widget }: AccountLinesWidgetProps) {
  const { selectedFiscalYear } = useFiscalYear();
  const { updateWidget } = useWidgetManager();
  const { data: standardAccounts = [] } = useFirmStandardAccounts();

const clientId = widget.config?.clientId;
const selectedVersion = widget.config?.selectedVersion;
const unitScale: 'none' | 'thousand' | 'million' = widget.config?.unitScale || 'none';
const showCurrency: boolean = widget.config?.showCurrency !== false;
const showYoY: boolean = widget.config?.showYoY !== false;
const showShareOf: boolean = widget.config?.showShareOf || false;
const shareBaseExpr: string = widget.config?.shareBaseExpr || '[10]';

const { scopeType, selectedClientIds } = useScope();
const isGlobalMulti = !clientId && scopeType === 'custom' && (selectedClientIds?.length || 0) > 0;

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };

  // Build rows from config
  const lineNumbers: string[] = widget.config?.accountLines || [];
  const intervals: string[] = widget.config?.accountIntervals || [];

  const rows: RowDef[] = React.useMemo(() => {
    const r: RowDef[] = [];
    const byNumber = new Map<string, string>(standardAccounts.map((sa: FirmStandardAccount) => [String(sa.standard_number), sa.standard_name] as [string, string]));

    lineNumbers.forEach(num => {
      const name = byNumber.get(String(num));
      const label = name ? `${num} - ${name}` : `[${num}]`;
      r.push({ expr: `[${num}]`, label });
    });
    intervals.forEach(iv => {
      const expr = iv.startsWith('[') ? iv : `[${iv}]`;
      r.push({ expr, label: expr });
    });
    return r;
  }, [lineNumbers, intervals, standardAccounts]);

// Fetch base value once if share is enabled
const baseCalc = useFormulaCalculation({
  clientId,
  fiscalYear: selectedFiscalYear,
  customFormula: showShareOf ? shareBaseExpr : undefined,
  selectedVersion,
  enabled: !isGlobalMulti && !!clientId && !!selectedFiscalYear && showShareOf,
});

// Multi-client base aggregation if share is enabled
const multiBase = useQueries({
  queries:
    isGlobalMulti && showShareOf
      ? (selectedClientIds || []).map((id) => ({
          queryKey: ['account-line', 'share-base', id, selectedFiscalYear, shareBaseExpr, selectedVersion],
          queryFn: async () => {
            const { data, error } = await supabase.functions.invoke('calculate-formula', {
              body: { clientId: id, fiscalYear: selectedFiscalYear, customFormula: shareBaseExpr, selectedVersion },
            });
            if (error) throw new Error(error.message || 'Formula calculation failed');
            return data as any;
          },
          staleTime: 5 * 60 * 1000,
        }))
      : [],
});

const shareBaseValue = showShareOf
  ? (isGlobalMulti
      ? (() => {
          const valids = multiBase.map((q) => q.data).filter((d: any) => d && d.isValid);
          if (valids.length === 0) return undefined;
          return valids.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0);
        })()
      : baseCalc.data?.isValid
        ? baseCalc.data.value
        : undefined)
  : undefined;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <InlineEditableTitle title={widget.title} onTitleChange={handleTitleChange} size="sm" />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Linje</TableHead>
              <TableHead className="text-xs text-right">Verdi ({selectedFiscalYear})</TableHead>
              {showYoY && <TableHead className="text-xs text-right">Verdi ({selectedFiscalYear - 1})</TableHead>}
              {showShareOf && <TableHead className="text-xs text-right">Andel av {shareBaseExpr}</TableHead>}
              {showYoY && <TableHead className="text-xs text-right">Endring YoY</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2 + (showShareOf ? 1 : 0) + (showYoY ? 2 : 0)} className="text-center text-muted-foreground text-xs">
                  Ingen linjer valgt. Åpne konfigurasjonen og legg til linjer eller intervaller.
                </TableCell>
              </TableRow>
            ) : (
rows.map((row, idx) => (
  <AccountLineRow
    key={idx}
    clientId={clientId}
    clientIds={selectedClientIds}
    isGlobalMulti={isGlobalMulti}
    fiscalYear={selectedFiscalYear}
    selectedVersion={selectedVersion}
    expr={row.expr}
    label={row.label}
    unitScale={unitScale}
    showCurrency={showCurrency}
    showYoY={showYoY}
    shareBaseValue={shareBaseValue}
  />
))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
