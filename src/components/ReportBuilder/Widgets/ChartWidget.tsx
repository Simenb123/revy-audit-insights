import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LabelList,
  Tooltip
} from 'recharts';
import { useScopedTrialBalanceWithMappings } from '@/hooks/useScopedTrialBalanceWithMappings';
import { useFilteredData } from '@/hooks/useFilteredData';
import { useFilters } from '@/contexts/FilterContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useFormulaSeries } from '@/hooks/useFormulaSeries';
import { cn } from '@/lib/utils';
import { getScaleDivisor, formatNumeric, formatPercent, getUnitLabel } from '@/utils/kpiFormat';
import { formatCurrency } from '@/lib/formatters';
import { useScope } from '@/contexts/ScopeContext';
import type { TrialBalanceEntryWithMapping } from '@/hooks/useTrialBalanceWithMappings';

interface ChartWidgetProps {
  widget: Widget;
}

export function ChartWidget({ widget }: ChartWidgetProps) {
  const { selectedFiscalYear } = useFiscalYear();
  const { updateWidget } = useWidgetManager();
  const { setCrossFilter, clearCrossFilter, filters } = useFilters();
  const { selectedClientIds } = useScope();
  const clientId = widget.config?.clientId;
  const chartType = widget.config?.chartType || 'bar';
  const maxDataPoints = widget.config?.maxDataPoints || 6;
  const showValues = widget.config?.showValues !== false;
  const enableCrossFilter = widget.config?.enableCrossFilter !== false;
  const dataSource = widget.config?.chartDataSource || 'breakdown';
  const yearsBack = widget.config?.yearsBack || 5;
  const startYear = selectedFiscalYear - (yearsBack - 1);
  const unitScale = widget.config?.unitScale || 'none';
  const displayAsPercentage = widget.config?.displayAsPercentage || false;
  const showCurrency = widget.config?.showCurrency !== false;
  const sourceType = widget.config?.sourceType || 'alias';
  const metric = widget.config?.metric || 'revenue';
  const formulaIdSel = sourceType === 'formula' ? widget.config?.formulaId : undefined;
  const customFormulaSel = sourceType === 'expr'
    ? (widget.config?.customFormula ?? '')
    : (sourceType === 'alias' ? metric : undefined);
  const drillPath: string[] = widget.config?.drillPath || [];
  const [drillStack, setDrillStack] = React.useState<string[]>([]);
  const currentLevel = drillStack.length;
  const crossFilterEnabled =
    enableCrossFilter &&
    dataSource !== 'formulaSeries' &&
    (drillPath.length === 0 || currentLevel === drillPath.length - 1);

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };
  
  const { data: trialBalanceData, isLoading: isLoadingTB } = useScopedTrialBalanceWithMappings(
    selectedClientIds,
    selectedFiscalYear,
    widget.config?.selectedVersion
  );

  // Apply global filters - aggregate entries from all clients
  const allEntries: TrialBalanceEntryWithMapping[] = [];
  if (trialBalanceData?.length) {
    for (const clientData of trialBalanceData) {
      if (clientData.trialBalance?.trialBalanceEntries) {
        allEntries.push(...clientData.trialBalance.trialBalanceEntries);
      }
    }
  }
  const filteredTrialBalanceEntries = useFilteredData(allEntries);

  // Fetch formula time series when timeseries data source is selected
  const { data: formulaSeries, isLoading: isLoadingSeries } = useFormulaSeries({
    clientId,
    startYear,
    endYear: selectedFiscalYear,
    formulaId: formulaIdSel,
    customFormula: customFormulaSel,
    selectedVersion: widget.config?.selectedVersion,
    enabled: dataSource === 'formulaSeries' && !!clientId,
  });

  const getFieldValue = React.useCallback((entry: any, field: string) => {
    switch (field) {
      case 'account':
      case 'account_number':
        return `${entry.account_number} - ${entry.account_name}`;
      case 'standard_name':
        return entry.standard_name || 'Ikke klassifisert';
      case 'standard_category':
        return entry.standard_category || 'Ikke klassifisert';
      default:
        return entry[field] || 'Ikke klassifisert';
    }
  }, []);

  const scaleDivisor = React.useMemo(() => (displayAsPercentage ? 1 : getScaleDivisor(unitScale)), [displayAsPercentage, unitScale]);
  const unitLabel = React.useMemo(() => getUnitLabel(displayAsPercentage, showCurrency, unitScale), [displayAsPercentage, showCurrency, unitScale]);

  const scaleForChart = React.useCallback(
    (val: number, type?: string) => {
      if (displayAsPercentage || type === 'percentage' || type === 'ratio') return val;
      return val / scaleDivisor;
    },
    [displayAsPercentage, scaleDivisor]
  );

  const formatValue = React.useCallback(
    (val: number, type?: string) => {
      if (displayAsPercentage || type === 'percentage') {
        return formatPercent(val, 1);
      }
      const scaled = val / scaleDivisor;
      return showCurrency ? formatCurrency(scaled) : formatNumeric(scaled);
    },
    [displayAsPercentage, scaleDivisor, showCurrency]
  );

  const chartData = React.useMemo(() => {
    if (dataSource === 'formulaSeries') {
      const series = formulaSeries ?? [];
      return series.map(p => ({ name: String(p.year), value: scaleForChart(p.value, p.type), type: p.type || 'amount' }));
    }

    if (!filteredTrialBalanceEntries || filteredTrialBalanceEntries.length === 0) {
      return [];
    }

    let entries = filteredTrialBalanceEntries;

    // Apply drill filters for previously selected levels
    for (let i = 0; i < currentLevel; i++) {
      const field = drillPath[i];
      const value = drillStack[i];
      entries = entries.filter(e => getFieldValue(e, field) === value);
    }

    const groupField = drillPath[currentLevel] || 'standard_name';

    const grouped: Record<string, number> = {};
    entries.forEach(entry => {
      const key = getFieldValue(entry, groupField);
      grouped[key] = (grouped[key] || 0) + Math.abs(entry.closing_balance);
    });

    return Object.entries(grouped)
      .filter(([_, balance]) => Math.abs(balance) > 0)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, maxDataPoints)
      .map(([name, balance]) => ({
        name: name.slice(0, 10),
        value: scaleForChart(Math.abs(balance), 'amount'),
        type: 'amount'
      }));
  }, [
    dataSource,
    formulaSeries,
    filteredTrialBalanceEntries,
    maxDataPoints,
    scaleForChart,
    currentLevel,
    drillPath,
    drillStack,
    getFieldValue,
    
  ]);

  // Handle chart element clicks for drilldown or cross-filtering
  const handleChartClick = (data: any) => {
    if (!data || !data.activePayload?.[0]) return;

    const clickedData = data.activePayload[0].payload;
    const name = clickedData.name;

    if (drillPath.length && currentLevel < drillPath.length - 1) {
      setDrillStack([...drillStack, name]);
      return;
    }

    if (!crossFilterEnabled) return;

    const field = drillPath[currentLevel] || 'standard_name';
    const filterType = field === 'account' || field === 'account_number' ? 'account' : 'category';
    const originalEntry = filteredTrialBalanceEntries.find(entry =>
      getFieldValue(entry, field).slice(0, 10) === name
    );

    if (originalEntry) {
      const fullValue = getFieldValue(originalEntry, field);

      if (filters.crossFilter?.value === fullValue) {
        clearCrossFilter();
      } else {
        setCrossFilter(
          widget.id,
          filterType,
          fullValue,
          `${filterType === 'account' ? 'Konto' : 'Kategori'}: ${fullValue}`
        );
      }
    }
  };

  // Check if this widget is the source of current cross-filter
  const isFilterSource = filters.crossFilter?.sourceWidgetId === widget.id;

  const isLoadingCurrent = dataSource === 'formulaSeries' ? isLoadingSeries : isLoadingTB;

  // Empty state for trial balance-based charts
  if (dataSource !== 'formulaSeries' && !isLoadingCurrent && filteredTrialBalanceEntries.length === 0) {
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
          <div className="text-sm text-muted-foreground">Ingen data å vise for valgt omfang/år. Kontroller at saldobalanse er importert og at konti er mappet.</div>
        </CardContent>
      </Card>
    );
  }

  if (isLoadingCurrent) {
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
          <div className="text-sm text-muted-foreground">Laster data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'h-full',
        isFilterSource
          ? 'ring-2 ring-primary'
          : filters.crossFilter
            ? 'ring-2 ring-primary/50'
            : ''
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <InlineEditableTitle 
            title={widget.title} 
            onTitleChange={handleTitleChange}
            size="sm"
          />
          {filters.crossFilter && !isFilterSource && (
            <div className="text-xs text-muted-foreground flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-1"></span>
              Filtrert
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {drillStack.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="mb-2"
            onClick={() => setDrillStack(drillStack.slice(0, -1))}
          >
            Tilbake
          </Button>
        )}
        {crossFilterEnabled && (
          <div className="text-xs text-muted-foreground mb-2">
            💡 Klikk på diagrammet for å filtrere andre widgets
          </div>
        )}
        <ResponsiveContainer width="100%" height={120}>
          {chartType === 'line' ? (
            <LineChart data={chartData} onClick={handleChartClick}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
              />
              <Tooltip formatter={(value: number, name: any, props: any) => formatValue(Number(value), props?.payload?.type)} />
              <YAxis hide />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                style={{ cursor: crossFilterEnabled ? 'pointer' : 'default' }}
              >
                {showValues && (
                  <LabelList dataKey="value" position="top" fontSize={10} />
                )}
              </Line>
            </LineChart>
          ) : chartType === 'pie' ? (
            <PieChart onClick={handleChartClick}>
              <Tooltip formatter={(value: number, name: any, props: any) => formatValue(Number(value), props?.payload?.type)} />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                fill="hsl(var(--primary))"
                outerRadius={50}
                style={{ cursor: crossFilterEnabled ? 'pointer' : 'default' }}
              >
                {showValues && <LabelList dataKey="value" fontSize={10} />}
              </Pie>
            </PieChart>
          ) : (
            <BarChart data={chartData} onClick={handleChartClick}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
              />
              <Tooltip formatter={(value: number, name: any, props: any) => formatValue(Number(value), props?.payload?.type)} />
              <YAxis hide />
              <Bar
                dataKey="value"
                fill="hsl(var(--primary))"
                radius={[2, 2, 0, 0]}
                style={{ cursor: crossFilterEnabled ? 'pointer' : 'default' }}
              >
                {showValues && (
                  <LabelList dataKey="value" position="top" fontSize={10} />
                )}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
        {unitLabel && (
          <div className="mt-2 text-[10px] text-muted-foreground">Enhet: {unitLabel}</div>
        )}
      </CardContent>
    </Card>
  );
}
