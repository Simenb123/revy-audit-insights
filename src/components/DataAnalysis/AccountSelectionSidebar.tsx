
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TreeView, TreeItem, TreeViewContent, TreeViewTrigger } from '@/components/ui/tree-view';
import { formatCurrency } from '@/lib/formatters';
import { Account, AccountGroup } from '@/types/revio';
import { Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '../ui/button';

// Mock data
const assets: Account[] = [
  { id: '1', name: 'Bankinnskudd', number: '1920', balance: 1500000, type: 'asset' },
  { id: '2', name: 'Kundefordringer', number: '1500', balance: 750000, type: 'asset' },
  { id: '3', name: 'Varelager', number: '1460', balance: 1200000, type: 'asset' },
  { id: '4', name: 'Maskiner', number: '1250', balance: 2500000, type: 'asset' },
  { id: '5', name: 'Goodwill', number: '1080', balance: 500000, type: 'asset' },
  { id: '6', name: 'Utsatt skattefordel', number: '1070', balance: 150000, type: 'asset' },
  { id: '7', name: 'Kontanter', number: '1900', balance: 50000, type: 'asset' },
  { id: '8', name: 'Aksjer', number: '1350', balance: 300000, type: 'asset' },
  { id: '9', name: 'Bygninger', number: '1100', balance: 5000000, type: 'asset' },
];
const liabilities: Account[] = [
  { id: '10', name: 'Leverandørgjeld', number: '2400', balance: 450000, type: 'liability' },
  { id: '11', name: 'Langsiktig gjeld', number: '2200', balance: 3000000, type: 'liability' },
  { id: '12', name: 'Skyldig moms', number: '2700', balance: 120000, type: 'liability' },
];
const equity: Account[] = [
  { id: '13', name: 'Aksjekapital', number: '2000', balance: 100000, type: 'equity' },
  { id: '14', name: 'Annen egenkapital', number: '2050', balance: 7980000, type: 'equity' },
];

const accountGroups: AccountGroup[] = [
  { id: '100', name: 'Eiendeler', accounts: assets, balance: assets.reduce((sum, account) => sum + account.balance, 0) },
  { id: '101', name: 'Gjeld', accounts: liabilities, balance: liabilities.reduce((sum, account) => sum + account.balance, 0) },
  { id: '102', name: 'Egenkapital', accounts: equity, balance: equity.reduce((sum, account) => sum + account.balance, 0) },
];

const AccountSelectionSidebar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const filteredAccountGroups = useMemo(() => {
    if (!searchTerm) {
      return accountGroups;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    return accountGroups.map(group => ({
      ...group,
      accounts: group.accounts.filter(account =>
        account.name.toLowerCase().includes(lowerSearchTerm) ||
        account.number.includes(lowerSearchTerm)
      )
    })).filter(group => group.accounts.length > 0);
  }, [searchTerm]);

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccounts(prev => {
      if (prev.includes(accountId)) {
        return prev.filter(id => id !== accountId);
      } else {
        return [...prev, accountId];
      }
    });
  };

  const isAccountSelected = (accountId: string) => selectedAccounts.includes(accountId);

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>Velg kontoer</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Søk etter kontoer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <ScrollArea className="h-[calc(100vh-250px)] w-full rounded-md border">
          <TreeView>
            {filteredAccountGroups.map(group => (
              <TreeItem key={group.id} value={group.id}>
                <TreeViewTrigger className="font-bold">{group.name} ({formatCurrency(group.balance)})</TreeViewTrigger>
                <TreeViewContent>
                  {group.accounts.map(account => (
                    <TreeItem key={account.id} value={account.id}>
                      <label
                        className="group flex w-full items-center space-x-2 rounded-sm p-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                        htmlFor={account.id}
                      >
                        <Checkbox
                          id={account.id}
                          checked={isAccountSelected(account.id)}
                          onCheckedChange={() => handleAccountSelect(account.id)}
                          className="shrink-0"
                        />
                        <span>{account.name} ({account.number})</span>
                      </label>
                    </TreeItem>
                  ))}
                </TreeViewContent>
              </TreeItem>
            ))}
          </TreeView>
        </ScrollArea>
        <Button variant="outline">Bruk valgte ({selectedAccounts.length})</Button>
      </CardContent>
    </Card>
  );
};

export default AccountSelectionSidebar;
