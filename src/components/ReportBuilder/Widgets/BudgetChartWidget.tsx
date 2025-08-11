import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useBudgetAnalytics } from '@/hooks/useBudgetAnalytics';
import {
  BarChart as RBarChart,
  Bar,
  PieChart as RPieChart,
  Pie,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
} from 'recharts';

interface BudgetChartWidgetProps {
  widget: Widget;
}

export function BudgetChartWidget({ widget }: BudgetChartWidgetProps) {
  const { updateWidget } = useWidgetManager();
  const { selectedFiscalYear } = useFiscalYear();
  const clientId = widget.config?.clientId as string | undefined;
  const year = (widget.config?.period_year as number | undefined) ?? selectedFiscalYear;
  const chartType = (widget.config?.chartType as 'bar' | 'pie' | undefined) ?? 'bar';
  const dimension = (widget.config?.dimension as 'team' | 'member' | undefined) ?? 'team';
  const maxDataPoints = (widget.config?.maxDataPoints as number | undefined) ?? 6;

  const { data, isLoading } = useBudgetAnalytics(clientId, year);

  const handleTitleChange = (newTitle: string) => updateWidget(widget.id, { title: newTitle });

  const items = React.useMemo(() => {
    if (!data) return [];
    const base = dimension === 'team' ? data.byTeam : data.byUser;
    return base
      .slice(0, maxDataPoints)
      .map((r) => ({ name: r.name.length > 14 ? r.name.slice(0, 12) + '…' : r.name, value: r.hours }));
  }, [data, dimension, maxDataPoints]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <InlineEditableTitle title={widget.title} onTitleChange={handleTitleChange} size="sm" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Laster budsjett...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">Ingen budsjettdata</div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            {chartType === 'pie' ? (
              <RPieChart>
                <Tooltip formatter={(v: any) => new Intl.NumberFormat('nb-NO').format(Number(v)) + ' t'} />
                <Pie data={items} dataKey="value" nameKey="name" outerRadius={60} fill="hsl(var(--primary))">
                  <LabelList dataKey="value" position="outside" fontSize={10} />
                </Pie>
              </RPieChart>
            ) : (
              <RBarChart data={items}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis hide />
                <Tooltip formatter={(v: any) => new Intl.NumberFormat('nb-NO').format(Number(v)) + ' t'} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]}>
                  <LabelList dataKey="value" position="top" fontSize={10} />
                </Bar>
              </RBarChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
