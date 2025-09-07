import React from 'react';
import { useSaftCustomers, SaftCustomer } from '@/hooks/useSaftCustomers';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

interface SaftCustomersTableProps {
  clientId: string;
  importSessionId?: string;
}

export const SaftCustomersTable = ({ clientId, importSessionId }: SaftCustomersTableProps) => {
  const { data: customers, isLoading, error } = useSaftCustomers(clientId, importSessionId);
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredCustomers = React.useMemo(() => {
    if (!customers) return [];
    if (!searchTerm) return customers;
    return customers.filter(customer => 
      customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.customer_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [customers, searchTerm]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Feil ved lasting av kundedata: {error.message}
      </div>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Ingen kundedata funnet. Last opp en SAF-T fil først.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Søk etter kundenavn eller kunde-ID..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kunde-ID</TableHead>
            <TableHead>Navn</TableHead>
            <TableHead>Org.nr</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sluttbalanse</TableHead>
            <TableHead>By</TableHead>
            <TableHead>Land</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCustomers.map((customer) => (
            <TableRow key={customer.id}>
              <TableCell className="font-mono text-sm">{customer.customer_id}</TableCell>
              <TableCell className="font-medium">{customer.customer_name}</TableCell>
              <TableCell>
                {customer.vat_number ? (
                  <span className="font-mono text-sm">{customer.vat_number}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={customer.customer_status === 'active' ? 'default' : 'secondary'}>
                  {customer.customer_status}
                </Badge>
              </TableCell>
              <TableCell>
                <span className={`font-mono text-sm ${customer.closing_balance_netto > 0 ? 'text-green-600' : customer.closing_balance_netto < 0 ? 'text-red-600' : ''}`}>
                  {new Intl.NumberFormat('no-NO', { 
                    style: 'currency', 
                    currency: 'NOK',
                    minimumFractionDigits: 0
                  }).format(customer.closing_balance_netto)}
                </span>
              </TableCell>
              <TableCell>{customer.city}</TableCell>
              <TableCell>{customer.country}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};