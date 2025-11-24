import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAvailableVersions } from '@/hooks/useAvailableVersions';
import { useGeneralLedgerComparison, VoucherComparison } from '@/hooks/useGeneralLedgerComparison';
import { AlertTriangle, CheckCircle, FileText, TrendingUp, Calendar, Hash } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface GeneralLedgerComparisonProps {
  clientId: string;
}

const GeneralLedgerComparison: React.FC<GeneralLedgerComparisonProps> = ({ clientId }) => {
  const [oldVersionId, setOldVersionId] = useState<string>('');
  const [newVersionId, setNewVersionId] = useState<string>('');
  
  const { data: versions, isLoading: versionsLoading } = useAvailableVersions(clientId);
  const { data: comparison, isLoading: comparisonLoading, error } = useGeneralLedgerComparison(
    clientId, 
    oldVersionId || undefined, 
    newVersionId || undefined
  );

  const canCompare = oldVersionId && newVersionId && oldVersionId !== newVersionId;

  if (versionsLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-[var(--content-gap)]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Hovedbok Versjonssammenligning
          </CardTitle>
          <CardDescription>
            Sammenlign to hovedbokversjoner for å identifisere nye og endrede bilag
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Gammel versjon (basis)</label>
              <Select value={oldVersionId} onValueChange={setOldVersionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg gammel versjon..." />
                </SelectTrigger>
                <SelectContent>
                  {versions?.map((version) => (
                    <SelectItem key={version.value} value={version.value}>
                      {version.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Ny versjon (sammenlign mot)</label>
              <Select value={newVersionId} onValueChange={setNewVersionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg ny versjon..." />
                </SelectTrigger>
                <SelectContent>
                  {versions?.map((version) => (
                    <SelectItem key={version.value} value={version.value}>
                      {version.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!canCompare && oldVersionId && newVersionId && oldVersionId === newVersionId && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Du må velge to forskjellige versjoner for å kunne sammenligne.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Feil ved sammenligning: {error.message}
          </AlertDescription>
        </Alert>
      )}

      {comparisonLoading && canCompare && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-2 w-full" />
              <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {comparison && (
        <div className="space-y-[var(--content-gap)]">
          {/* Statistics Overview */}
          <div className="grid gap-[var(--space-4)] md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nye bilag</p>
                    <p className="text-2xl font-bold text-green-600">{comparison.statistics.newCount}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Endrede bilag</p>
                    <p className="text-2xl font-bold text-orange-600">{comparison.statistics.modifiedCount}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Uendrede bilag</p>
                    <p className="text-2xl font-bold text-blue-600">{comparison.statistics.unchangedCount}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Risiko fordeling</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Høy: {comparison.statistics.riskDistribution.high}</span>
                      <span>Middels: {comparison.statistics.riskDistribution.medium}</span>
                      <span>Lav: {comparison.statistics.riskDistribution.low}</span>
                    </div>
                    <Progress 
                      value={
                        ((comparison.statistics.riskDistribution.high + comparison.statistics.riskDistribution.medium) / 
                        (comparison.statistics.newCount + comparison.statistics.modifiedCount)) * 100
                      } 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Results */}
          <Card>
            <CardHeader>
              <CardTitle>Detaljerte resultater</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="new" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="new">
                    Nye bilag ({comparison.statistics.newCount})
                  </TabsTrigger>
                  <TabsTrigger value="modified">
                    Endrede bilag ({comparison.statistics.modifiedCount})
                  </TabsTrigger>
                  <TabsTrigger value="unchanged">
                    Uendrede bilag ({comparison.statistics.unchangedCount})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="new" className="mt-4">
                  <VoucherTable vouchers={comparison.newVouchers} type="new" />
                </TabsContent>
                
                <TabsContent value="modified" className="mt-4">
                  <VoucherTable vouchers={comparison.modifiedVouchers} type="modified" />
                </TabsContent>
                
                <TabsContent value="unchanged" className="mt-4">
                  <VoucherTable vouchers={comparison.unchangedVouchers} type="unchanged" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

interface VoucherTableProps {
  vouchers: VoucherComparison[];
  type: 'new' | 'modified' | 'unchanged';
}

const VoucherTable: React.FC<VoucherTableProps> = ({ vouchers, type }) => {
  if (vouchers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Ingen bilag av denne typen
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bilagsnummer</TableHead>
          <TableHead>Antall linjer</TableHead>
          <TableHead>Totalbeløp</TableHead>
          <TableHead>Periode</TableHead>
          <TableHead>Risiko</TableHead>
          {type !== 'unchanged' && <TableHead>Endringer</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {vouchers.map((voucher) => {
          const voucherInfo = voucher.newVersion || voucher.oldVersion;
          if (!voucherInfo) return null;

          return (
            <TableRow key={voucher.voucherNumber}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  {voucher.voucherNumber}
                </div>
              </TableCell>
              <TableCell>{voucherInfo.transactionCount}</TableCell>
              <TableCell>
                {formatCurrency(voucherInfo.totalAmount)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {formatDate(voucherInfo.periodStart)}
                    {voucherInfo.periodStart !== voucherInfo.periodEnd && 
                      ` - ${formatDate(voucherInfo.periodEnd)}`
                    }
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={
                    voucher.riskLevel === 'high' ? 'destructive' : 
                    voucher.riskLevel === 'medium' ? 'default' : 
                    'secondary'
                  }
                >
                  {voucher.riskLevel === 'high' ? 'Høy' : 
                   voucher.riskLevel === 'medium' ? 'Middels' : 'Lav'}
                </Badge>
              </TableCell>
              {type !== 'unchanged' && (
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {voucher.changeDescription}
                  </span>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK'
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('nb-NO');
}

export default GeneralLedgerComparison;