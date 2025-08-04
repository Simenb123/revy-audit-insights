import React from 'react';
import { Widget } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TableWidgetProps {
  widget: Widget;
}

export function TableWidget({ widget }: TableWidgetProps) {
  // Mock data - will be connected to real data sources later
  const mockData = [
    { account: '1000 - Kontanter', balance: '125,000', percentage: '5.2%' },
    { account: '1500 - Kundefordringer', balance: '450,000', percentage: '18.7%' },
    { account: '2000 - Leverandørgjeld', balance: '-280,000', percentage: '-11.6%' },
    { account: '3000 - Egenkapital', balance: '1,200,000', percentage: '49.8%' },
  ];

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
            {mockData.map((row, index) => (
              <TableRow key={index} className="text-xs">
                <TableCell className="font-medium">{row.account}</TableCell>
                <TableCell className="text-right">{row.balance}</TableCell>
                <TableCell className="text-right">{row.percentage}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}