import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useFormulaCalculation } from '@/hooks/useFormulaCalculation';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { formatCurrency } from '@/lib/formatters';
import { useScope } from '@/contexts/ScopeContext';
import { supabase } from '@/integrations/supabase/client';
import { exportArrayToXlsx } from '@/utils/exportToXlsx';
import { KpiBenchmarkPanel } from './KpiBenchmarkPanel';
import { loadReportBuilderSettings, saveReportBuilderSettings } from '@/hooks/useReportBuilderSettings';

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
  const [clientsInfo, setClientsInfo] = React.useState<Array<{ id: string; name: string; group: string }>>([]);
  const [valuesByClient, setValuesByClient] = React.useState<Record<string, number>>({});
  const [aggregateMode, setAggregateMode] = React.useState<'none' | 'sum' | 'avg'>('none');
  const groupNames = React.useMemo(() => Array.from(new Set((clientsInfo || []).map((c) => c.group || 'Uten gruppe'))), [clientsInfo]);
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

  React.useEffect(() => {
    const load = async () => {
      if (scopeType !== 'custom' || !showBenchmark || !selectedClientIds || selectedClientIds.length === 0) {
        setClientsInfo([]);
        return;
      }
      const { data = [] } = await supabase
        .from('clients' as any)
        .select('id, company_name, name, client_group')
        .in('id', selectedClientIds);
      const items = (data as any[]).map((c) => ({ id: c.id, name: c.company_name || c.name || c.id, group: c.client_group || 'Uten gruppe' }));
      setClientsInfo(items);
    };
    load();
  }, [scopeType, showBenchmark, selectedClientIds]);

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

  const handleExportBenchmark = () => {
    if (!clientsInfo.length) return;
    // Per-klient rader
    const rows: any[] = clientsInfo.map((c) => ({
      Klient: c.name,
      Konsern: c.group,
      Verdi: valuesByClient[c.id] ?? null,
    }));
    // Konsernaggregater (sum og snitt)
    const groups = new Map<string, string[]>();
    clientsInfo.forEach((c) => {
      const g = c.group || 'Uten gruppe';
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(c.id);
    });
    Array.from(groups.entries()).forEach(([g, ids]) => {
      const vals = ids.map((id) => valuesByClient[id]).filter((v) => typeof v === 'number' && !Number.isNaN(v)) as number[];
      const sum = vals.reduce((s, v) => s + v, 0);
      const avg = vals.length > 0 ? sum / vals.length : 0;
      rows.push({ Klient: 'SUM', Konsern: g, Verdi: sum });
      rows.push({ Klient: 'SNITT', Konsern: g, Verdi: avg });
    });
    exportArrayToXlsx(`${widget.title || 'KPI'}-benchmark-${selectedFiscalYear}`, rows);
  };
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

  // Calculate metric data using new edge function
  const metricData = React.useMemo(() => {
    if (currentFormulaResult.isLoading) {
      return { value: 'Laster...', change: '0%', trend: 'neutral' as const };
    }

    if (currentFormulaResult.error || !currentFormulaResult.data?.isValid) {
      return { value: 'N/A', change: '0%', trend: 'neutral' as const };
    }

    const currentValue = currentFormulaResult.data.value;
    const resultType = currentFormulaResult.data.metadata?.type as 'amount' | 'percentage' | 'ratio' | undefined;

    const scaleDivisor =
      resultType === 'amount'
        ? (unitScale === 'thousand' ? 1000 : unitScale === 'million' ? 1_000_000 : 1)
        : 1;

    const scaledCurrent = currentValue / scaleDivisor;

    const formattedValue =
      (displayAsPercentage || resultType === 'percentage')
        ? `${scaledCurrent.toFixed(1)}%`
        : resultType === 'ratio'
          ? new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(scaledCurrent)
          : showCurrency
            ? formatCurrency(scaledCurrent)
            : new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(scaledCurrent);

    // Calculate trend if previous data is available
    if (!showTrend || previousFormulaResult.isLoading || previousFormulaResult.error || !previousFormulaResult.data?.isValid) {
      return { value: formattedValue, change: '0%', trend: 'neutral' as const };
    }

    const previousValue = previousFormulaResult.data.value;
    if (previousValue === 0) {
      return { value: formattedValue, change: '0%', trend: 'neutral' as const };
    }

    const diff = currentValue - previousValue;
    const changePercent = (diff / Math.abs(previousValue)) * 100;
    const trend =
      changePercent > 0
        ? ('up' as const)
        : changePercent < 0
        ? ('down' as const)
        : ('neutral' as const);
    const formattedChange =
      (changePercent > 0 ? '+' : '') + changePercent.toFixed(1) + '%';

    return {
      value: formattedValue,
      change: formattedChange,
      trend,
    };
  }, [currentFormulaResult, previousFormulaResult, showTrend, displayAsPercentage, showCurrency, unitScale]);

  const scaleDivisorAgg = unitScale === 'thousand' ? 1000 : unitScale === 'million' ? 1_000_000 : 1;
  const selectedIds = React.useMemo(() => (
    selectedGroup === 'all'
      ? clientsInfo.map((c) => c.id)
      : clientsInfo.filter((c) => c.group === selectedGroup).map((c) => c.id)
  ), [clientsInfo, selectedGroup]);
  const aggVals = React.useMemo(() => selectedIds
    .map((id) => valuesByClient[id])
    .filter((v) => typeof v === 'number' && !Number.isNaN(v)) as number[], [selectedIds, valuesByClient]);
  const aggSum = React.useMemo(() => aggVals.reduce((s, v) => s + v, 0), [aggVals]);
  const aggAvg = React.useMemo(() => (aggVals.length ? aggSum / aggVals.length : 0), [aggVals, aggSum]);
  const aggregatedDisplay = React.useMemo(() => {
    if (!showBenchmark || aggregateMode === 'none') return null;
    if (aggVals.length === 0) return null;
    const val = aggregateMode === 'sum' ? aggSum : aggAvg;
    if (displayAsPercentage) return `${val.toFixed(1)}%`;
    const scaled = val / scaleDivisorAgg;
    return showCurrency
      ? formatCurrency(scaled)
      : new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(scaled);
  }, [showBenchmark, aggregateMode, aggSum, aggAvg, aggVals.length, displayAsPercentage, showCurrency, scaleDivisorAgg]);

  if (currentFormulaResult.isLoading) {
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
                <Select value={selectedGroup} onValueChange={(v) => setSelectedGroup(v)}>
                  <SelectTrigger className="h-8 w-[160px]">
                    <SelectValue placeholder="Alle grupper" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle grupper</SelectItem>
                    {groupNames.map((g) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant={aggregateMode === 'sum' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAggregateMode((m) => (m === 'sum' ? 'none' : 'sum'))}
                >
                  Sum
                </Button>
                <Button
                  variant={aggregateMode === 'avg' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAggregateMode((m) => (m === 'avg' ? 'none' : 'avg'))}
                >
                  Snitt
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportBenchmark}>
                  Eksporter benchmark
                </Button>
              </>
            )}
            <Button variant={showBenchmark ? 'default' : 'outline'} size="sm" onClick={() => setShowBenchmark((v) => !v)}>
              Benchmark
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{aggregatedDisplay ?? metricData.value}</div>
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
              onValue={(id, val) => setValuesByClient((prev) => ({ ...prev, [id]: val }))}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}