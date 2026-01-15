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
import * as XLSX from 'xlsx';

export interface BalanceItem {
  id: string;
  name: string | null;
  saldo: number;
  tx_count: number;
  updated_at: string;
}

export type BalanceType = 'ar' | 'ap';

interface BalanceTableConfig {
  title: string;
  idLabel: string;
  nameLabel: string;
  searchPlaceholder: string;
  unknownName: string;
  countLabel: string;
  sheetName: string;
  filePrefix: string;
  exportIdLabel: string;
  exportNameLabel: string;
}

const CONFIG: Record<BalanceType, BalanceTableConfig> = {
  ar: {
    title: 'Kundesaldo (AR)',
    idLabel: 'Kunde ID',
    nameLabel: 'Kundenavn',
    searchPlaceholder: 'Søk etter kunde...',
    unknownName: 'Ukjent kunde',
    countLabel: 'kunder',
    sheetName: 'Kundesaldo',
    filePrefix: 'AR_Balances',
    exportIdLabel: 'Kunde ID',
    exportNameLabel: 'Kundenavn',
  },
  ap: {
    title: 'Leverandørsaldo (AP)',
    idLabel: 'Leverandør ID',
    nameLabel: 'Leverandørnavn',
    searchPlaceholder: 'Søk etter leverandør...',
    unknownName: 'Ukjent leverandør',
    countLabel: 'leverandører',
    sheetName: 'Leverandørsaldo',
    filePrefix: 'AP_Balances',
    exportIdLabel: 'Leverandør ID',
    exportNameLabel: 'Leverandørnavn',
  },
};

interface BalanceTableProps {
  data: BalanceItem[];
  clientName: string;
  type: BalanceType;
  isLoading?: boolean;
}

const BalanceTable = ({ data, clientName, type, isLoading }: BalanceTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const config = CONFIG[type];

  const filteredData = data.filter(balance =>
    balance.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSaldo = filteredData.reduce((sum, item) => sum + item.saldo, 0);

  const handleExport = () => {
    const exportData = filteredData.map(balance => ({
      [config.exportIdLabel]: balance.id,
      [config.exportNameLabel]: balance.name || 'Ukjent',
      'Saldo': balance.saldo,
      'Antall transaksjoner': balance.tx_count,
      'Sist oppdatert': new Date(balance.updated_at).toLocaleDateString('nb-NO')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, config.sheetName);
    
    const fileName = `${config.filePrefix}_${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{config.title}</CardTitle>
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
          <span>{config.title}</span>
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
              placeholder={config.searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{config.idLabel}</TableHead>
                  <TableHead>{config.nameLabel}</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Transaksjoner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((balance) => (
                  <TableRow key={balance.id}>
                    <TableCell className="font-mono">{balance.id}</TableCell>
                    <TableCell>{balance.name || config.unknownName}</TableCell>
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
              {filteredData.length} {config.countLabel} totalt
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

export default BalanceTable;
