import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ArrowLeft, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { useTrialBalanceData } from '@/hooks/useTrialBalanceData';
import { useGeneralLedgerData } from '@/hooks/useGeneralLedgerData';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useWidgetManager, Widget } from '@/contexts/WidgetManagerContext';
import { getBalanceCategory, getBalanceCategoryLabel } from '@/utils/standardAccountCategory';

interface AccountHierarchyWidgetProps {
  widget: Widget;
}

type HierarchyLevel = 'categories' | 'accounts' | 'transactions';

interface CategoryData {
  category: string;
  label: string;
  totalBalance: number;
  prevBalance: number;
  accountCount: number;
}

interface AccountData {
  accountNumber: string;
  accountName: string;
  balance: number;
  prevBalance: number;
  transactionCount: number;
}

interface TransactionData {
  id: string;
  date: string;
  description: string;
  amount: number;
  voucher: string;
}

export function AccountHierarchyWidget({ widget }: AccountHierarchyWidgetProps) {
  const { selectedFiscalYear } = useFiscalYear();
  const { updateWidget } = useWidgetManager();
  const [level, setLevel] = useState<HierarchyLevel>('categories');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const clientId = widget.config?.clientId || '';
  
  const { data: trialBalanceData = [] } = useTrialBalanceData(clientId);
  const { data: transactionData = [] } = useGeneralLedgerData(clientId, undefined, undefined, {
    accountNumber: selectedAccount
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', { 
      style: 'currency', 
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (current: number, previous: number) => {
    if (previous === 0) return { value: '∞', isPositive: current >= 0 };
    const change = ((current - previous) / Math.abs(previous)) * 100;
    return {
      value: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
      isPositive: change >= 0
    };
  };

  // Aggregate data by categories
  const categoryData = useMemo((): CategoryData[] => {
    const categoryMap = new Map<string, { 
      totalBalance: number; 
      prevBalance: number; 
      accountCount: number; 
    }>();

    trialBalanceData.forEach(entry => {
      const accountNumber = parseInt(entry.account_number);
      if (isNaN(accountNumber)) return;

      const category = getBalanceCategory(accountNumber);
      const existing = categoryMap.get(category) || { 
        totalBalance: 0, 
        prevBalance: 0, 
        accountCount: 0 
      };

      categoryMap.set(category, {
        totalBalance: existing.totalBalance + (entry.closing_balance || 0),
        prevBalance: existing.prevBalance + (entry.opening_balance || 0),
        accountCount: existing.accountCount + 1
      });
    });

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      label: getBalanceCategoryLabel(category as any),
      ...data
    })).sort((a, b) => Math.abs(b.totalBalance) - Math.abs(a.totalBalance));
  }, [trialBalanceData]);

  // Filter accounts by selected category
  const accountData = useMemo((): AccountData[] => {
    if (!selectedCategory) return [];

    return trialBalanceData
      .filter(entry => {
        const accountNumber = parseInt(entry.account_number);
        return !isNaN(accountNumber) && getBalanceCategory(accountNumber) === selectedCategory;
      })
      .map(entry => ({
        accountNumber: entry.account_number,
        accountName: entry.account_name || 'Ukjent konto',
        balance: entry.closing_balance || 0,
        prevBalance: entry.opening_balance || 0,
        transactionCount: 0 // This would need to be calculated from transaction data
      }))
      .filter(account => {
        if (!searchTerm) return true;
        return account.accountNumber.includes(searchTerm) || 
               account.accountName.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
  }, [trialBalanceData, selectedCategory, searchTerm]);

  // Transform transaction data
  const transactionRows = useMemo((): TransactionData[] => {
    if (!selectedAccount || !transactionData) return [];

    return transactionData
      .filter(tx => {
        if (!searchTerm) return true;
        return tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               tx.voucher_number?.toLowerCase().includes(searchTerm.toLowerCase());
      })
      .map(tx => ({
        id: tx.id,
        date: tx.transaction_date || '',
        description: tx.description || 'Ingen beskrivelse',
        amount: (tx.debit_amount || 0) - (tx.credit_amount || 0),
        voucher: tx.voucher_number || 'Ukjent'
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactionData, selectedAccount, searchTerm]);

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    setLevel('accounts');
    setSearchTerm('');
  };

  const handleAccountClick = (accountNumber: string) => {
    setSelectedAccount(accountNumber);
    setLevel('transactions');
    setSearchTerm('');
  };

  const handleBack = () => {
    if (level === 'transactions') {
      setLevel('accounts');
      setSelectedAccount('');
    } else if (level === 'accounts') {
      setLevel('categories');
      setSelectedCategory('');
    }
    setSearchTerm('');
  };

  const renderCategories = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Regnskapskategorier</h3>
          <p className="text-sm text-muted-foreground">
            Klikk på en kategori for å se kontoer
          </p>
        </div>
        <Badge variant="secondary">{categoryData.length} kategorier</Badge>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kategori</TableHead>
            <TableHead className="text-right">Antall kontoer</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead className="text-right">Forrige år</TableHead>
            <TableHead className="text-right">Endring</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categoryData.map((category) => {
            const change = formatPercentage(category.totalBalance, category.prevBalance);
            return (
              <TableRow 
                key={category.category}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleCategoryClick(category.category)}
              >
                <TableCell className="font-medium">{category.label}</TableCell>
                <TableCell className="text-right">{category.accountCount}</TableCell>
                <TableCell className="text-right">{formatCurrency(category.totalBalance)}</TableCell>
                <TableCell className="text-right">{formatCurrency(category.prevBalance)}</TableCell>
                <TableCell className={`text-right ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  <div className="flex items-center justify-end gap-1">
                    {change.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {change.value}
                  </div>
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

  const renderAccounts = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft size={16} className="mr-1" /> Tilbake
          </Button>
          <div>
            <h3 className="text-lg font-medium">
              {getBalanceCategoryLabel(selectedCategory as any)}
            </h3>
            <p className="text-sm text-muted-foreground">
              Klikk på en konto for å se transaksjoner
            </p>
          </div>
        </div>
        <Badge variant="secondary">{accountData.length} kontoer</Badge>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Søk i kontoer..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kontonr.</TableHead>
            <TableHead>Kontonavn</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead className="text-right">Forrige år</TableHead>
            <TableHead className="text-right">Endring</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accountData.map((account) => {
            const change = formatPercentage(account.balance, account.prevBalance);
            return (
              <TableRow 
                key={account.accountNumber}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleAccountClick(account.accountNumber)}
              >
                <TableCell className="font-mono">{account.accountNumber}</TableCell>
                <TableCell>{account.accountName}</TableCell>
                <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
                <TableCell className="text-right">{formatCurrency(account.prevBalance)}</TableCell>
                <TableCell className={`text-right ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  <div className="flex items-center justify-end gap-1">
                    {change.isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {change.value}
                  </div>
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

  const renderTransactions = () => {
    const account = accountData.find(a => a.accountNumber === selectedAccount);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft size={16} className="mr-1" /> Tilbake
            </Button>
            <div>
              <h3 className="text-lg font-medium">
                {selectedAccount} - {account?.accountName}
              </h3>
              <p className="text-sm text-muted-foreground">
                Hovedbokstransaksjoner
              </p>
            </div>
          </div>
          <Badge variant="secondary">{transactionRows.length} transaksjoner</Badge>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Søk i transaksjoner..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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
            {transactionRows.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.date}</TableCell>
                <TableCell className="font-mono">{transaction.voucher}</TableCell>
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
      case 'categories':
        return renderCategories();
      case 'accounts':
        return renderAccounts();
      case 'transactions':
        return renderTransactions();
      default:
        return renderCategories();
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Hierarkisk drilldown</span>
          <Badge variant="outline">
            {level === 'categories' ? 'Kategorier' : 
             level === 'accounts' ? 'Kontoer' : 'Transaksjoner'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}