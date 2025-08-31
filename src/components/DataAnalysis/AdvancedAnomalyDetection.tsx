import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Clock, Copy, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AdvancedAnomalyDetectionProps {
  clientId: string;
  fiscalYear: number;
  selectedAccountNumbers: string[];
  versionString?: string;
}

interface BenfordAnalysis {
  digit: number;
  actual_frequency: number;
  expected_frequency: number;
  deviation: number;
}

interface DuplicateTransaction {
  amount: number;
  transaction_date: string;
  count: number;
  account_numbers: string[];
  descriptions: string[];
}

interface TimeAnamoly {
  type: 'weekend' | 'after_hours' | 'holiday';
  transaction_date: string;
  account_number: string;
  amount: number;
  description: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0
  }).format(amount);
};

const AdvancedAnomalyDetection: React.FC<AdvancedAnomalyDetectionProps> = ({
  clientId,
  fiscalYear,
  selectedAccountNumbers,
  versionString
}) => {
  const { data: anomalies, isLoading } = useQuery({
    queryKey: ['advanced-anomalies', clientId, fiscalYear, selectedAccountNumbers, versionString],
    queryFn: async () => {
      if (selectedAccountNumbers.length === 0) return null;

      // Get transactions for analysis
      let query = supabase
        .from('general_ledger_transactions')
        .select(`
          id,
          transaction_date,
          account_number,
          description,
          debit_amount,
          credit_amount
        `)
        .eq('client_id', clientId)
        .gte('transaction_date', `${fiscalYear}-01-01`)
        .lte('transaction_date', `${fiscalYear}-12-31`)
        .in('account_number', selectedAccountNumbers);

      if (versionString) {
        query = query.eq('version_id', versionString);
      }

      const { data: transactions } = await query;
      if (!transactions || transactions.length === 0) return null;

      // Benford's Law Analysis
      const amounts = transactions
        .map(t => Math.abs((t.debit_amount || 0) - (t.credit_amount || 0)))
        .filter(amount => amount > 0);

      const firstDigitCounts = new Array(10).fill(0);
      amounts.forEach(amount => {
        const firstDigit = parseInt(amount.toString().charAt(0));
        if (firstDigit >= 1 && firstDigit <= 9) {
          firstDigitCounts[firstDigit]++;
        }
      });

      const benfordExpected = [0, 30.1, 17.6, 12.5, 9.7, 7.9, 6.7, 5.8, 5.1, 4.6]; // Benford's Law percentages
      const benfordAnalysis: BenfordAnalysis[] = [];
      
      for (let digit = 1; digit <= 9; digit++) {
        const actualFreq = (firstDigitCounts[digit] / amounts.length) * 100;
        const expectedFreq = benfordExpected[digit];
        const deviation = Math.abs(actualFreq - expectedFreq);
        
        benfordAnalysis.push({
          digit,
          actual_frequency: actualFreq,
          expected_frequency: expectedFreq,
          deviation
        });
      }

      // Duplicate Detection
      const duplicateMap = new Map<string, DuplicateTransaction>();
      transactions.forEach(t => {
        const amount = Math.abs((t.debit_amount || 0) - (t.credit_amount || 0));
        const key = `${amount}_${t.transaction_date}`;
        
        const existing = duplicateMap.get(key);
        if (existing) {
          existing.count++;
          existing.account_numbers.push(t.account_number);
          existing.descriptions.push(t.description || '');
        } else {
          duplicateMap.set(key, {
            amount,
            transaction_date: t.transaction_date,
            count: 1,
            account_numbers: [t.account_number],
            descriptions: [t.description || '']
          });
        }
      });

      const duplicates = Array.from(duplicateMap.values())
        .filter(dup => dup.count > 1 && dup.amount >= 1000)
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);

      // Time-based Anomalies
      const timeAnomalies: TimeAnamoly[] = [];
      transactions.forEach(t => {
        const date = new Date(t.transaction_date);
        const dayOfWeek = date.getDay();
        const amount = Math.abs((t.debit_amount || 0) - (t.credit_amount || 0));
        
        // Weekend transactions
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          timeAnomalies.push({
            type: 'weekend',
            transaction_date: t.transaction_date,
            account_number: t.account_number,
            amount,
            description: t.description || 'Ingen beskrivelse'
          });
        }
      });

      return {
        benfordAnalysis: benfordAnalysis.sort((a, b) => b.deviation - a.deviation),
        duplicates,
        timeAnomalies: timeAnomalies.slice(0, 50)
      };
    },
    enabled: !!clientId && selectedAccountNumbers.length > 0
  });

  if (selectedAccountNumbers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Avansert anomalideteksjon
          </CardTitle>
          <CardDescription>
            Velg kontoer for å kjøre avanserte anomalianalyser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Ingen kontoer valgt</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Avansert anomalideteksjon
          </CardTitle>
          <CardDescription>Analyserer data for anomalier...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-32 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!anomalies) {
    return null;
  }

  const { benfordAnalysis, duplicates, timeAnomalies } = anomalies;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Avansert anomalideteksjon
        </CardTitle>
        <CardDescription>
          Benford's Law, duplikatdeteksjon og tidsbaserte anomalier
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="benford" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="benford">Benford's Law</TabsTrigger>
            <TabsTrigger value="duplicates">Duplikater</TabsTrigger>
            <TabsTrigger value="time">Tidsanomalier</TabsTrigger>
          </TabsList>

          <TabsContent value="benford" className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Første siffer-fordeling (Benford's Law)</h4>
              <p className="text-sm text-muted-foreground">
                Sammenligning av faktisk fordeling vs. forventet fordeling etter Benford's Law
              </p>
              
              <div className="space-y-3">
                {benfordAnalysis.map(item => (
                  <div key={item.digit} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Siffer {item.digit}</span>
                      <div className="flex gap-4">
                        <span>Faktisk: {item.actual_frequency.toFixed(1)}%</span>
                        <span>Forventet: {item.expected_frequency.toFixed(1)}%</span>
                        <Badge variant={item.deviation > 5 ? 'destructive' : 'outline'}>
                          Avvik: {item.deviation.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={item.actual_frequency} className="h-2" />
                      <div 
                        className="absolute top-0 h-2 bg-muted-foreground/30 rounded-full"
                        style={{ width: `${Math.min(item.expected_frequency, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {benfordAnalysis.some(item => item.deviation > 10) && (
                <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="flex items-center gap-2 text-destructive font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    Betydelig avvik fra Benford's Law oppdaget
                  </div>
                  <p className="text-sm text-destructive/80 mt-1">
                    Store avvik kan indikere manipulerte eller kunstige data.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="duplicates" className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Potensielle duplikater ({duplicates.length})</h4>
              <p className="text-sm text-muted-foreground">
                Identiske beløp og datoer som kan indikere duplikate posteringer
              </p>
              
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {duplicates.map((duplicate, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{formatCurrency(duplicate.amount)}</div>
                        <Badge variant="destructive">{duplicate.count} forekomster</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>Dato: {duplicate.transaction_date}</div>
                        <div>Kontoer: {[...new Set(duplicate.account_numbers)].join(', ')}</div>
                        <div className="mt-1">
                          Beskrivelser: {[...new Set(duplicate.descriptions.filter(Boolean))].join('; ') || 'Ingen beskrivelse'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="time" className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Tidsbaserte anomalier ({timeAnomalies.length})</h4>
              <p className="text-sm text-muted-foreground">
                Transaksjoner utenfor normale arbeidstider eller på helger
              </p>
              
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {timeAnomalies.map((anomaly, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium">{formatCurrency(anomaly.amount)}</div>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {anomaly.type === 'weekend' && 'Helg'}
                          {anomaly.type === 'after_hours' && 'Utenfor arbeidstid'}
                          {anomaly.type === 'holiday' && 'Helligdag'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div>Dato: {anomaly.transaction_date}</div>
                        <div>Konto: {anomaly.account_number}</div>
                        <div>Beskrivelse: {anomaly.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdvancedAnomalyDetection;