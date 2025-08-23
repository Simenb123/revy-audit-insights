
import React, { useState, useMemo } from 'react';
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
import { useTrialBalanceData } from '@/hooks/useTrialBalanceData';
import { useGeneralLedgerData } from '@/hooks/useGeneralLedgerData';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useActiveVersion } from '@/hooks/useAccountingVersions';
import { Skeleton } from "@/components/ui/skeleton";

type DrillDownLevel = 'accountGroup' | 'account' | 'transaction';

interface DrillDownTableProps {
  clientId: string;
}

const DrillDownTable: React.FC<DrillDownTableProps> = ({ clientId }) => {
  const [level, setLevel] = useState<DrillDownLevel>('accountGroup');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get global context
  const { selectedFiscalYear } = useFiscalYear();
  const { data: activeVersion } = useActiveVersion(clientId);
  
  // Fetch real data
  const { data: trialBalanceData = [], isLoading: isTBLoading } = useTrialBalanceData(
    clientId, 
    undefined, 
    selectedFiscalYear
  );
  
  const { data: generalLedgerData = [], isLoading: isGLLoading } = useGeneralLedgerData(
    clientId,
    activeVersion?.id,
    { page: 1, pageSize: 10000 },
    { forceLoadAll: true }
  );
  
  // Process data for account groups
  const accountGroupData = useMemo(() => {
    if (!trialBalanceData.length) return [];
    
    // Group accounts by major categories based on account numbers
    const groups: { [key: string]: { name: string; accounts: any[]; totalBalance: number } } = {};
    
    trialBalanceData.forEach(account => {
      const accountNumber = account.account_number;
      let groupKey = '';
      let groupName = '';
      
      // Norwegian chart of accounts classification
      if (accountNumber.startsWith('3')) {
        groupKey = 'sales';
        groupName = 'Salgsinntekter';
      } else if (accountNumber.startsWith('4')) {
        groupKey = 'cogs';
        groupName = 'Varekostnader';
      } else if (accountNumber.startsWith('5')) {
        groupKey = 'salary';
        groupName = 'Lønnskostnader';
      } else if (accountNumber.startsWith('6')) {
        groupKey = 'other_costs';
        groupName = 'Andre driftskostnader';
      } else if (accountNumber.startsWith('7')) {
        groupKey = 'financial';
        groupName = 'Finansposter';
      } else if (accountNumber.startsWith('1')) {
        groupKey = 'assets';
        groupName = 'Eiendeler';
      } else if (accountNumber.startsWith('2')) {
        groupKey = 'liabilities';
        groupName = 'Gjeld og egenkapital';
      } else {
        groupKey = 'other';
        groupName = 'Andre kontoer';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = { name: groupName, accounts: [], totalBalance: 0 };
      }
      
      groups[groupKey].accounts.push(account);
      groups[groupKey].totalBalance += (account.closing_balance || 0);
    });
    
    return Object.entries(groups).map(([key, data]) => ({
      id: key,
      name: data.name,
      balance: data.totalBalance,
      accountCount: data.accounts.length,
      accounts: data.accounts
    }));
  }, [trialBalanceData]);
  
  // Get accounts for selected group
  const selectedGroupAccounts = useMemo(() => {
    if (level !== 'account') return [];
    
    const salesGroup = accountGroupData.find(g => g.id === 'sales');
    return salesGroup?.accounts || [];
  }, [accountGroupData, level]);
  
  // Get transactions for selected account
  const selectedAccountTransactions = useMemo(() => {
    if (level !== 'transaction' || !selectedAccount) return [];
    
    return generalLedgerData.filter(tx => tx.account_number === selectedAccount);
  }, [generalLedgerData, level, selectedAccount]);
  
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
            <TableHead className="text-right">Antall kontoer</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accountGroupData.map((group) => (
            <TableRow 
              key={group.id} 
              className="cursor-pointer hover:bg-muted/50" 
              onClick={() => group.id === 'sales' ? handleGroupClick() : undefined}
            >
              <TableCell className="font-medium">{group.name}</TableCell>
              <TableCell className="text-right">{formatCurrency(group.balance)}</TableCell>
              <TableCell className="text-right">{group.accountCount} kontoer</TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronRight size={18} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
  
  const renderAccountTable = () => {
    const filteredData = filterData(selectedGroupAccounts, searchTerm);
    
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
              <TableHead className="text-right">Sluttsaldo</TableHead>
              <TableHead className="text-right">Åpningssaldo</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((account) => (
              <TableRow 
                key={account.account_number} 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleAccountClick(account.account_number)}
              >
                <TableCell>{account.account_number}</TableCell>
                <TableCell>{account.account_name}</TableCell>
                <TableCell className="text-right">{formatCurrency(account.closing_balance || 0)}</TableCell>
                <TableCell className="text-right">{formatCurrency(account.opening_balance || 0)}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight size={18} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  const renderTransactionTable = () => {
    const account = selectedGroupAccounts.find(a => a.account_number === selectedAccount);
    const filteredData = filterData(selectedAccountTransactions, searchTerm);
    
    return (
      <div>
        <div className="mb-4 flex items-center">
          <Button variant="outline" size="sm" className="mr-2" onClick={handleBack}>
            <ArrowLeft size={16} className="mr-1" /> Tilbake
          </Button>
          <div>
            <h3 className="text-lg font-medium">
              {selectedAccount} - {account?.account_name}
            </h3>
            <p className="text-sm text-muted-foreground">
              Transaksjoner for valgt konto ({filteredData.length} transaksjoner)
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
              <TableHead className="text-right">Debet</TableHead>
              <TableHead className="text-right">Kredit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((transaction) => (
              <TableRow 
                key={transaction.id} 
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell>{new Date(transaction.transaction_date).toLocaleDateString('nb-NO')}</TableCell>
                <TableCell>{transaction.voucher_number}</TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell className="text-right">
                  {transaction.debit_amount ? formatCurrency(transaction.debit_amount) : ''}
                </TableCell>
                <TableCell className="text-right">
                  {transaction.credit_amount ? formatCurrency(transaction.credit_amount) : ''}
                </TableCell>
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
  
  if (isTBLoading || isGLLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drill-down analyse</CardTitle>
          <CardDescription>
            Laster regnskapsdata...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drill-down analyse</CardTitle>
        <CardDescription>
          Utforsk regnskapstall fra oversiktsnivå til transaksjonsnivå ({selectedFiscalYear})
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default DrillDownTable;
