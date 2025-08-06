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
  const maxRows = widget.config?.maxRows || 10;
  const sortBy = widget.config?.sortBy || 'balance';
  const showPercentage = widget.config?.showPercentage !== false;
  
  const { data: trialBalanceData, isLoading } = useTrialBalanceWithMappings(
    clientId, 
    selectedFiscalYear
  );

  const tableData = React.useMemo(() => {
    if (!trialBalanceData?.trialBalanceEntries) {
      return [];
    }

    let sortedEntries = [...trialBalanceData.trialBalanceEntries]
      .filter(entry => Math.abs(entry.closing_balance) > 0);

    // Sort based on configuration
    switch (sortBy) {
      case 'name':
        sortedEntries.sort((a, b) => a.account_name.localeCompare(b.account_name));
        break;
      case 'number':
        sortedEntries.sort((a, b) => a.account_number.localeCompare(b.account_number));
        break;
      case 'balance':
      default:
        sortedEntries.sort((a, b) => Math.abs(b.closing_balance) - Math.abs(a.closing_balance));
        break;
    }

    const totalBalance = sortedEntries.reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0);

    return sortedEntries
      .slice(0, maxRows)
      .map(entry => ({
        account: `${entry.account_number} - ${entry.account_name}`,
        balance: new Intl.NumberFormat('no-NO').format(entry.closing_balance),
        percentage: showPercentage && totalBalance > 0 
          ? ((Math.abs(entry.closing_balance) / totalBalance) * 100).toFixed(1) + '%'
          : '0%'
      }));
  }, [trialBalanceData, maxRows, sortBy, showPercentage]);

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
              {showPercentage && <TableHead className="text-xs text-right">%</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.length > 0 ? tableData.map((row, index) => (
              <TableRow key={index} className="text-xs">
                <TableCell className="font-medium">{row.account}</TableCell>
                <TableCell className="text-right">{row.balance}</TableCell>
                {showPercentage && <TableCell className="text-right">{row.percentage}</TableCell>}
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={showPercentage ? 3 : 2} className="text-center text-muted-foreground">
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