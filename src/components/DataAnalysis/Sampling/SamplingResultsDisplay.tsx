import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { TrendingUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Transaction {
  id: string;
  transaction_date: string;
  account_no: string;
  account_name: string;
  description: string;
  amount: number;
  risk_score?: number;
}

interface SamplingResultsPlan {
  recommendedSampleSize: number;
  actualSampleSize: number;
  coveragePercentage: number;
  method: string;
  testType: string;
  generatedAt: string;
}

interface SamplingResultsDisplayProps {
  plan: SamplingResultsPlan;
  sample: Transaction[];
}

export const SamplingResultsDisplay: React.FC<SamplingResultsDisplayProps> = ({
  plan,
  sample
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Generert utvalg
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold">{plan.actualSampleSize}</div>
            <div className="text-sm text-muted-foreground">Utvalgte transaksjoner</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">{plan.coveragePercentage.toFixed(1)}%</div>
            <div className="text-sm text-muted-foreground">Dekningsgrad</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">{plan.method}</div>
            <div className="text-sm text-muted-foreground">Metode</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold">{formatDate(plan.generatedAt)}</div>
            <div className="text-sm text-muted-foreground">Generert</div>
          </Card>
        </div>

        {sample.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <h4 className="font-medium">Utvalgte transaksjoner (viser første 10):</h4>
            <ScrollArea className="h-64 w-full border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dato</TableHead>
                    <TableHead>Konto</TableHead>
                    <TableHead>Beskrivelse</TableHead>
                    <TableHead className="text-right">Beløp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sample.slice(0, 10).map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDate(tx.transaction_date)}</TableCell>
                      <TableCell className="font-mono">
                        {tx.account_no}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {tx.description}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(tx.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
            {sample.length > 10 && (
              <p className="text-sm text-muted-foreground">
                ... og {sample.length - 10} flere transaksjoner
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
