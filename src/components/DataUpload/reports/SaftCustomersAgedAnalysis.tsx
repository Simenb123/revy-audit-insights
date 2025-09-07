import React from 'react';
import { useSaftCustomerAgedAnalysis } from '@/hooks/useSaftCustomers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

interface SaftCustomersAgedAnalysisProps {
  clientId: string;
  importSessionId?: string;
}

export const SaftCustomersAgedAnalysis = ({ clientId, importSessionId }: SaftCustomersAgedAnalysisProps) => {
  const { data: agedAnalysis, isLoading, error } = useSaftCustomerAgedAnalysis(clientId, importSessionId);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Feil ved lasting av aldersfordelingsdata: {error.message}
      </div>
    );
  }

  if (!agedAnalysis || agedAnalysis.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Ingen data for aldersfordeling. Last opp en SAF-T fil først.
      </div>
    );
  }

  // Aggregate totals by age bucket
  const totals = agedAnalysis.reduce(
    (acc, customer) => ({
      not_due: acc.not_due + customer.not_due,
      days_0_30: acc.days_0_30 + customer.days_0_30,
      days_31_60: acc.days_31_60 + customer.days_31_60,
      days_61_90: acc.days_61_90 + customer.days_61_90,
      days_91_plus: acc.days_91_plus + customer.days_91_plus,
      total: acc.total + customer.total_outstanding,
    }),
    {
      not_due: 0,
      days_0_30: 0,
      days_31_60: 0,
      days_61_90: 0,
      days_91_plus: 0,
      total: 0,
    }
  );

  const buckets = [
    { title: 'Ikke forfalt', amount: totals.not_due, variant: 'default' as const },
    { title: '0-30 dager', amount: totals.days_0_30, variant: 'secondary' as const },
    { title: '31-60 dager', amount: totals.days_31_60, variant: 'outline' as const },
    { title: '61-90 dager', amount: totals.days_61_90, variant: 'destructive' as const },
    { title: '90+ dager', amount: totals.days_91_plus, variant: 'destructive' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {buckets.map((bucket) => {
          const percentage = totals.total > 0 ? (bucket.amount / totals.total) * 100 : 0;
          return (
            <Card key={bucket.title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {bucket.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('no-NO', { 
                    style: 'currency', 
                    currency: 'NOK',
                    minimumFractionDigits: 0
                  }).format(bucket.amount)}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={percentage} className="flex-1 h-2" />
                  <Badge variant={bucket.variant} className="text-xs">
                    {percentage.toFixed(1)}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total kundefordring</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {new Intl.NumberFormat('no-NO', { 
              style: 'currency', 
              currency: 'NOK',
              minimumFractionDigits: 0
            }).format(totals.total)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Fordelt på {agedAnalysis.length} kunder
          </p>
        </CardContent>
      </Card>
    </div>
  );
};