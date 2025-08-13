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
import { useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';
import { useGeneralLedgerData } from '@/hooks/useGeneralLedgerData';
import { useBudgetAnalytics } from '@/hooks/useBudgetAnalytics';
import { useFilteredData } from '@/hooks/useFilteredData';
import { useFilters } from '@/contexts/FilterContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useFormulaSeries } from '@/hooks/useFormulaSeries';

interface ChartWidgetProps {
  widget: Widget;
}

export function ChartWidget({ widget }: ChartWidgetProps) {
  const { selectedFiscalYear } = useFiscalYear();
  const { updateWidget, clientId: contextClientId, year } = useWidgetManager();
  const { setCrossFilter, clearCrossFilter, filters } = useFilters();
  const clientId = widget.config?.clientId || contextClientId;
  const chartType = widget.config?.chartType || 'bar';
  const maxDataPoints = widget.config?.maxDataPoints || 6;
  const showValues = widget.config?.showValues !== false;
  const enableCrossFilter = widget.config?.enableCrossFilter !== false;
  const dataSource = widget.config?.dataSource || 'trial_balance';
  const chartDataSource = widget.config?.chartDataSource || 'breakdown';
  const yearsBack = widget.config?.yearsBack || 5;
  const periodYear = widget.config?.period_year || selectedFiscalYear || year;
  const startYear = periodYear - (yearsBack - 1);
  const unitScale = widget.config?.unitScale || 'none';
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
    chartDataSource !== 'formulaSeries' &&
    (drillPath.length === 0 || currentLevel === drillPath.length - 1);

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };
  
  const { data: trialBalanceData, isLoading: isLoadingTB } = useTrialBalanceWithMappings(
    clientId,
    periodYear,
    widget.config?.selectedVersion
  );
  const { data: transactionsData, isLoading: txLoading } = useGeneralLedgerData(
    clientId || '',
    widget.config?.selectedVersion
  );
  const { data: budgetData, isLoading: budgetLoading } = useBudgetAnalytics(
    clientId,
    periodYear
  );

  let baseEntries: any[] = [];
  let baseLoading = false;
  if (dataSource === 'transactions') {
    baseLoading = txLoading;
    baseEntries = (transactionsData || []).map(t => ({
      account_number: t.account_number,
      account_name: t.account_name,
      closing_balance: (t.debit_amount || 0) - (t.credit_amount || 0),
    }));
  } else if (dataSource === 'budget') {
    baseLoading = budgetLoading;
    baseEntries = (budgetData?.byUser || []).map(r => ({
      account_number: r.userId || r.teamId,
      account_name: r.name,
      closing_balance: r.hours,
    }));
  } else {
    baseLoading = isLoadingTB;
    baseEntries = trialBalanceData?.trialBalanceEntries || [];
  }

  // Apply global filters
  const filteredTrialBalanceEntries = useFilteredData(baseEntries);

  // Fetch formula time series when timeseries data source is selected
  const { data: formulaSeries, isLoading: isLoadingSeries } = useFormulaSeries({
    clientId,
    startYear,
    endYear: periodYear,
    formulaId: formulaIdSel,
    customFormula: customFormulaSel,
    selectedVersion: widget.config?.selectedVersion,
    enabled: chartDataSource === 'formulaSeries' && !!clientId,
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

  // Scale helper based on configured unitScale
  const scaleValue = React.useCallback(
    (val: number) => {
      switch (unitScale) {
        case 'thousand':
          return val / 1_000;
        case 'million':
          return val / 1_000_000;
        case 'percent':
          return val * 100;
        default:
          return val;
      }
    },
    [unitScale]
  );

  const scaleValueByType = React.useCallback(
    (val: number, type?: string) => {
      // Percentages are already in 0-100 range from the API; don't multiply again
      if (unitScale === 'percent') {
        const base = type === 'percentage' ? val : val * 100;
        return base;
      }
      let v = val;
      // Only scale amounts; not percentages/ratios
      if (type !== 'percentage' && type !== 'ratio') {
        if (unitScale === 'thousand') v = v / 1_000;
        else if (unitScale === 'million') v = v / 1_000_000;
      }
      return v;
    },
    [unitScale]
  );

  const formatDisplay = React.useCallback(
    (val: number) => {
      if (unitScale === 'percent') {
        return `${val.toFixed(1)}%`;
      }
      return new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 2 }).format(val);
    },
    [unitScale]
  );

  const chartData = React.useMemo(() => {
    if (chartDataSource === 'formulaSeries') {
      const series = formulaSeries ?? [];
      return series.map(p => ({ name: String(p.year), value: scaleValueByType(p.value, p.type) }));
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
        value: scaleValue(Math.abs(balance))
      }));
  }, [
    chartDataSource,
    formulaSeries,
    filteredTrialBalanceEntries,
    maxDataPoints,
    scaleValue,
    currentLevel,
    drillPath,
    drillStack,
    getFieldValue,
    scaleValueByType,
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

  const isLoadingCurrent = chartDataSource === 'formulaSeries' ? isLoadingSeries : baseLoading;

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
    <Card className={`h-full ${isFilterSource ? 'ring-2 ring-primary' : ''}`}>
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
              <Tooltip formatter={(value: number) => formatDisplay(Number(value))} />
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
              <Tooltip formatter={(value: number) => formatDisplay(Number(value))} />
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
              <Tooltip formatter={(value: number) => formatDisplay(Number(value))} />
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
      </CardContent>
    </Card>
  );
}
