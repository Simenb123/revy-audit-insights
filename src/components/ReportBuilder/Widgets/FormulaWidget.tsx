import React, { useEffect, useMemo } from 'react';
import { Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useFilters } from '@/contexts/FilterContext';
import { useFormulaCalculation } from '@/hooks/useFormulaCalculation';
import { useFormulaDefinitions } from '@/hooks/useFormulas';
import { formatCurrency } from '@/lib/formatters';
import { formatNumeric, formatPercent } from '@/utils/kpiFormat';
import { useScope } from '@/contexts/ScopeContext';
import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FormulaWidgetProps {
  /**
   * Widget configuration. The formula expression can be provided via:
   * - `widget.config.formulaId` for predefined formulas from the database
   * - `widget.config.formula` for custom formula expressions
   * The client should be provided via `widget.config.clientId`.
   */
  widget: Widget;
  /** Optional format of the result. Defaults to plain number. */
  format?: 'currency' | 'percent' | 'number';
}

/**
 * Displays the result of a formula expression. The component re-calculates the
 * value whenever filters, client, fiscal year or the formula itself changes.
 * Supports both predefined formulas (via formulaId) and custom formulas.
 */
export function FormulaWidget({ widget, format: formatProp }: FormulaWidgetProps) {
  const { updateWidget } = useWidgetManager();
  const { selectedFiscalYear } = useFiscalYear();
  const { filters } = useFilters();

  const clientId = widget.config?.clientId;
  const formulaId = widget.config?.formulaId;
  const customFormula = widget.config?.formula;
  const selectedVersion = widget.config?.selectedVersion;

  const { data: formulas } = useFormulaDefinitions();

  const { scopeType, selectedClientIds } = useScope();
  const isGlobalMulti = !clientId && scopeType === 'custom' && (selectedClientIds?.length || 0) > 0;

  // Get the selected formula definition if using a predefined formula
  const selectedFormula = useMemo(() => {
    if (formulaId && formulas) {
      return formulas.find(f => f.id === formulaId);
    }
    return null;
  }, [formulaId, formulas]);

  const format = (formatProp || widget.config?.format || 'number') as
    | 'currency'
    | 'percent'
    | 'number';

  const handleTitleChange = (title: string) => {
    updateWidget(widget.id, { title });
  };

  const hasValidFormula = !!(formulaId || customFormula);

  const calculation = useFormulaCalculation({
    clientId,
    fiscalYear: selectedFiscalYear,
    formulaId,
    customFormula,
    selectedVersion,
    enabled: !!clientId && !!selectedFiscalYear && hasValidFormula,
  });

  // Multi-client aggregation in global custom scope
  const multi = useQueries({
    queries:
      isGlobalMulti && hasValidFormula
        ? (selectedClientIds || []).map((id) => ({
            queryKey: ['formula-calculation', id, selectedFiscalYear, formulaId, customFormula, selectedVersion],
            queryFn: async () => {
              const payload: any = { 
                clientId: id, 
                fiscalYear: selectedFiscalYear, 
                selectedVersion 
              };
              
              if (formulaId) payload.formulaId = formulaId;
              if (customFormula) payload.customFormula = customFormula;

              const { data, error } = await supabase.functions.invoke('calculate-formula', {
                body: payload,
              });
              if (error) throw new Error(error.message || 'Formula calculation failed');
              return data as any;
            },
            staleTime: 5 * 60 * 1000,
          }))
        : [],
  });

  // Recalculate whenever filters change
  useEffect(() => {
    if (isGlobalMulti) {
      multi.forEach((q) => q.refetch());
    } else {
      calculation.refetch();
    }
  }, [filters, calculation.refetch, isGlobalMulti]);

  const displayValue = useMemo(() => {
    if (isGlobalMulti) {
      if (multi.length === 0 || multi.some((q) => q.isLoading)) return 'Laster...';
      const valids = multi.map((q) => q.data).filter((d: any) => d && d.isValid);
      if (valids.length === 0) return 'N/A';
      const sum = valids.reduce((s: number, d: any) => s + (Number(d.value) || 0), 0);
      switch (format) {
        case 'currency':
          return formatCurrency(sum);
        case 'percent':
          return formatPercent(sum);
        default:
          return formatNumeric(sum);
      }
    }

    if (calculation.isLoading) return 'Laster...';
    if (calculation.error || !calculation.data?.isValid) return 'N/A';

    const value = calculation.data.value;
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percent':
        return formatPercent(value);
      default:
        return formatNumeric(value);
    }
  }, [isGlobalMulti, multi, calculation, format]);

  if (((!clientId && !isGlobalMulti)) || !hasValidFormula) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-destructive">
            <Calculator className="h-4 w-4" />
            <InlineEditableTitle
              title={widget.title}
              onTitleChange={handleTitleChange}
              size="sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {!hasValidFormula ? 'Ingen formel konfigurert' : 'Klient ikke valgt'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          <InlineEditableTitle
            title={widget.title}
            onTitleChange={handleTitleChange}
            size="sm"
          />
        </div>
        {selectedFormula && (
          <div className="text-xs text-muted-foreground">
            {selectedFormula.name}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{displayValue}</div>
        {calculation.data?.error && (
          <div className="mt-2 text-xs text-destructive">
            {calculation.data.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

