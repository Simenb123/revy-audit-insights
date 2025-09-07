import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Download, Search } from 'lucide-react';
import { ArBalance } from '@/hooks/useArApBalances';
import * as XLSX from 'xlsx';

interface ArBalanceTableProps {
  data: ArBalance[];
  clientName: string;
  isLoading?: boolean;
}

const ArBalanceTable = ({ data, clientName, isLoading }: ArBalanceTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(balance =>
    balance.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.customer_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSaldo = filteredData.reduce((sum, item) => sum + item.saldo, 0);

  const handleExport = () => {
    const exportData = filteredData.map(balance => ({
      'Kunde ID': balance.customer_id,
      'Kundenavn': balance.customer_name || 'Ukjent',
      'Saldo': balance.saldo,
      'Antall transaksjoner': balance.tx_count,
      'Sist oppdatert': new Date(balance.updated_at).toLocaleDateString('nb-NO')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kundesaldo');
    
    const fileName = `AR_Balances_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kundesaldo (AR)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Laster data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Kundesaldo (AR)</span>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Eksporter
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk etter kunde..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kunde ID</TableHead>
                  <TableHead>Kundenavn</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Transaksjoner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((balance) => (
                  <TableRow key={balance.customer_id}>
                    <TableCell className="font-mono">{balance.customer_id}</TableCell>
                    <TableCell>{balance.customer_name || 'Ukjent kunde'}</TableCell>
                    <TableCell className="text-right font-mono">
                      {balance.saldo.toLocaleString('nb-NO', {
                        style: 'currency',
                        currency: 'NOK'
                      })}
                    </TableCell>
                    <TableCell className="text-right">{balance.tx_count}</TableCell>
                  </TableRow>
                ))}
                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Ingen data funnet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <span className="text-sm text-muted-foreground">
              {filteredData.length} kunder totalt
            </span>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total saldo</div>
              <div className="text-lg font-bold">
                {totalSaldo.toLocaleString('nb-NO', {
                  style: 'currency',
                  currency: 'NOK'
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ArBalanceTable;