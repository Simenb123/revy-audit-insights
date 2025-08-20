import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  Target, 
  Calculator, 
  FileCheck, 
  Download,
  Eye,
  BarChart3,
  PieChart
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/services/sampling/utils';
import { SamplingResult, SampleItem } from '@/services/sampling/types';

interface SampleResultsDisplayProps {
  result?: SamplingResult;
  isLoading?: boolean;
  onExport?: (format: 'CSV' | 'JSON' | 'PDF') => void;
  onSave?: (planName: string, notes?: string) => void;
}

const SampleResultsDisplay: React.FC<SampleResultsDisplayProps> = ({
  result,
  isLoading,
  onExport,
  onSave
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 animate-spin" />
            Genererer utvalg...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={undefined} className="w-full" />
            <div className="text-sm text-muted-foreground text-center">
              Beregner optimal utvalgsstørrelse og trekker utvalg...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Utvalgsresultat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <div className="text-lg font-medium mb-2">Ingen utvalg generert ennå</div>
            <div>Konfigurer parametere og generer utvalg for å se resultater</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleExport = (format: 'CSV' | 'JSON' | 'PDF') => {
    onExport?.(format);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground">Total utvalgsstørrelse</div>
          <div className="text-2xl font-bold">{formatNumber(result.plan.actualSampleSize)}</div>
          <div className="text-xs text-muted-foreground">
            av {formatNumber(result.samples.total.length)} i populasjon
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground">Dekning</div>
          <div className="text-2xl font-bold">{formatNumber(result.plan.coveragePercentage, 1)}%</div>
          <div className="text-xs text-muted-foreground">av populasjon</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground">Målrettede</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatNumber(result.samples.targeted.length)}
          </div>
          <div className="text-xs text-muted-foreground">høyverdi transaksjoner</div>
        </div>
        <div className="p-4 border rounded-lg">
          <div className="text-sm text-muted-foreground">Tilfeldig utvalg</div>
          <div className="text-2xl font-bold text-green-600">
            {formatNumber(result.samples.residual.length)}
          </div>
          <div className="text-xs text-muted-foreground">fra restpopulasjon</div>
        </div>
      </div>

      {/* Plan Details */}
      <div className="p-4 bg-muted/50 rounded-lg">
        <h3 className="font-medium mb-3">Plandetaljer</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Metode</div>
            <div className="font-medium">{result.plan.method}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Testtype</div>
            <div className="font-medium">{result.plan.testType}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Generert</div>
            <div className="font-medium">
              {new Date(result.plan.generatedAt).toLocaleString('nb-NO')}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Seed</div>
            <div className="font-mono">{result.plan.seed}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Risikofaktor</div>
            <div className="font-medium">{formatNumber(result.metadata.calculations.riskFactor, 2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Base størrelse</div>
            <div className="font-medium">{result.metadata.calculations.nBase}</div>
          </div>
        </div>
      </div>

      {/* Threshold Info */}
      {result.metadata.thresholdUsed && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-blue-600" />
            <div className="font-medium text-blue-800">Høyverdi-terskel brukt</div>
          </div>
          <div className="text-lg font-bold text-blue-900">
            {formatCurrency(result.metadata.thresholdUsed)}
          </div>
          <div className="text-sm text-blue-700">
            {result.samples.targeted.length} transaksjoner over terskelen inkludert automatisk
          </div>
        </div>
      )}

      {/* Stratification Info */}
      {result.strata && result.strata.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-medium">Stratifisering</h3>
          <div className="grid gap-2">
            {result.strata.map((stratum, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">Stratum {stratum.index + 1}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(stratum.lowerBound)} - {
                      stratum.upperBound ? formatCurrency(stratum.upperBound) : '∞'
                    }
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{stratum.allocatedSampleSize} utvalg</div>
                  <div className="text-sm text-muted-foreground">
                    av {stratum.transactions.length} transaksjoner
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSampleTable = (samples: SampleItem[], title: string) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{title} ({samples.length} transaksjoner)</h3>
        <Badge variant="outline">
          Total: {formatCurrency(samples.reduce((sum, s) => sum + Math.abs(s.amount), 0))}
        </Badge>
      </div>
      
      <ScrollArea className="h-64 border rounded">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dato</TableHead>
              <TableHead>Konto</TableHead>
              <TableHead>Beskrivelse</TableHead>
              <TableHead className="text-right">Beløp</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {samples.map((sample, index) => (
              <TableRow key={sample.id || index}>
                <TableCell className="font-mono text-sm">
                  {new Date(sample.transaction_date).toLocaleDateString('nb-NO')}
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm">{sample.account_no}</div>
                  <div className="text-xs text-muted-foreground truncate max-w-32">
                    {sample.account_name}
                  </div>
                </TableCell>
                <TableCell className="max-w-48 truncate" title={sample.description}>
                  {sample.description}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatCurrency(sample.amount)}
                </TableCell>
                <TableCell>
                  <Badge variant={sample.sample_type === 'TARGETED' ? 'default' : 'secondary'}>
                    {sample.sample_type === 'TARGETED' ? 'Målrettet' : 'Tilfeldig'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Utvalgsresultat
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('CSV')}>
              <Download className="h-4 w-4 mr-1" />
              Eksporter
            </Button>
            <Button size="sm" onClick={() => onSave?.('Nytt utvalg')}>
              Lagre utvalg
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <BarChart3 className="h-4 w-4" />
              Oversikt
            </TabsTrigger>
            <TabsTrigger value="targeted" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              Målrettede ({result.samples.targeted.length})
            </TabsTrigger>
            <TabsTrigger value="residual" className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              Tilfeldig ({result.samples.residual.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-1">
              <PieChart className="h-4 w-4" />
              Alle ({result.samples.total.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="targeted" className="mt-6">
            {renderSampleTable(result.samples.targeted, 'Målrettede transaksjoner')}
          </TabsContent>

          <TabsContent value="residual" className="mt-6">
            {renderSampleTable(result.samples.residual, 'Tilfeldig utvalg')}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {renderSampleTable(result.samples.total, 'Alle utvalgte transaksjoner')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SampleResultsDisplay;