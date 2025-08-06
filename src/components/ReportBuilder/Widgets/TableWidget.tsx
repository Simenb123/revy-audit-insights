import React from 'react';
import { Widget } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

interface TableWidgetProps {
  widget: Widget;
}

export function TableWidget({ widget }: TableWidgetProps) {
  const { selectedFiscalYear } = useFiscalYear();
  const clientId = widget.config?.clientId;
  
  const { data: trialBalanceData, isLoading } = useTrialBalanceWithMappings(
    clientId, 
    selectedFiscalYear
  );

  const tableData = React.useMemo(() => {
    if (!trialBalanceData?.trialBalanceEntries) {
      return [];
    }

    // Get top 10 accounts by balance
    return trialBalanceData.trialBalanceEntries
      .filter(entry => Math.abs(entry.closing_balance) > 0)
      .sort((a, b) => Math.abs(b.closing_balance) - Math.abs(a.closing_balance))
      .slice(0, 10)
      .map(entry => ({
        account: `${entry.account_number} - ${entry.account_name}`,
        balance: new Intl.NumberFormat('no-NO').format(entry.closing_balance),
        percentage: '0%' // Calculate percentage later if needed
      }));
  }, [trialBalanceData]);

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Laster data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Konto</TableHead>
              <TableHead className="text-xs text-right">Saldo</TableHead>
              <TableHead className="text-xs text-right">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.length > 0 ? tableData.map((row, index) => (
              <TableRow key={index} className="text-xs">
                <TableCell className="font-medium">{row.account}</TableCell>
                <TableCell className="text-right">{row.balance}</TableCell>
                <TableCell className="text-right">{row.percentage}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Ingen data tilgjengelig
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}