import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Search, Filter, Eye, EyeOff } from 'lucide-react';
import { PopulationAccount } from '@/hooks/usePopulationCalculator';

interface TrialBalanceExclusionManagerProps {
  accounts: PopulationAccount[];
  excludedAccountNumbers: string[];
  onExcludedAccountNumbersChange: (numbers: string[]) => void;
  isLoading?: boolean;
}

const TrialBalanceExclusionManager: React.FC<TrialBalanceExclusionManagerProps> = ({
  accounts,
  excludedAccountNumbers,
  onExcludedAccountNumbersChange,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyExcluded, setShowOnlyExcluded] = useState(false);

  const filteredAccounts = useMemo(() => {
    let filtered = accounts;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(account => 
        account.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        account.account_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply exclusion filter
    if (showOnlyExcluded) {
      filtered = filtered.filter(account => 
        excludedAccountNumbers.includes(account.account_number)
      );
    }

    return filtered.sort((a, b) => a.account_number.localeCompare(b.account_number));
  }, [accounts, searchTerm, showOnlyExcluded, excludedAccountNumbers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleAccountToggle = (accountNumber: string) => {
    const isExcluded = excludedAccountNumbers.includes(accountNumber);
    if (isExcluded) {
      onExcludedAccountNumbersChange(excludedAccountNumbers.filter(n => n !== accountNumber));
    } else {
      onExcludedAccountNumbersChange([...excludedAccountNumbers, accountNumber]);
    }
  };

  const handleSelectAll = () => {
    const allAccountNumbers = filteredAccounts.map(acc => acc.account_number);
    const newExcluded = [...new Set([...excludedAccountNumbers, ...allAccountNumbers])];
    onExcludedAccountNumbersChange(newExcluded);
  };

  const handleDeselectAll = () => {
    const filteredAccountNumbers = filteredAccounts.map(acc => acc.account_number);
    const newExcluded = excludedAccountNumbers.filter(n => !filteredAccountNumbers.includes(n));
    onExcludedAccountNumbersChange(newExcluded);
  };

  const handleClearAllExclusions = () => {
    onExcludedAccountNumbersChange([]);
  };

  // Calculate impact statistics
  const includedAccounts = accounts.filter(acc => !excludedAccountNumbers.includes(acc.account_number));
  const excludedAccounts = accounts.filter(acc => excludedAccountNumbers.includes(acc.account_number));
  const includedSum = includedAccounts.reduce((sum, acc) => sum + Math.abs(acc.closing_balance), 0);
  const excludedSum = excludedAccounts.reduce((sum, acc) => sum + Math.abs(acc.closing_balance), 0);
  const totalSum = includedSum + excludedSum;

  if (accounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Kontoekskludering
          </CardTitle>
          <CardDescription>
            Velg først regnskapslinjer for å se tilgjengelige kontoer
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Kontoekskludering
        </CardTitle>
        <CardDescription>
          Ekskluder spesifikke kontoer fra populasjonen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Impact Summary */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-muted rounded-lg">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Inkludert</div>
            <div className="font-semibold">{includedAccounts.length} kontoer</div>
            <div className="text-sm">{formatCurrency(includedSum)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Ekskludert</div>
            <div className="font-semibold text-muted-foreground">{excludedAccounts.length} kontoer</div>
            <div className="text-sm text-muted-foreground">{formatCurrency(excludedSum)}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Dekning</div>
            <div className="font-semibold">
              {totalSum > 0 ? ((includedSum / totalSum) * 100).toFixed(1) : 0}%
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Søk etter kontonummer eller navn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={showOnlyExcluded ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowOnlyExcluded(!showOnlyExcluded)}
          >
            {showOnlyExcluded ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showOnlyExcluded ? 'Alle' : 'Kun eksklud.'}
          </Button>
        </div>

        {/* Batch Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            Velg alle ({filteredAccounts.length})
          </Button>
          <Button variant="outline" size="sm" onClick={handleDeselectAll}>
            Fjern valgte
          </Button>
          {excludedAccountNumbers.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAllExclusions}>
              Nullstill alle
            </Button>
          )}
        </div>

        <Separator />

        {/* Accounts List */}
        <div>
          <div className="text-sm font-medium mb-2">
            Kontoer ({filteredAccounts.length} av {accounts.length})
          </div>
          
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Laster kontoer...
            </div>
          ) : (
            <ScrollArea className="h-64 border rounded-md">
              <div className="p-2 space-y-2">
                {filteredAccounts.map((account) => {
                  const isExcluded = excludedAccountNumbers.includes(account.account_number);
                  
                  return (
                    <div
                      key={account.id}
                      className={`flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 ${
                        isExcluded ? 'bg-muted/30 opacity-60' : ''
                      }`}
                    >
                      <Checkbox
                        checked={isExcluded}
                        onCheckedChange={() => handleAccountToggle(account.account_number)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">
                            {account.account_number}
                          </span>
                          <span className="text-sm truncate">
                            {account.account_name}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatCurrency(Math.abs(account.closing_balance))}
                        </div>
                        {isExcluded && (
                          <Badge variant="secondary" className="text-xs">
                            Ekskludert
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {filteredAccounts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm || showOnlyExcluded 
                      ? 'Ingen kontoer matcher filteret' 
                      : 'Ingen kontoer tilgjengelig'}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialBalanceExclusionManager;