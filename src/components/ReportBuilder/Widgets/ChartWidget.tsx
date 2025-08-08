import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
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
import { useFilteredData } from '@/hooks/useFilteredData';
import { useFilters } from '@/contexts/FilterContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useFormulaSeries } from '@/hooks/useFormulaSeries';

interface ChartWidgetProps {
  widget: Widget;
}

export function ChartWidget({ widget }: ChartWidgetProps) {
  const { selectedFiscalYear } = useFiscalYear();
  const { updateWidget } = useWidgetManager();
  const { setCrossFilter, clearCrossFilter, filters } = useFilters();
  const clientId = widget.config?.clientId;
  const chartType = widget.config?.chartType || 'bar';
  const maxDataPoints = widget.config?.maxDataPoints || 6;
  const showValues = widget.config?.showValues !== false;
  const enableCrossFilter = widget.config?.enableCrossFilter !== false;
  const dataSource = widget.config?.chartDataSource || 'breakdown';
  const yearsBack = widget.config?.yearsBack || 5;
  const startYear = selectedFiscalYear - (yearsBack - 1);
  const unitScale = widget.config?.unitScale || 'none';
  const sourceType = widget.config?.sourceType || 'alias';
  const metric = widget.config?.metric || 'revenue';
  const formulaIdSel = sourceType === 'formula' ? widget.config?.formulaId : undefined;
  const customFormulaSel = sourceType === 'expr'
    ? (widget.config?.customFormula ?? '')
    : (sourceType === 'alias' ? metric : undefined);
  const crossFilterEnabled = enableCrossFilter && dataSource !== 'formulaSeries';

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };
  
  const { data: trialBalanceData, isLoading: isLoadingTB } = useTrialBalanceWithMappings(
    clientId, 
    selectedFiscalYear,
    widget.config?.selectedVersion
  );

  // Apply global filters
  const filteredTrialBalanceEntries = useFilteredData(trialBalanceData?.trialBalanceEntries || []);

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
    if (dataSource === 'formulaSeries') {
      const series = formulaSeries ?? [];
      return series.map(p => ({ name: String(p.year), value: scaleValueByType(p.value, p.type) }));
    }

    if (!filteredTrialBalanceEntries || filteredTrialBalanceEntries.length === 0) {
      return [];
    }

    // Group filtered entries by standard name and calculate totals
    const grouped: Record<string, number> = {};
    filteredTrialBalanceEntries.forEach(entry => {
      const standardName = entry.standard_name || 'Ikke klassifisert';
      grouped[standardName] = (grouped[standardName] || 0) + Math.abs(entry.closing_balance);
    });

    // Get top accounts by balance for chart
    return Object.entries(grouped)
      .filter(([_, balance]) => Math.abs(balance) > 0)
      .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
      .slice(0, maxDataPoints)
      .map(([name, balance]) => ({
        name: name.slice(0, 10), // Truncate long names
        value: scaleValue(Math.abs(balance))
      }));
  }, [dataSource, formulaSeries, filteredTrialBalanceEntries, maxDataPoints, scaleValue]);

  // Handle chart element clicks for cross-filtering
  const handleChartClick = (data: any, index: number) => {
    if (!crossFilterEnabled || !data || !data.activePayload?.[0]) return;
    
    const clickedData = data.activePayload[0].payload;
    const categoryName = clickedData.name;
    
    // Find the full category name from the original data
    const originalEntry = filteredTrialBalanceEntries.find(entry => 
      entry.standard_name?.slice(0, 10) === categoryName
    );
    
    if (originalEntry) {
      const fullCategoryName = originalEntry.standard_name;
      
      // Check if this category is already filtered
      if (filters.crossFilter?.value === fullCategoryName) {
        // Clear the cross-filter if clicking on the same category
        clearCrossFilter();
      } else {
        // Set new cross-filter
        setCrossFilter(
          widget.id,
          'category',
          fullCategoryName,
          `Kategori: ${fullCategoryName}`
        );
      }
    }
  };

  // Check if this widget is the source of current cross-filter
  const isFilterSource = filters.crossFilter?.sourceWidgetId === widget.id;

  const isLoadingCurrent = dataSource === 'formulaSeries' ? isLoadingSeries : isLoadingTB;

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
      <CardContent className="pt-2">{crossFilterEnabled && (
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
