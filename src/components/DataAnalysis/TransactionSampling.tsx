
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Check } from 'lucide-react';
import { Account, Transaction, SamplingResult } from '@/types/revio';
import { formatCurrency } from '@/lib/formatters';

// Mock transactions data
const mockTransactions: Transaction[] = [
  {
    id: '1',
    date: '2024-01-15',
    description: 'Salg av konsulenttjenester',
    amount: 24500,
    account: '3100',
    voucher: '1001'
  },
  // ... more mock transactions would go here
];

interface TransactionSamplingProps {
  selectedAccount: Account | null;
}

const TransactionSampling = ({ selectedAccount }: TransactionSamplingProps) => {
  const [samplingMethod, setSamplingMethod] = useState<'random' | 'stratified' | 'monetary'>('random');
  const [sampleSize, setSampleSize] = useState<number>(5);
  const [coverageTarget, setCoverageTarget] = useState<number>(30);
  const [threshold, setThreshold] = useState<number>(10000);
  const [samplingResult, setSamplingResult] = useState<SamplingResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Apply sampling
  const applySampling = () => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // In a real app, this would call an API that performs the sampling
      const sampledTransactions = mockTransactions.slice(0, sampleSize);
      
      // Calculate summary statistics
      const totalAmount = mockTransactions.reduce((sum, t) => sum + t.amount, 0);
      const sampledAmount = sampledTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      setSamplingResult({
        transactions: sampledTransactions,
        summary: {
          totalCount: mockTransactions.length,
          sampledCount: sampledTransactions.length,
          totalAmount,
          sampledAmount,
          coverage: (sampledAmount / totalAmount) * 100
        }
      });
      
      setIsLoading(false);
    }, 800);
  };
  
  // Reset sampling
  const resetSampling = () => {
    setSamplingResult(null);
  };
  
  // Mark transaction as tested
  const markAsTested = (transactionId: string) => {
    if (!samplingResult) return;
    
    const updatedTransactions = samplingResult.transactions.map(t => 
      t.id === transactionId ? { ...t, isTested: !t.isTested } : t
    );
    
    setSamplingResult({
      ...samplingResult,
      transactions: updatedTransactions
    });
  };
  
  return (
    <div className="mt-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Transaksjonsutvalg
            {selectedAccount && (
              <span className="ml-2 text-base font-normal text-muted-foreground">
                - {selectedAccount.name}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Velg metode og parametre for å generere et utvalg av transaksjoner for revisjon
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedAccount ? (
            <>
              {!samplingResult ? (
                <div className="space-y-6">
                  <Tabs value={samplingMethod} onValueChange={(value) => setSamplingMethod(value as 'random' | 'stratified' | 'monetary')}>
                    <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
                      <TabsTrigger value="random">Tilfeldig</TabsTrigger>
                      <TabsTrigger value="stratified">Stratifisert</TabsTrigger>
                      <TabsTrigger value="monetary">Monetær</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="random">
                      <div className="space-y-4">
                        <div>
                          <Label>Antall transaksjoner</Label>
                          <div className="flex items-center gap-4 mt-2">
                            <Slider
                              value={[sampleSize]}
                              min={1}
                              max={20}
                              step={1}
                              onValueChange={(value) => setSampleSize(value[0])}
                              className="flex-1"
                            />
                            <div className="w-16">
                              <Input
                                type="number"
                                value={sampleSize}
                                onChange={(e) => setSampleSize(parseInt(e.target.value) || 1)}
                                min={1}
                                max={20}
                              />
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Velger {sampleSize} transaksjoner tilfeldig fra kontoen.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="stratified">
                      <div className="space-y-4">
                        <div>
                          <Label>Dekning (% av totalbeløp)</Label>
                          <div className="flex items-center gap-4 mt-2">
                            <Slider
                              value={[coverageTarget]}
                              min={5}
                              max={100}
                              step={5}
                              onValueChange={(value) => setCoverageTarget(value[0])}
                              className="flex-1"
                            />
                            <div className="w-16">
                              <Input
                                type="number"
                                value={coverageTarget}
                                onChange={(e) => setCoverageTarget(parseInt(e.target.value) || 5)}
                                min={5}
                                max={100}
                              />
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Velger transaksjoner for å dekke minst {coverageTarget}% av totalbeløpet, fordelt på alle størrelsesintervaller.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="monetary">
                      <div className="space-y-4">
                        <div>
                          <Label>Beløpsgrense (NOK)</Label>
                          <div className="flex items-center gap-4 mt-2">
                            <Slider
                              value={[threshold]}
                              min={1000}
                              max={50000}
                              step={1000}
                              onValueChange={(value) => setThreshold(value[0])}
                              className="flex-1"
                            />
                            <div className="w-24">
                              <Input
                                type="number"
                                value={threshold}
                                onChange={(e) => setThreshold(parseInt(e.target.value) || 1000)}
                                min={1000}
                                step={1000}
                              />
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Velger alle transaksjoner over {formatCurrency(threshold)} pluss et utvalg under grensen.
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex gap-4 pt-4">
                    <Button onClick={applySampling} disabled={isLoading}>
                      {isLoading ? 'Genererer utvalg...' : 'Generer utvalg'}
                    </Button>
                    <Button variant="outline" onClick={resetSampling}>
                      Tilbakestill
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-muted/40 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground">Totalt</div>
                      <div className="text-2xl font-semibold">{samplingResult.summary.totalCount}</div>
                      <div className="text-sm">transaksjoner</div>
                    </div>
                    <div className="p-4 bg-muted/40 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground">Utvalg</div>
                      <div className="text-2xl font-semibold">{samplingResult.summary.sampledCount}</div>
                      <div className="text-sm">transaksjoner</div>
                    </div>
                    <div className="p-4 bg-muted/40 rounded-lg text-center">
                      <div className="text-sm text-muted-foreground">Totalbeløp</div>
                      <div className="text-2xl font-semibold">{formatCurrency(samplingResult.summary.totalAmount)}</div>
                    </div>
                    <div className="p-4 bg-primary/10 rounded-lg text-center">
                      <div className="text-sm text-primary">Dekningsgrad</div>
                      <div className="text-2xl font-semibold">{samplingResult.summary.coverage.toFixed(1)}%</div>
                      <div className="text-sm">{formatCurrency(samplingResult.summary.sampledAmount)}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-medium">Transaksjoner for testing</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="ml-2">
                          {samplingMethod === 'random' ? 'Tilfeldig' : 
                           samplingMethod === 'stratified' ? 'Stratifisert' : 'Monetær'} utvalg
                        </Badge>
                        <Badge variant="secondary">
                          {samplingResult.transactions.filter(t => t.isTested).length}/{samplingResult.transactions.length} testet
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Dato</TableHead>
                            <TableHead>Beskrivelse</TableHead>
                            <TableHead>Bilag</TableHead>
                            <TableHead className="text-right">Beløp</TableHead>
                            <TableHead className="text-center w-[100px]">Testet</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {samplingResult.transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{transaction.date}</TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell>{transaction.voucher}</TableCell>
                              <TableCell className="text-right">{formatCurrency(transaction.amount)}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex justify-center">
                                  <Switch
                                    checked={!!transaction.isTested}
                                    onCheckedChange={() => markAsTested(transaction.id)}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 pt-4">
                    <Button onClick={applySampling}>
                      Oppdater utvalg
                    </Button>
                    <Button variant="outline" onClick={resetSampling}>
                      Tilbakestill
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">
                Velg en konto fra listen til venstre for å generere et transaksjonsutvalg
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionSampling;
