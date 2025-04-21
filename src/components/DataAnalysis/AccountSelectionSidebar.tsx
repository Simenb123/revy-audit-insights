
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Briefcase, BarChart, CreditCard, Building2, X } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Account, AccountGroup } from '@/types/revio';

// Mock account data
const incomeAccounts: Account[] = [
  { id: '3000', number: '3000', name: 'Salgsinntekt, avgiftspliktig', balance: 1430000, type: 'income', groupId: 'income' },
  { id: '3100', number: '3100', name: 'Salgsinntekt, avgiftsfri', balance: 245000, type: 'income', groupId: 'income' },
];

const expenseAccounts: Account[] = [
  { id: '4300', number: '4300', name: 'Innkjøp varer', balance: -545000, type: 'expense', groupId: 'expenses' },
  { id: '5000', number: '5000', name: 'Lønn', balance: -1215000, type: 'expense', groupId: 'expenses' },
  { id: '5400', number: '5400', name: 'Arbeidsgiveravgift', balance: -171315, type: 'expense', groupId: 'expenses' },
  { id: '6300', number: '6300', name: 'Leie lokaler', balance: -570000, type: 'expense', groupId: 'expenses' },
  { id: '6340', number: '6340', name: 'Lys og varme', balance: -87500, type: 'expense', groupId: 'expenses' },
  { id: '6500', number: '6500', name: 'Kontorutstyr', balance: -94300, type: 'expense', groupId: 'expenses' },
  { id: '6700', number: '6700', name: 'Revisjonshonorar', balance: -48000, type: 'expense', groupId: 'expenses' },
];

const assetAccounts: Account[] = [
  { id: '1500', number: '1500', name: 'Kundefordringer', balance: 695000, type: 'asset', groupId: 'assets' },
  { id: '1920', number: '1920', name: 'Driftskonto', balance: 853000, type: 'asset', groupId: 'assets' },
  { id: '1950', number: '1950', name: 'Skattetrekkskonto', balance: 136000, type: 'asset', groupId: 'assets' },
];

const liabilityAccounts: Account[] = [
  { id: '2400', number: '2400', name: 'Leverandørgjeld', balance: -410000, type: 'liability', groupId: 'liabilities' },
  { id: '2600', number: '2600', name: 'Skattetrekk', balance: -136000, type: 'liability', groupId: 'liabilities' },
];

// Group accounts
const accountGroups: AccountGroup[] = [
  { 
    id: 'income', 
    name: 'Inntekter', 
    accounts: incomeAccounts,
    balance: incomeAccounts.reduce((sum, acc) => sum + acc.balance, 0)
  },
  { 
    id: 'expenses', 
    name: 'Kostnader', 
    accounts: expenseAccounts,
    balance: expenseAccounts.reduce((sum, acc) => sum + acc.balance, 0)
  },
  { 
    id: 'assets', 
    name: 'Eiendeler', 
    accounts: assetAccounts,
    balance: assetAccounts.reduce((sum, acc) => sum + acc.balance, 0)
  },
  { 
    id: 'liabilities', 
    name: 'Gjeld', 
    accounts: liabilityAccounts,
    balance: liabilityAccounts.reduce((sum, acc) => sum + acc.balance, 0)
  },
];

interface AccountSelectionSidebarProps {
  onAccountSelect: (account: Account | null) => void;
  onAccountGroupSelect: (group: AccountGroup | null) => void;
  onMultiSelect: (accounts: Account[]) => void;
  selectedAccount: Account | null;
  selectedAccountGroup: AccountGroup | null;
  selectedAccounts: Account[];
  side?: 'left' | 'right';
}

const AccountSelectionSidebar = ({ 
  onAccountSelect, 
  onAccountGroupSelect,
  onMultiSelect,
  selectedAccount,
  selectedAccountGroup,
  selectedAccounts,
  side = 'left',
}: AccountSelectionSidebarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMultiSelectDialogOpen, setIsMultiSelectDialogOpen] = useState(false);
  const [dialogSelectedAccounts, setDialogSelectedAccounts] = useState<Account[]>(selectedAccounts || []);
  
  const allAccounts = [...incomeAccounts, ...expenseAccounts, ...assetAccounts, ...liabilityAccounts];
  
  // Filter accounts based on search term
  const filteredAccounts = searchTerm.trim() === '' 
    ? allAccounts 
    : allAccounts.filter(account => 
        account.number.includes(searchTerm) || 
        account.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  
  const toggleAccount = (account: Account) => {
    setDialogSelectedAccounts(prev => {
      const isSelected = prev.some(a => a.id === account.id);
      if (isSelected) {
        return prev.filter(a => a.id !== account.id);
      } else {
        return [...prev, account];
      }
    });
  };
  
  const formatBalance = (balance: number) => {
    return new Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK' }).format(balance);
  };
  
  const handleSelectGroup = (group: AccountGroup) => {
    if (selectedAccountGroup?.id === group.id) {
      onAccountGroupSelect(null);
    } else {
      onAccountGroupSelect(group);
      if (selectedAccount) {
        onAccountSelect(null);
      }
    }
  };
  
  const handleSelectAccount = (account: Account) => {
    if (selectedAccount?.id === account.id) {
      onAccountSelect(null);
    } else {
      onAccountSelect(account);
    }
  };
  
  const openMultiSelectDialog = () => {
    setDialogSelectedAccounts(selectedAccounts || []);
    setIsMultiSelectDialogOpen(true);
  };
  
  const applyMultiSelection = () => {
    onMultiSelect(dialogSelectedAccounts);
    setIsMultiSelectDialogOpen(false);
  };
  
  return (
    <>
      <div className={`w-80 border-r p-0 ${side === 'right' ? 'border-l border-r-0' : ''}`} data-side={side}>
        <div className="border-b p-4">
          <h2 className="text-lg font-medium">Kontoplan</h2>
          <p className="text-sm text-muted-foreground">Velg konto for utvalg</p>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Søk konto..."
              className="pl-9 pr-9"
            />
            {searchTerm && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button 
            variant="outline" 
            className="w-full mt-2 gap-2 justify-start"
            onClick={openMultiSelectDialog}
          >
            <Plus size={16} />
            <span>Multiutvalg ({selectedAccounts.length || 0})</span>
            {selectedAccounts.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {selectedAccounts.length}
              </Badge>
            )}
          </Button>
        </div>
        
        <ScrollArea className="h-[calc(100vh-13.5rem)]">
          <div>
            {searchTerm ? (
              <div className="py-2">
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  Søkeresultater ({filteredAccounts.length})
                </div>
                {filteredAccounts.map(account => (
                  <li
                    key={account.id}
                    className={`px-4 py-2 hover:bg-muted cursor-pointer ${selectedAccount?.id === account.id ? 'bg-muted' : ''}`}
                    onClick={() => handleSelectAccount(account)}
                  >
                    <div className="flex justify-between w-full items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{account.number}</span>
                        <span>{account.name}</span>
                      </div>
                      <span className={account.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatBalance(account.balance)}
                      </span>
                    </div>
                  </li>
                ))}
                {filteredAccounts.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Ingen kontoer matcher søket
                  </div>
                )}
              </div>
            ) : (
              <>
                <div>
                  <li 
                    className={`px-4 py-2 hover:bg-muted cursor-pointer ${selectedAccountGroup?.id === 'income' ? 'bg-muted' : ''}`}
                    onClick={() => handleSelectGroup(accountGroups[0])}
                  >
                    <div className="flex items-center gap-2">
                      <BarChart size={16} />
                      <div className="flex justify-between w-full">
                        <span>Inntekter</span>
                        <span className="text-green-600">{formatBalance(accountGroups[0].balance)}</span>
                      </div>
                    </div>
                  </li>
                  
                  <div className="pl-6">
                    {incomeAccounts.map(account => (
                      <li
                        key={account.id}
                        className={`px-4 py-1 hover:bg-muted cursor-pointer ${selectedAccount?.id === account.id ? 'bg-muted' : ''}`}
                        onClick={() => handleSelectAccount(account)}
                      >
                        <div className="flex justify-between w-full">
                          <div>
                            <span className="font-mono text-xs">{account.number}</span> {account.name}
                          </div>
                          <span className="text-green-600">{formatBalance(account.balance)}</span>
                        </div>
                      </li>
                    ))}
                  </div>
                </div>
                
                <div>
                  <li 
                    className={`px-4 py-2 hover:bg-muted cursor-pointer ${selectedAccountGroup?.id === 'expenses' ? 'bg-muted' : ''}`}
                    onClick={() => handleSelectGroup(accountGroups[1])}
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase size={16} />
                      <div className="flex justify-between w-full">
                        <span>Kostnader</span>
                        <span className="text-red-600">{formatBalance(accountGroups[1].balance)}</span>
                      </div>
                    </div>
                  </li>
                  
                  <div className="pl-6">
                    {expenseAccounts.map(account => (
                      <li
                        key={account.id}
                        className={`px-4 py-1 hover:bg-muted cursor-pointer ${selectedAccount?.id === account.id ? 'bg-muted' : ''}`}
                        onClick={() => handleSelectAccount(account)}
                      >
                        <div className="flex justify-between w-full">
                          <div>
                            <span className="font-mono text-xs">{account.number}</span> {account.name}
                          </div>
                          <span className="text-red-600">{formatBalance(account.balance)}</span>
                        </div>
                      </li>
                    ))}
                  </div>
                </div>
                
                <div>
                  <li 
                    className={`px-4 py-2 hover:bg-muted cursor-pointer ${selectedAccountGroup?.id === 'assets' ? 'bg-muted' : ''}`}
                    onClick={() => handleSelectGroup(accountGroups[2])}
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} />
                      <div className="flex justify-between w-full">
                        <span>Eiendeler</span>
                        <span className="text-green-600">{formatBalance(accountGroups[2].balance)}</span>
                      </div>
                    </div>
                  </li>
                  
                  <div className="pl-6">
                    {assetAccounts.map(account => (
                      <li
                        key={account.id}
                        className={`px-4 py-1 hover:bg-muted cursor-pointer ${selectedAccount?.id === account.id ? 'bg-muted' : ''}`}
                        onClick={() => handleSelectAccount(account)}
                      >
                        <div className="flex justify-between w-full">
                          <div>
                            <span className="font-mono text-xs">{account.number}</span> {account.name}
                          </div>
                          <span className="text-green-600">{formatBalance(account.balance)}</span>
                        </div>
                      </li>
                    ))}
                  </div>
                </div>
                
                <div>
                  <li 
                    className={`px-4 py-2 hover:bg-muted cursor-pointer ${selectedAccountGroup?.id === 'liabilities' ? 'bg-muted' : ''}`}
                    onClick={() => handleSelectGroup(accountGroups[3])}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 size={16} />
                      <div className="flex justify-between w-full">
                        <span>Gjeld</span>
                        <span className="text-red-600">{formatBalance(accountGroups[3].balance)}</span>
                      </div>
                    </div>
                  </li>
                  
                  <div className="pl-6">
                    {liabilityAccounts.map(account => (
                      <li
                        key={account.id}
                        className={`px-4 py-1 hover:bg-muted cursor-pointer ${selectedAccount?.id === account.id ? 'bg-muted' : ''}`}
                        onClick={() => handleSelectAccount(account)}
                      >
                        <div className="flex justify-between w-full">
                          <div>
                            <span className="font-mono text-xs">{account.number}</span> {account.name}
                          </div>
                          <span className="text-red-600">{formatBalance(account.balance)}</span>
                        </div>
                      </li>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground">
            {selectedAccount ? (
              <div>
                <div className="font-medium">Valgt konto:</div>
                <div className="mt-1">
                  <span className="font-mono">{selectedAccount.number}</span> {selectedAccount.name}
                </div>
              </div>
            ) : selectedAccountGroup ? (
              <div>
                <div className="font-medium">Valgt gruppe:</div>
                <div className="mt-1">
                  {selectedAccountGroup.name} ({selectedAccountGroup.accounts.length} kontoer)
                </div>
                <div className="mt-1 font-medium">
                  Sum: {formatBalance(selectedAccountGroup.balance)}
                </div>
              </div>
            ) : selectedAccounts.length > 0 ? (
              <div>
                <div className="font-medium">Multiutvalg:</div>
                <div className="mt-1">
                  {selectedAccounts.length} kontoer valgt
                </div>
                <div className="mt-1 font-medium">
                  Sum: {formatBalance(selectedAccounts.reduce((sum, acc) => sum + acc.balance, 0))}
                </div>
              </div>
            ) : (
              <div>Velg en konto eller kontogruppe for å se detaljer</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Multi-select dialog */}
      <Dialog open={isMultiSelectDialogOpen} onOpenChange={setIsMultiSelectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Velg flere kontoer</DialogTitle>
            <DialogDescription>
              Velg flere kontoer for å analysere dem samlet
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            <Input
              placeholder="Søk..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-4"
            />
            
            <ScrollArea className="h-[300px] border rounded-md p-2">
              {filteredAccounts.map(account => (
                <div key={account.id} className="flex items-center space-x-2 py-2 px-1 hover:bg-muted/50 rounded">
                  <Checkbox
                    id={`account-${account.id}`}
                    checked={dialogSelectedAccounts.some(a => a.id === account.id)}
                    onCheckedChange={() => toggleAccount(account)}
                  />
                  <label
                    htmlFor={`account-${account.id}`}
                    className="flex justify-between w-full text-sm cursor-pointer"
                  >
                    <div>
                      <span className="font-mono">{account.number}</span> {account.name}
                    </div>
                    <span className={account.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatBalance(account.balance)}
                    </span>
                  </label>
                </div>
              ))}
              
              {filteredAccounts.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Ingen kontoer matcher søket
                </div>
              )}
            </ScrollArea>
            
            {dialogSelectedAccounts.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <div className="text-sm font-medium">
                  {dialogSelectedAccounts.length} konto{dialogSelectedAccounts.length !== 1 ? 'er' : ''} valgt
                </div>
                <div className="text-sm mt-1">
                  Sum: {formatBalance(dialogSelectedAccounts.reduce((sum, acc) => sum + acc.balance, 0))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsMultiSelectDialogOpen(false)}
            >
              Avbryt
            </Button>
            <Button 
              onClick={applyMultiSelection}
              disabled={dialogSelectedAccounts.length === 0}
            >
              Velg ({dialogSelectedAccounts.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AccountSelectionSidebar;
