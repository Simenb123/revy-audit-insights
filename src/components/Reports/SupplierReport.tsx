import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useSaftSuppliers, useSaftSupplierAgedAnalysis } from '@/hooks/useSaftSuppliers';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/formatters';
import { Building2, TrendingDown, Clock, AlertTriangle } from 'lucide-react';

interface SupplierReportProps {
  clientId: string;
  importSessionId?: string;
}

const SupplierReport: React.FC<SupplierReportProps> = ({ clientId, importSessionId }) => {
  const { data: suppliers = [], isLoading: loadingSuppliers } = useSaftSuppliers(clientId, importSessionId);
  const { data: agedAnalysis = [], isLoading: loadingAged } = useSaftSupplierAgedAnalysis(clientId, importSessionId);

  if (loadingSuppliers || loadingAged) {
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

  const totalSuppliers = suppliers.length;
  const totalPayables = suppliers.reduce((sum, s) => sum + Math.abs(s.closing_balance_netto || 0), 0);
  const activeSuppliers = suppliers.filter(s => s.supplier_status !== 'inactive').length;
  const overdue = (agedAnalysis as any[]).reduce((sum: number, a: any) => sum + (a.days_31_60 || 0) + (a.days_61_90 || 0) + (a.days_91_plus || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Leverandørgjeld</h2>
        <p className="text-muted-foreground">Oversikt over leverandører og aldersfordelt gjeld</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt antall leverandører</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSuppliers}</div>
            <p className="text-xs text-muted-foreground">
              {activeSuppliers} aktive leverandører
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total leverandørgjeld</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPayables)}</div>
            <p className="text-xs text-muted-foreground">
              Netto sluttsaldo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Forfalt gjeld</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(overdue)}</div>
            <p className="text-xs text-muted-foreground">
              Over 30 dager gammel
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gjennomsnittlig gjeld</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSuppliers > 0 ? formatCurrency(totalPayables / totalSuppliers) : formatCurrency(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per leverandør
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aged Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Aldersfordelt leverandørgjeld</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leverandør</TableHead>
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
                        <div>{item.supplier_name || item.supplier_id}</div>
                        {item.supplier_name && item.supplier_id !== item.supplier_name && (
                          <div className="text-sm text-muted-foreground">{item.supplier_id}</div>
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
                      Ingen leverandørdata funnet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Master Data */}
      <Card>
        <CardHeader>
          <CardTitle>Leverandørregister</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leverandør-ID</TableHead>
                  <TableHead>Navn</TableHead>
                  <TableHead>Org.nr/VAT</TableHead>
                  <TableHead>Land</TableHead>
                  <TableHead>Reskontrokonto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Sluttsaldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.supplier_id}</TableCell>
                    <TableCell>
                      <div>
                        <div>{supplier.supplier_name}</div>
                        {supplier.city && (
                          <div className="text-sm text-muted-foreground">{supplier.city}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{supplier.vat_number}</TableCell>
                    <TableCell>{supplier.country}</TableCell>
                    <TableCell>{supplier.balance_account}</TableCell>
                    <TableCell>
                      <Badge variant={supplier.supplier_status === 'active' ? 'default' : 'secondary'}>
                        {supplier.supplier_status || 'Ukjent'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={supplier.closing_balance_netto < 0 ? 'text-red-600' : supplier.closing_balance_netto > 0 ? 'text-green-600' : ''}>
                        {formatCurrency(Math.abs(supplier.closing_balance_netto))}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {suppliers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      Ingen leverandører funnet
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

export default SupplierReport;