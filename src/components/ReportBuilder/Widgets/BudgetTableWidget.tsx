import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useBudgetAnalytics } from '@/hooks/useBudgetAnalytics';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BudgetTableWidgetProps {
  widget: Widget;
}

export function BudgetTableWidget({ widget }: BudgetTableWidgetProps) {
  const { updateWidget } = useWidgetManager();
  const { selectedFiscalYear } = useFiscalYear();
  const clientId = widget.config?.clientId as string | undefined;
  const year = (widget.config?.period_year as number | undefined) ?? selectedFiscalYear;
  const dimension = (widget.config?.dimension as 'member' | 'team') ?? 'member';
  const maxRows = (widget.config?.maxRows as number | undefined) ?? 10;

  const { data, isLoading } = useBudgetAnalytics(clientId, year);

  const handleTitleChange = (newTitle: string) => updateWidget(widget.id, { title: newTitle });

  const rows = React.useMemo(() => {
    if (!data) return [];
    if (dimension === 'team') return data.byTeam.slice(0, maxRows).map(r => ({ key: r.teamId, name: r.name, hours: r.hours }));
    return data.byUser.slice(0, maxRows).map(r => ({ key: r.userId, name: r.name, hours: r.hours }));
  }, [data, dimension, maxRows]);

  const total = data?.totalHours ?? 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <InlineEditableTitle title={widget.title} onTitleChange={handleTitleChange} size="sm" />
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 text-sm text-muted-foreground">Laster budsjett...</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">Ingen budsjettdata</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{dimension === 'team' ? 'Team' : 'Medlem'}</TableHead>
                <TableHead className="text-xs text-right">Timer</TableHead>
                <TableHead className="text-xs text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.key} className="text-xs">
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('nb-NO').format(r.hours)}</TableCell>
                  <TableCell className="text-right">{total > 0 ? ((r.hours / total) * 100).toFixed(1) : '0.0'}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
