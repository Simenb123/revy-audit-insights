import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSaftCustomers, useSaftCustomerAgedAnalysis } from '@/hooks/useSaftCustomers';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/formatters';
import { Users, TrendingUp, Clock, AlertCircle } from 'lucide-react';

interface CustomerReportProps {
  clientId: string;
  importSessionId?: string;
}

const CustomerReport: React.FC<CustomerReportProps> = ({ clientId, importSessionId }) => {
  const { data: customers = [], isLoading: loadingCustomers } = useSaftCustomers(clientId, importSessionId);
  const { data: agedAnalysis = [], isLoading: loadingAged } = useSaftCustomerAgedAnalysis(clientId, importSessionId);

  if (loadingCustomers || loadingAged) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const totalCustomers = customers.length;
  const totalReceivables = customers.reduce((sum, c) => sum + (c.closing_balance_netto || 0), 0);
  const activeCustomers = customers.filter(c => c.customer_status !== 'inactive').length;
  const overdue = (agedAnalysis as any[]).reduce((sum: number, a: any) => sum + (a.days_31_60 || 0) + (a.days_61_90 || 0) + (a.days_91_plus || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Kundefordringer</h2>
        <p className="text-muted-foreground">Oversikt over kunder og aldersfordelt reskontro</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt antall kunder</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {activeCustomers} aktive kunder
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale kundefordringer</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalReceivables)}</div>
            <p className="text-xs text-muted-foreground">
              Netto sluttsaldo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forfalt beløp</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overdue)}</div>
            <p className="text-xs text-muted-foreground">
              Over 30 dager gamle
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gjennomsnittlig fordring</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalCustomers > 0 ? formatCurrency(totalReceivables / totalCustomers) : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per kunde
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aged Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Aldersfordelt kundefordringer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kunde</TableHead>
                  <TableHead>Ikke forfalt</TableHead>
                  <TableHead>0-30 dager</TableHead>
                  <TableHead>31-60 dager</TableHead>
                  <TableHead>61-90 dager</TableHead>
                  <TableHead>91+ dager</TableHead>
                  <TableHead className="text-right">Totalt utestående</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(agedAnalysis as any[]).map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{item.customer_name || item.customer_id}</div>
                        {item.customer_name && item.customer_id !== item.customer_name && (
                          <div className="text-sm text-muted-foreground">{item.customer_id}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(item.not_due || 0)}</TableCell>
                    <TableCell>{formatCurrency(item.days_0_30 || 0)}</TableCell>
                    <TableCell>
                      <span className={item.days_31_60 > 0 ? 'text-yellow-600' : ''}>
                        {formatCurrency(item.days_31_60 || 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={item.days_61_90 > 0 ? 'text-orange-600' : ''}>
                        {formatCurrency(item.days_61_90 || 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={item.days_91_plus > 0 ? 'text-red-600' : ''}>
                        {formatCurrency(item.days_91_plus || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total_outstanding || 0)}
                    </TableCell>
                  </TableRow>
                ))}
                {(agedAnalysis as any[]).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Ingen kundedata funnet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Master Data */}
      <Card>
        <CardHeader>
          <CardTitle>Kunderegister</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kunde-ID</TableHead>
                  <TableHead>Navn</TableHead>
                  <TableHead>Org.nr/VAT</TableHead>
                  <TableHead>Land</TableHead>
                  <TableHead>Reskontrokonto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Sluttsaldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.customer_id}</TableCell>
                    <TableCell>
                      <div>
                        <div>{customer.customer_name}</div>
                        {customer.city && (
                          <div className="text-sm text-muted-foreground">{customer.city}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{customer.vat_number}</TableCell>
                    <TableCell>{customer.country}</TableCell>
                    <TableCell>{customer.balance_account}</TableCell>
                    <TableCell>
                      <Badge variant={customer.customer_status === 'active' ? 'default' : 'secondary'}>
                        {customer.customer_status || 'Ukjent'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={customer.closing_balance_netto > 0 ? 'text-green-600' : customer.closing_balance_netto < 0 ? 'text-red-600' : ''}>
                        {formatCurrency(customer.closing_balance_netto)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {customers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Ingen kunder funnet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerReport;