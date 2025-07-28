import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download } from 'lucide-react';
import { TrialBalanceEntry, useTrialBalanceData } from '@/hooks/useTrialBalanceData';
import { Skeleton } from '@/components/ui/skeleton';

interface TrialBalanceTableProps {
  clientId: string;
}

const TrialBalanceTable = ({ clientId }: TrialBalanceTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: entries, isLoading, error } = useTrialBalanceData(clientId);

  const filteredEntries = entries?.filter(entry =>
    entry.account_number.includes(searchTerm) ||
    entry.account_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const totalDebit = filteredEntries.reduce((sum, entry) => sum + entry.debit_turnover, 0);
  const totalCredit = filteredEntries.reduce((sum, entry) => sum + entry.credit_turnover, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saldobalanse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saldobalanse</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Feil ved lasting av saldobalanse: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Saldobalanse</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Eksporter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk i kontoer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kontonummer</TableHead>
                  <TableHead>Kontonavn</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead className="text-right">Åpningsbalanse</TableHead>
                  <TableHead className="text-right">Debet omsetning</TableHead>
                  <TableHead className="text-right">Kredit omsetning</TableHead>
                  <TableHead className="text-right">Avslutningsbalanse</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Ingen kontoer funnet
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.account_number}</TableCell>
                        <TableCell>{entry.account_name}</TableCell>
                        <TableCell>{entry.period_year}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(entry.opening_balance)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(entry.debit_turnover)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(entry.credit_turnover)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(entry.closing_balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2">
                      <TableCell colSpan={4}>Sum</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalDebit)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalCredit)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            Viser {filteredEntries.length} av {entries?.length || 0} kontoer
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialBalanceTable;