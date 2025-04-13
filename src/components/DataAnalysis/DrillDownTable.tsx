
import React, { useState } from 'react';
import { 
  Card,
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronRight, ArrowLeft, Search, Filter } from 'lucide-react';
import { Input } from "@/components/ui/input";

const mockAccountData = [
  { accountId: '3000', name: 'Salg, høy sats', balance: 3800000, prevBalance: 3500000 },
  { accountId: '3100', name: 'Salg, middels sats', balance: 1200000, prevBalance: 1150000 },
  { accountId: '3200', name: 'Salg, lav sats', balance: 800000, prevBalance: 750000 },
  { accountId: '3300', name: 'Salg, avg. fri', balance: 600000, prevBalance: 550000 },
  { accountId: '3400', name: 'Salg, eksport', balance: 800000, prevBalance: 700000 },
  { accountId: '3600', name: 'Provisjonsinntekter', balance: 300000, prevBalance: 250000 },
];

const mockTransactionData = [
  { id: '1001', accountId: '3000', date: '2024-01-15', description: 'Faktura #12345', amount: 45000, voucher: 'FB-2024-0123' },
  { id: '1002', accountId: '3000', date: '2024-01-22', description: 'Faktura #12346', amount: 68000, voucher: 'FB-2024-0145' },
  { id: '1003', accountId: '3000', date: '2024-02-05', description: 'Faktura #12350', amount: 52000, voucher: 'FB-2024-0189' },
  { id: '1004', accountId: '3000', date: '2024-02-18', description: 'Faktura #12356', amount: 78000, voucher: 'FB-2024-0213' },
  { id: '1005', accountId: '3000', date: '2024-03-10', description: 'Faktura #12370', amount: 61000, voucher: 'FB-2024-0267' },
  { id: '1006', accountId: '3000', date: '2024-03-25', description: 'Faktura #12385', amount: 54000, voucher: 'FB-2024-0301' },
];

type DrillDownLevel = 'accountGroup' | 'account' | 'transaction';

const DrillDownTable = () => {
  const [level, setLevel] = useState<DrillDownLevel>('accountGroup');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleGroupClick = () => {
    setLevel('account');
  };
  
  const handleAccountClick = (accountId: string) => {
    setSelectedAccount(accountId);
    setLevel('transaction');
  };
  
  const handleBack = () => {
    if (level === 'transaction') {
      setLevel('account');
      setSelectedAccount(null);
    } else if (level === 'account') {
      setLevel('accountGroup');
    }
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK' }).format(amount);
  };
  
  const filterData = (data: any[], term: string) => {
    if (!term) return data;
    return data.filter(item => 
      Object.values(item).some(value => 
        value !== null && value.toString().toLowerCase().includes(term.toLowerCase())
      )
    );
  };
  
  const renderAccountGroupTable = () => (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium">Regnskapslinjer</h3>
        <p className="text-sm text-muted-foreground">Klikk på en regnskapslinje for å se kontoer</p>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Regnskapslinje</TableHead>
            <TableHead className="text-right">Beløp</TableHead>
            <TableHead className="text-right">Forrige år</TableHead>
            <TableHead className="text-right">Endring %</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="cursor-pointer hover:bg-muted/50" onClick={handleGroupClick}>
            <TableCell className="font-medium">Salgsinntekter</TableCell>
            <TableCell className="text-right">{formatCurrency(7500000)}</TableCell>
            <TableCell className="text-right">{formatCurrency(6900000)}</TableCell>
            <TableCell className="text-right text-green-600">+8.7%</TableCell>
            <TableCell>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronRight size={18} />
              </Button>
            </TableCell>
          </TableRow>
          <TableRow className="cursor-pointer hover:bg-muted/50">
            <TableCell className="font-medium">Varekostnader</TableCell>
            <TableCell className="text-right">{formatCurrency(2800000)}</TableCell>
            <TableCell className="text-right">{formatCurrency(2700000)}</TableCell>
            <TableCell className="text-right text-green-600">+3.7%</TableCell>
            <TableCell>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronRight size={18} />
              </Button>
            </TableCell>
          </TableRow>
          <TableRow className="cursor-pointer hover:bg-muted/50">
            <TableCell className="font-medium">Lønnskostnader</TableCell>
            <TableCell className="text-right">{formatCurrency(2100000)}</TableCell>
            <TableCell className="text-right">{formatCurrency(1950000)}</TableCell>
            <TableCell className="text-right text-green-600">+7.7%</TableCell>
            <TableCell>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronRight size={18} />
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
  
  const renderAccountTable = () => {
    const filteredData = filterData(mockAccountData, searchTerm);
    
    return (
      <div>
        <div className="mb-4 flex items-center">
          <Button variant="outline" size="sm" className="mr-2" onClick={handleBack}>
            <ArrowLeft size={16} className="mr-1" /> Tilbake
          </Button>
          <h3 className="text-lg font-medium">Kontoer i salgsinntekter</h3>
        </div>
        
        <div className="flex items-center mb-4 gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Søk i kontoer..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter size={16} />
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kontonr.</TableHead>
              <TableHead>Kontonavn</TableHead>
              <TableHead className="text-right">Beløp</TableHead>
              <TableHead className="text-right">Forrige år</TableHead>
              <TableHead className="text-right">Endring %</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((account) => {
              const growth = ((account.balance - account.prevBalance) / account.prevBalance) * 100;
              const formattedGrowth = growth.toFixed(1);
              const isPositive = growth >= 0;
              
              return (
                <TableRow 
                  key={account.accountId} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleAccountClick(account.accountId)}
                >
                  <TableCell>{account.accountId}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(account.prevBalance)}</TableCell>
                  <TableCell className={`text-right ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? '+' : ''}{formattedGrowth}%
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <ChevronRight size={18} />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  const renderTransactionTable = () => {
    const account = mockAccountData.find(a => a.accountId === selectedAccount);
    const filteredData = filterData(mockTransactionData, searchTerm);
    
    return (
      <div>
        <div className="mb-4 flex items-center">
          <Button variant="outline" size="sm" className="mr-2" onClick={handleBack}>
            <ArrowLeft size={16} className="mr-1" /> Tilbake
          </Button>
          <div>
            <h3 className="text-lg font-medium">
              {account?.accountId} - {account?.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              Transaksjoner for valgt konto
            </p>
          </div>
        </div>
        
        <div className="flex items-center mb-4 gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Søk i transaksjoner..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter size={16} />
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dato</TableHead>
              <TableHead>Bilagsnr.</TableHead>
              <TableHead>Beskrivelse</TableHead>
              <TableHead className="text-right">Beløp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((transaction) => (
              <TableRow 
                key={transaction.id} 
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell>{transaction.date}</TableCell>
                <TableCell>{transaction.voucher}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell className="text-right">{formatCurrency(transaction.amount)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  const renderContent = () => {
    switch (level) {
      case 'accountGroup':
        return renderAccountGroupTable();
      case 'account':
        return renderAccountTable();
      case 'transaction':
        return renderTransactionTable();
      default:
        return renderAccountGroupTable();
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Drill-down analyse</CardTitle>
        <CardDescription>
          Utforsk regnskapstall fra oversiktsnivå til transaksjonsnivå
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default DrillDownTable;
