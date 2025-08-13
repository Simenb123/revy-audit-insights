import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useFormulaCalculation } from '@/hooks/useFormulaCalculation';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { formatCurrency } from '@/lib/formatters';
import { useScope } from '@/contexts/ScopeContext';
import { KpiBenchmarkPanel } from './KpiBenchmarkPanel';
import { loadReportBuilderSettings, saveReportBuilderSettings } from '@/hooks/useReportBuilderSettings';
import { useKpiBenchmarkExport } from '@/hooks/useKpiBenchmarkExport';
import { BenchmarkControls } from './BenchmarkControls';
import { useKpiBenchmarkAggregation } from '@/hooks/useKpiBenchmarkAggregation';
import { KpiBenchmarkSummary } from './KpiBenchmarkSummary';
import { useKpiBenchmarkState } from '@/hooks/useKpiBenchmarkState';
import { getScaleDivisor, formatNumeric, formatPercent } from '@/utils/kpiFormat';
import { useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface KpiWidgetProps {
  widget: Widget;
}

export function KpiWidget({ widget }: KpiWidgetProps) {
  const { selectedFiscalYear } = useFiscalYear();
  const { updateWidget } = useWidgetManager();
  const clientId = widget.config?.clientId;
  const sourceType = widget.config?.sourceType || 'alias';
  const metric = widget.config?.metric || 'revenue';
  const formulaId = sourceType === 'formula' ? widget.config?.formulaId : undefined;
  const customFormula = sourceType === 'expr' ? (widget.config?.customFormula ?? '') : metric; // alias string by default
  const showTrend = widget.config?.showTrend !== false;
  const displayAsPercentage = widget.config?.displayAsPercentage || false;
  const showCurrency = widget.config?.showCurrency !== false;
  const unitScale = widget.config?.unitScale || 'none';

  const { scopeType, selectedClientIds } = useScope();
  const [showBenchmark, setShowBenchmark] = React.useState(false);
  const { clientsInfo, valuesByClient, setClientValue, groupNames } = useKpiBenchmarkState({ scopeType, showBenchmark, selectedClientIds });
  
  const [aggregateMode, setAggregateMode] = React.useState<'none' | 'sum' | 'avg'>('none');
  
  const [selectedGroup, setSelectedGroup] = React.useState<string>('all');

  // Load persisted benchmark selections
  React.useEffect(() => {
    if (!clientId || !selectedFiscalYear) return;
    const s = loadReportBuilderSettings(clientId, selectedFiscalYear);
    if (s) {
      if (typeof s.benchmarkAggregateMode === 'string') setAggregateMode(s.benchmarkAggregateMode as 'none' | 'sum' | 'avg');
      if (typeof s.benchmarkSelectedGroup === 'string') setSelectedGroup(s.benchmarkSelectedGroup);
      if (typeof s.benchmarkShow === 'boolean') setShowBenchmark(s.benchmarkShow);
    }
  }, [clientId, selectedFiscalYear]);


  // Persist benchmark selections
  React.useEffect(() => {
    if (!clientId || !selectedFiscalYear) return;
    const existing = loadReportBuilderSettings(clientId, selectedFiscalYear) || {};
    saveReportBuilderSettings(clientId, selectedFiscalYear, {
      ...existing,
      benchmarkAggregateMode: aggregateMode,
      benchmarkSelectedGroup: selectedGroup,
      benchmarkShow: showBenchmark,
    });
  }, [clientId, selectedFiscalYear, aggregateMode, selectedGroup, showBenchmark]);

  const filteredClients = React.useMemo(() => (
    selectedGroup === 'all' ? clientsInfo : clientsInfo.filter((c) => c.group === selectedGroup)
  ), [clientsInfo, selectedGroup]);

  const { canExport, handleExportBenchmark } = useKpiBenchmarkExport({
    showBenchmark,
    widgetTitle: widget.title,
    selectedFiscalYear,
    selectedGroup,
    aggregateMode,
    displayAsPercentage,
    showCurrency,
    unitScale,
    filteredClients,
    valuesByClient,
  });
  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };
  
  // Use new formula calculation for current year
  const currentFormulaResult = useFormulaCalculation({
    clientId,
    fiscalYear: selectedFiscalYear,
    formulaId,
    customFormula,
    selectedVersion: widget.config?.selectedVersion,
    enabled: !!clientId && !!selectedFiscalYear
  });

  // Use new formula calculation for previous year (for trend calculation)
  const previousFiscalYear = selectedFiscalYear - 1;
  const previousFormulaResult = useFormulaCalculation({
    clientId,
    fiscalYear: previousFiscalYear,
    formulaId,
    customFormula,
    selectedVersion: widget.config?.selectedVersion,
    enabled: !!clientId && !!previousFiscalYear && showTrend
  });

  // Multi-client aggregation in custom scope (global mode)
  const isGlobalMulti = !clientId && scopeType === 'custom' && (selectedClientIds?.length || 0) > 0;
  const enabledMulti = isGlobalMulti && !!selectedFiscalYear;

  const multiCurrent = useQueries({
    queries: enabledMulti
      ? (selectedClientIds || []).map((id) => ({
          queryKey: [
            'formula-calculation',
            id,
            selectedFiscalYear,
            formulaId,
            typeof customFormula === 'object' ? JSON.stringify(customFormula) : customFormula,
            widget.config?.selectedVersion,
          ],
          queryFn: async () => {
            const payload: any = {
              clientId: id,
              fiscalYear: selectedFiscalYear,
              selectedVersion: widget.config?.selectedVersion,
            };
            if (typeof formulaId === 'string') payload.formulaId = formulaId;
            if (customFormula !== undefined) payload.customFormula = customFormula;
            const { data, error } = await supabase.functions.invoke('calculate-formula', { body: payload });
            if (error) throw new Error(error.message || 'Formula calculation failed');
            return data as any;
          },
          staleTime: 5 * 60 * 1000,
        }))
      : [],
  });

  const multiPrev = useQueries({
    queries: enabledMulti && showTrend
      ? (selectedClientIds || []).map((id) => ({
          queryKey: [
            'formula-calculation-prev',
            id,
            previousFiscalYear,
            formulaId,
            typeof customFormula === 'object' ? JSON.stringify(customFormula) : customFormula,
            widget.config?.selectedVersion,
          ],
          queryFn: async () => {
            const payload: any = {
              clientId: id,
              fiscalYear: previousFiscalYear,
              selectedVersion: widget.config?.selectedVersion,
            };
            if (typeof formulaId === 'string') payload.formulaId = formulaId;
            if (customFormula !== undefined) payload.customFormula = customFormula;
            const { data, error } = await supabase.functions.invoke('calculate-formula', { body: payload });
            if (error) throw new Error(error.message || 'Formula calculation failed');
            return data as any;
          },
          staleTime: 5 * 60 * 1000,
        }))
      : [],
  });

  // Calculate metric data (single client or aggregated multi-client)
  const metricData = React.useMemo(() => {
    if (isGlobalMulti) {
      if (multiCurrent.length === 0 || multiCurrent.some((q) => q.isLoading)) {
        return { value: 'Laster...', change: '0%', trend: 'neutral' as const };
      }
      const valids = multiCurrent
        .map((q) => q.data)
        .filter((d: any) => d && d.isValid) as any[];
      if (valids.length === 0) {
        return { value: 'N/A', change: '0%', trend: 'neutral' as const };
      }
      const currentSum = valids.reduce((s, d) => s + (Number(d.value) || 0), 0);
      const resultType = (valids.find((d) => d?.metadata?.type)?.metadata?.type || 'amount') as
        | 'amount'
        | 'percentage'
        | 'ratio';
      const divisor = resultType === 'amount' ? getScaleDivisor(unitScale) : 1;
      const aggValue = aggregateMode === 'avg' ? currentSum / valids.length : currentSum;
      const scaledCurrent = aggValue / divisor;
      const formattedValue =
        displayAsPercentage || resultType === 'percentage'
          ? formatPercent(scaledCurrent)
          : resultType === 'ratio'
          ? formatNumeric(scaledCurrent)
          : showCurrency
          ? formatCurrency(scaledCurrent)
          : formatNumeric(scaledCurrent);

      if (!showTrend) {
        return { value: formattedValue, change: '0%', trend: 'neutral' as const };
      }
      if (multiPrev.length === 0 || multiPrev.some((q) => q.isLoading) || multiPrev.every((q) => !q.data?.isValid)) {
        return { value: formattedValue, change: '0%', trend: 'neutral' as const };
      }
      const prevValids = multiPrev
        .map((q) => q.data)
        .filter((d: any) => d && d.isValid) as any[];
      const prevSum = prevValids.reduce((s, d) => s + (Number(d.value) || 0), 0);
      if (prevSum === 0) {
        return { value: formattedValue, change: '0%', trend: 'neutral' as const };
      }
      const diff = aggValue - prevSum;
      const changePercent = (diff / Math.abs(prevSum)) * 100;
      const trend = changePercent > 0 ? ('up' as const) : changePercent < 0 ? ('down' as const) : ('neutral' as const);
      const formattedChange = `${changePercent > 0 ? '+' : ''}${formatPercent(changePercent)}`;
      return { value: formattedValue, change: formattedChange, trend };
    }

    // Single-client path
    if (currentFormulaResult.isLoading) {
      return { value: 'Laster...', change: '0%', trend: 'neutral' as const };
    }

    if (currentFormulaResult.error || !currentFormulaResult.data?.isValid) {
      return { value: 'N/A', change: '0%', trend: 'neutral' as const };
    }

    const currentValue = currentFormulaResult.data.value;
    const resultType = currentFormulaResult.data.metadata?.type as 'amount' | 'percentage' | 'ratio' | undefined;

    const scaleDivisor = resultType === 'amount' ? getScaleDivisor(unitScale) : 1;
    const scaledCurrent = currentValue / scaleDivisor;

    const formattedValue =
      displayAsPercentage || resultType === 'percentage'
        ? formatPercent(scaledCurrent)
        : resultType === 'ratio'
        ? formatNumeric(scaledCurrent)
        : showCurrency
        ? formatCurrency(scaledCurrent)
        : formatNumeric(scaledCurrent);

    if (!showTrend || previousFormulaResult.isLoading || previousFormulaResult.error || !previousFormulaResult.data?.isValid) {
      return { value: formattedValue, change: '0%', trend: 'neutral' as const };
    }

    const previousValue = previousFormulaResult.data.value;
    if (previousValue === 0) {
      return { value: formattedValue, change: '0%', trend: 'neutral' as const };
    }

    const diff = currentValue - previousValue;
    const changePercent = (diff / Math.abs(previousValue)) * 100;
    const trend = changePercent > 0 ? ('up' as const) : changePercent < 0 ? ('down' as const) : ('neutral' as const);
    const formattedChange = `${changePercent > 0 ? '+' : ''}${formatPercent(changePercent)}`;

    return {
      value: formattedValue,
      change: formattedChange,
      trend,
    };
  }, [
    isGlobalMulti,
    multiCurrent,
    multiPrev,
    aggregateMode,
    unitScale,
    displayAsPercentage,
    showCurrency,
    showTrend,
    currentFormulaResult,
    previousFormulaResult,
  ]);


  const { aggregatedDisplay } = useKpiBenchmarkAggregation({
    showBenchmark,
    aggregateMode,
    displayAsPercentage,
    showCurrency,
    unitScale,
    selectedGroup,
    clientsInfo,
    valuesByClient,
  });

  if ((isGlobalMulti && multiCurrent.some((q) => q.isLoading)) || (!isGlobalMulti && currentFormulaResult.isLoading)) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <InlineEditableTitle 
            title={widget.title} 
            onTitleChange={handleTitleChange}
            size="sm"
          />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Laster...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex items-center justify-between gap-2">
        <InlineEditableTitle 
          title={widget.title} 
          onTitleChange={handleTitleChange}
          size="sm"
        />
        {scopeType === 'custom' && (
          <div className="flex items-center gap-2">
            {showBenchmark && (
              <>
                <BenchmarkControls
                  groupNames={groupNames}
                  selectedGroup={selectedGroup}
                  onSelectedGroupChange={setSelectedGroup}
                  aggregateMode={aggregateMode}
                  onToggleSum={() => setAggregateMode((m) => (m === 'sum' ? 'none' : 'sum'))}
                  onToggleAvg={() => setAggregateMode((m) => (m === 'avg' ? 'none' : 'avg'))}
                  canExport={canExport}
                  onExport={handleExportBenchmark}
                />
              </>
            )}
            <Button variant={showBenchmark ? 'default' : 'outline'} size="sm" onClick={() => setShowBenchmark((v) => !v)}>
              Benchmark
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <KpiBenchmarkSummary aggregatedDisplay={aggregatedDisplay} fallbackValue={metricData.value} />
        {showTrend && (
          <div className="flex items-center pt-1">
            {metricData.trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-success mr-1" />
            ) : metricData.trend === 'down' ? (
              <TrendingDown className="h-4 w-4 text-destructive mr-1" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground mr-1" />
            )}
            <span
              className={`text-xs ${
                metricData.trend === 'up'
                  ? 'text-success'
                  : metricData.trend === 'down'
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              }`}
            >
              {metricData.change}
            </span>
          </div>
        )}
        {scopeType === 'custom' && showBenchmark && (
          <div className="mt-4 border-t pt-3">
            <KpiBenchmarkPanel
              fiscalYear={selectedFiscalYear}
              clients={clientsInfo}
              formulaId={formulaId}
              customFormula={customFormula}
              selectedVersion={widget.config?.selectedVersion}
              displayAsPercentage={displayAsPercentage}
              showCurrency={showCurrency}
              unitScale={unitScale}
              onValue={setClientValue}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}