import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator, TrendingUp, Hash, Target } from 'lucide-react';
import { useTrialBalanceData } from '@/hooks/useTrialBalanceData';
import { useGeneralLedgerData } from '@/hooks/useGeneralLedgerData';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { Widget } from '@/contexts/WidgetManagerContext';
import { getBalanceCategory, getBalanceCategoryLabel } from '@/utils/standardAccountCategory';

interface MetricsExplorerWidgetProps {
  widget: Widget;
}

type AggregationLevel = 'total' | 'category' | 'account' | 'transaction';
type MetricType = 'count' | 'unique_vouchers' | 'avg_amount' | 'min_amount' | 'max_amount' | 'median_amount' | 'std_dev';

interface MetricData {
  level: string;
  label: string;
  count: number;
  uniqueVouchers: number;
  avgAmount: number;
  minAmount: number;
  maxAmount: number;
  medianAmount: number;
  stdDev: number;
  totalAmount: number;
}

export function MetricsExplorerWidget({ widget }: MetricsExplorerWidgetProps) {
  const { selectedFiscalYear } = useFiscalYear();
  const [selectedLevel, setSelectedLevel] = useState<AggregationLevel>('category');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('count');
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');

  const clientId = widget.config?.clientId || '';
  
  const { data: trialBalanceData = [] } = useTrialBalanceData(clientId, undefined, selectedFiscalYear);
  const { data: transactionData = [] } = useGeneralLedgerData(clientId, undefined, { page: 1, pageSize: 10000 });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', { 
      style: 'currency', 
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('nb-NO').format(Math.round(num));
  };

  const calculateStandardDeviation = (values: number[]) => {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  };

  const calculateMedian = (values: number[]) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  };

  // Calculate metrics at different aggregation levels
  const metricsData = useMemo((): MetricData[] => {
    switch (selectedLevel) {
      case 'total': {
        const amounts = transactionData.map(tx => (tx.debit_amount || 0) - (tx.credit_amount || 0));
        const vouchers = new Set(transactionData.map(tx => tx.voucher_number).filter(Boolean));
        
        return [{
          level: 'total',
          label: 'Total populasjon',
          count: transactionData.length,
          uniqueVouchers: vouchers.size,
          avgAmount: amounts.length > 0 ? amounts.reduce((sum, val) => sum + val, 0) / amounts.length : 0,
          minAmount: amounts.length > 0 ? Math.min(...amounts) : 0,
          maxAmount: amounts.length > 0 ? Math.max(...amounts) : 0,
          medianAmount: calculateMedian(amounts),
          stdDev: calculateStandardDeviation(amounts),
          totalAmount: amounts.reduce((sum, val) => sum + val, 0)
        }];
      }

      case 'category': {
        const categoryMap = new Map<string, { 
          transactions: typeof transactionData;
          amounts: number[];
          vouchers: Set<string>;
        }>();

        // Group transactions by category
        transactionData.forEach(tx => {
          const accountNumber = parseInt(tx.account_number || '0');
          if (isNaN(accountNumber)) return;

          const category = getBalanceCategory(accountNumber);
          if (!categoryMap.has(category)) {
            categoryMap.set(category, { 
              transactions: [], 
              amounts: [], 
              vouchers: new Set() 
            });
          }

          const group = categoryMap.get(category)!;
          group.transactions.push(tx);
          group.amounts.push((tx.debit_amount || 0) - (tx.credit_amount || 0));
          if (tx.voucher_number) group.vouchers.add(tx.voucher_number);
        });

        return Array.from(categoryMap.entries()).map(([category, data]) => ({
          level: category,
          label: getBalanceCategoryLabel(category as any),
          count: data.transactions.length,
          uniqueVouchers: data.vouchers.size,
          avgAmount: data.amounts.length > 0 ? data.amounts.reduce((sum, val) => sum + val, 0) / data.amounts.length : 0,
          minAmount: data.amounts.length > 0 ? Math.min(...data.amounts) : 0,
          maxAmount: data.amounts.length > 0 ? Math.max(...data.amounts) : 0,
          medianAmount: calculateMedian(data.amounts),
          stdDev: calculateStandardDeviation(data.amounts),
          totalAmount: data.amounts.reduce((sum, val) => sum + val, 0)
        })).sort((a, b) => b.count - a.count);
      }

      case 'account': {
        const accountMap = new Map<string, {
          transactions: typeof transactionData;
          amounts: number[];
          vouchers: Set<string>;
          name: string;
        }>();

        // Group transactions by account
        transactionData.forEach(tx => {
          const accountNumber = tx.account_number || 'ukjent';
          if (!accountMap.has(accountNumber)) {
            const trialBalanceEntry = trialBalanceData.find(tb => tb.account_number === accountNumber);
            accountMap.set(accountNumber, {
              transactions: [],
              amounts: [],
              vouchers: new Set(),
              name: trialBalanceEntry?.account_name || 'Ukjent konto'
            });
          }

          const group = accountMap.get(accountNumber)!;
          group.transactions.push(tx);
          group.amounts.push((tx.debit_amount || 0) - (tx.credit_amount || 0));
          if (tx.voucher_number) group.vouchers.add(tx.voucher_number);
        });

        return Array.from(accountMap.entries()).map(([accountNumber, data]) => ({
          level: accountNumber,
          label: `${accountNumber} - ${data.name}`,
          count: data.transactions.length,
          uniqueVouchers: data.vouchers.size,
          avgAmount: data.amounts.length > 0 ? data.amounts.reduce((sum, val) => sum + val, 0) / data.amounts.length : 0,
          minAmount: data.amounts.length > 0 ? Math.min(...data.amounts) : 0,
          maxAmount: data.amounts.length > 0 ? Math.max(...data.amounts) : 0,
          medianAmount: calculateMedian(data.amounts),
          stdDev: calculateStandardDeviation(data.amounts),
          totalAmount: data.amounts.reduce((sum, val) => sum + val, 0)
        })).sort((a, b) => b.count - a.count).slice(0, 20); // Top 20 accounts
      }

      default:
        return [];
    }
  }, [selectedLevel, transactionData, trialBalanceData]);

  const getMetricValue = (data: MetricData, metric: MetricType) => {
    switch (metric) {
      case 'count': return data.count;
      case 'unique_vouchers': return data.uniqueVouchers;
      case 'avg_amount': return data.avgAmount;
      case 'min_amount': return data.minAmount;
      case 'max_amount': return data.maxAmount;
      case 'median_amount': return data.medianAmount;
      case 'std_dev': return data.stdDev;
      default: return 0;
    }
  };

  const formatMetricValue = (value: number, metric: MetricType) => {
    if (['count', 'unique_vouchers'].includes(metric)) {
      return formatNumber(value);
    }
    return formatCurrency(value);
  };

  const getMetricLabel = (metric: MetricType) => {
    switch (metric) {
      case 'count': return 'Antall transaksjoner';
      case 'unique_vouchers': return 'Unike bilag';
      case 'avg_amount': return 'Gjennomsnitt';
      case 'min_amount': return 'Minimum';
      case 'max_amount': return 'Maksimum';
      case 'median_amount': return 'Median';
      case 'std_dev': return 'Standardavvik';
      default: return metric;
    }
  };

  const chartData = metricsData.map(data => ({
    name: data.label.length > 20 ? data.label.substring(0, 20) + '...' : data.label,
    value: getMetricValue(data, selectedMetric),
    fullName: data.label
  }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Metrics Explorer
        </CardTitle>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Nivå:</label>
            <Select value={selectedLevel} onValueChange={(value) => setSelectedLevel(value as AggregationLevel)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">Total populasjon</SelectItem>
                <SelectItem value="category">Kategorier</SelectItem>
                <SelectItem value="account">Kontoer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Metrikk:</label>
            <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricType)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">Antall transaksjoner</SelectItem>
                <SelectItem value="unique_vouchers">Unike bilag</SelectItem>
                <SelectItem value="avg_amount">Gjennomsnitt</SelectItem>
                <SelectItem value="min_amount">Minimum</SelectItem>
                <SelectItem value="max_amount">Maksimum</SelectItem>
                <SelectItem value="median_amount">Median</SelectItem>
                <SelectItem value="std_dev">Standardavvik</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'table' | 'chart')}>
          <TabsList className="mb-4">
            <TabsTrigger value="table">Tabell</TabsTrigger>
            <TabsTrigger value="chart">Graf</TabsTrigger>
          </TabsList>

          <TabsContent value="table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{selectedLevel === 'category' ? 'Kategori' : selectedLevel === 'account' ? 'Konto' : 'Nivå'}</TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Hash size={14} />
                      Transaksjoner
                    </div>
                  </TableHead>
                  <TableHead className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Target size={14} />
                      Unike bilag
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Gjennomsnitt</TableHead>
                  <TableHead className="text-right">Min / Max</TableHead>
                  <TableHead className="text-right">Median</TableHead>
                  <TableHead className="text-right">Std.avvik</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metricsData.map((data) => (
                  <TableRow key={data.level}>
                    <TableCell className="font-medium">{data.label}</TableCell>
                    <TableCell className="text-right">{formatNumber(data.count)}</TableCell>
                    <TableCell className="text-right">{formatNumber(data.uniqueVouchers)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.avgAmount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="space-y-1">
                        <div>{formatCurrency(data.minAmount)}</div>
                        <div>{formatCurrency(data.maxAmount)}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(data.medianAmount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(data.stdDev)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="chart">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">{getMetricLabel(selectedMetric)}</h4>
                <Badge variant="secondary">{metricsData.length} elementer</Badge>
              </div>
              
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis 
                      tickFormatter={(value) => formatMetricValue(value, selectedMetric)}
                      fontSize={12}
                    />
                    <Tooltip 
                      formatter={(value) => [formatMetricValue(value as number, selectedMetric), getMetricLabel(selectedMetric)]}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return item?.fullName || label;
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}