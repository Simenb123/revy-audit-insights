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
  LabelList
} from 'recharts';
import { useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';
import { useFilteredData } from '@/hooks/useFilteredData';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

interface ChartWidgetProps {
  widget: Widget;
}

export function ChartWidget({ widget }: ChartWidgetProps) {
  const { selectedFiscalYear } = useFiscalYear();
  const { updateWidget } = useWidgetManager();
  const clientId = widget.config?.clientId;
  const chartType = widget.config?.chartType || 'bar';
  const maxDataPoints = widget.config?.maxDataPoints || 6;
  const showValues = widget.config?.showValues !== false;

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };
  
  const { data: trialBalanceData, isLoading } = useTrialBalanceWithMappings(
    clientId, 
    selectedFiscalYear,
    widget.config?.selectedVersion
  );

  // Apply global filters
  const filteredTrialBalanceEntries = useFilteredData(trialBalanceData?.trialBalanceEntries || []);

  const chartData = React.useMemo(() => {
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
        value: Math.abs(balance) / 1000 // Convert to thousands
      }));
  }, [filteredTrialBalanceEntries, maxDataPoints]);

  if (isLoading) {
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
    <Card className="h-full">
      <CardHeader className="pb-2">
        <InlineEditableTitle 
          title={widget.title} 
          onTitleChange={handleTitleChange}
          size="sm"
        />
      </CardHeader>
      <CardContent className="pt-2">
        <ResponsiveContainer width="100%" height={120}>
          {chartType === 'line' ? (
            <LineChart data={chartData}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis hide />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
              >
                {showValues && (
                  <LabelList dataKey="value" position="top" fontSize={10} />
                )}
              </Line>
            </LineChart>
          ) : chartType === 'pie' ? (
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                fill="hsl(var(--primary))"
                outerRadius={50}
              >
                {showValues && <LabelList dataKey="value" fontSize={10} />}
              </Pie>
            </PieChart>
          ) : (
            <BarChart data={chartData}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
              />
              <YAxis hide />
              <Bar
                dataKey="value"
                fill="hsl(var(--primary))"
                radius={[2, 2, 0, 0]}
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
