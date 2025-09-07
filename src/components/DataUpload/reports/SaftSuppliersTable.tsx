import React from 'react';
import { useSaftSuppliers, SaftSupplier } from '@/hooks/useSaftSuppliers';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';

interface SaftSuppliersTableProps {
  clientId: string;
  importSessionId?: string;
}

export const SaftSuppliersTable = ({ clientId, importSessionId }: SaftSuppliersTableProps) => {
  const { data: suppliers, isLoading, error } = useSaftSuppliers(clientId, importSessionId);
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredSuppliers = React.useMemo(() => {
    if (!suppliers) return [];
    if (!searchTerm) return suppliers;
    return suppliers.filter(supplier => 
      supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplier_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suppliers, searchTerm]);

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
        Feil ved lasting av leverandørdata: {error.message}
      </div>
    );
  }

  if (!suppliers || suppliers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Ingen leverandørdata funnet. Last opp en SAF-T fil først.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Søk etter leverandørnavn eller leverandør-ID..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Leverandør-ID</TableHead>
            <TableHead>Navn</TableHead>
            <TableHead>Org.nr</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Sluttbalanse</TableHead>
            <TableHead>By</TableHead>
            <TableHead>Land</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSuppliers.map((supplier) => (
            <TableRow key={supplier.id}>
              <TableCell className="font-mono text-sm">{supplier.supplier_id}</TableCell>
              <TableCell className="font-medium">{supplier.supplier_name}</TableCell>
              <TableCell>
                {supplier.vat_number ? (
                  <span className="font-mono text-sm">{supplier.vat_number}</span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant={supplier.supplier_status === 'active' ? 'default' : 'secondary'}>
                  {supplier.supplier_status}
                </Badge>
              </TableCell>
              <TableCell>
                <span className={`font-mono text-sm ${supplier.closing_balance_netto > 0 ? 'text-red-600' : supplier.closing_balance_netto < 0 ? 'text-green-600' : ''}`}>
                  {new Intl.NumberFormat('no-NO', { 
                    style: 'currency', 
                    currency: 'NOK',
                    minimumFractionDigits: 0
                  }).format(supplier.closing_balance_netto)}
                </span>
              </TableCell>
              <TableCell>{supplier.city}</TableCell>
              <TableCell>{supplier.country}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};