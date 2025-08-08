import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useFormulaCalculation } from '@/hooks/useFormulaCalculation';
import { useFirmStandardAccounts } from '@/hooks/useFirmStandardAccounts';
import { formatCurrency } from '@/lib/formatters';

interface AccountLinesWidgetProps {
  widget: Widget;
}

interface RowDef {
  expr: string; // e.g. "[10]" or "[19-79]"
  label: string;
}

function AccountLineRow({
  clientId,
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
  fiscalYear: number;
  selectedVersion?: string;
  expr: string;
  label: string;
  unitScale: 'none' | 'thousand' | 'million';
  showCurrency: boolean;
  showYoY: boolean;
  shareBaseValue?: number;
}) {
  const current = useFormulaCalculation({
    clientId,
    fiscalYear,
    customFormula: expr,
    selectedVersion,
    enabled: !!clientId && !!fiscalYear && !!expr,
  });
  const prev = useFormulaCalculation({
    clientId,
    fiscalYear: fiscalYear - 1,
    customFormula: expr,
    selectedVersion,
    enabled: showYoY && !!clientId && !!fiscalYear && !!expr,
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

  const loading = current.isLoading || (showYoY && prev.isLoading);
  const hasError = !!current.error || (showYoY && !!prev.error);

  let valueCell = '—';
  let yoyCell: string | null = null;
  let shareCell: string | null = null;

  if (!loading && !hasError && current.data?.isValid) {
    const val = scale(current.data.value);
    valueCell = formatAmount(val);

    if (typeof shareBaseValue === 'number' && shareBaseValue !== 0) {
      const pct = (current.data.value / Math.abs(shareBaseValue)) * 100;
      shareCell = pct.toFixed(1) + '%';
    }

    if (showYoY && prev.data?.isValid) {
      const prevVal = prev.data.value;
      if (prevVal !== 0) {
        const diffPct = ((current.data.value - prevVal) / Math.abs(prevVal)) * 100;
        yoyCell = (diffPct > 0 ? '+' : '') + diffPct.toFixed(1) + '%';
      } else {
        yoyCell = '0%';
      }
    }
  }

  return (
    <TableRow>
      <TableCell className="text-xs">{label}</TableCell>
      <TableCell className="text-right text-xs">{valueCell}</TableCell>
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

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };

  // Build rows from config
  const lineNumbers: string[] = widget.config?.accountLines || [];
  const intervals: string[] = widget.config?.accountIntervals || [];

  const rows: RowDef[] = React.useMemo(() => {
    const r: RowDef[] = [];
    const byNumber = new Map(standardAccounts.map(sa => [String(sa.standard_number), sa.standard_name]));

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
    enabled: !!clientId && !!selectedFiscalYear && showShareOf,
  });

  const shareBaseValue = showShareOf && baseCalc.data?.isValid ? baseCalc.data.value : undefined;

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
              <TableHead className="text-xs text-right">Verdi</TableHead>
              {showShareOf && <TableHead className="text-xs text-right">Andel av {shareBaseExpr}</TableHead>}
              {showYoY && <TableHead className="text-xs text-right">Endring YoY</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showYoY ? (showShareOf ? 4 : 3) : (showShareOf ? 3 : 2)} className="text-center text-muted-foreground text-xs">
                  Ingen linjer valgt. Åpne konfigurasjonen og legg til linjer eller intervaller.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <AccountLineRow
                  key={idx}
                  clientId={clientId}
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
