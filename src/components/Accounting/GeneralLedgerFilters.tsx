import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { AlertCircle, Filter, RotateCcw, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatNorwegianNumber } from '@/utils/fileProcessing';

export interface FilterCriteria {
  excludeOpeningBalance: boolean;
  accountNumberFilter: string;
  excludeAccounts: string[];
  amountRange: { min: number | null; max: number | null };
  descriptionFilter: string;
  dateRange: { start: string; end: string };
  voucherNumberFilter: string;
}

interface FilterStats {
  originalCount: number;
  filteredCount: number;
  removedCount: number;
  originalBalance: number;
  filteredBalance: number;
  balanceChange: number;
}

interface GeneralLedgerFiltersProps {
  data: any[];
  onFilteredDataChange: (filteredData: any[], stats: FilterStats) => void;
  className?: string;
}

export const GeneralLedgerFilters = ({ 
  data, 
  onFilteredDataChange, 
  className = "" 
}: GeneralLedgerFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({
    excludeOpeningBalance: true,
    accountNumberFilter: '',
    excludeAccounts: [],
    amountRange: { min: null, max: null },
    descriptionFilter: '',
    dateRange: { start: '', end: '' },
    voucherNumberFilter: ''
  });

  // Detect opening balance patterns
  const detectOpeningBalance = (transaction: any): boolean => {
    const desc = (transaction.description || '').toLowerCase();
    const voucherNum = (transaction.voucher_number || '').toLowerCase();
    
    // Common Norwegian patterns for opening balance
    const openingPatterns = [
      'inngående',
      'åpning',
      'opening',
      'primosaldo',
      'primo',
      'ib',
      'ingående'
    ];
    
    const hasOpeningPattern = openingPatterns.some(pattern => 
      desc.includes(pattern) || voucherNum.includes(pattern)
    );

    // Check if it's a first-day transaction with high probability of being opening balance
    const transactionDate = new Date(transaction.transaction_date || transaction.date);
    const isFirstDayOfPeriod = transactionDate.getDate() === 1;
    
    return hasOpeningPattern || (isFirstDayOfPeriod && voucherNum.includes('00'));
  };

  // Apply filters to data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Opening balance filter
    if (filters.excludeOpeningBalance) {
      filtered = filtered.filter(t => !detectOpeningBalance(t));
    }

    // Account number filter
    if (filters.accountNumberFilter) {
      const accountFilter = filters.accountNumberFilter.toLowerCase();
      filtered = filtered.filter(t => 
        (t.account_number || '').toString().toLowerCase().includes(accountFilter)
      );
    }

    // Exclude specific accounts
    if (filters.excludeAccounts.length > 0) {
      filtered = filtered.filter(t => 
        !filters.excludeAccounts.includes((t.account_number || '').toString())
      );
    }

    // Amount range filter
    if (filters.amountRange.min !== null || filters.amountRange.max !== null) {
      filtered = filtered.filter(t => {
        const amount = t.balance_amount || 
                     (t.debit_amount && t.debit_amount !== 0 ? t.debit_amount : 0) - 
                     (t.credit_amount && t.credit_amount !== 0 ? t.credit_amount : 0);
        
        const absAmount = Math.abs(amount);
        
        if (filters.amountRange.min !== null && absAmount < filters.amountRange.min) return false;
        if (filters.amountRange.max !== null && absAmount > filters.amountRange.max) return false;
        
        return true;
      });
    }

    // Description filter
    if (filters.descriptionFilter) {
      const descFilter = filters.descriptionFilter.toLowerCase();
      filtered = filtered.filter(t => 
        (t.description || '').toLowerCase().includes(descFilter)
      );
    }

    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(t => {
        const tDate = new Date(t.transaction_date || t.date);
        if (filters.dateRange.start && tDate < new Date(filters.dateRange.start)) return false;
        if (filters.dateRange.end && tDate > new Date(filters.dateRange.end)) return false;
        return true;
      });
    }

    // Voucher number filter
    if (filters.voucherNumberFilter) {
      const voucherFilter = filters.voucherNumberFilter.toLowerCase();
      filtered = filtered.filter(t => 
        (t.voucher_number || '').toString().toLowerCase().includes(voucherFilter)
      );
    }

    return filtered;
  }, [data, filters]);

  // Calculate statistics
  const stats = useMemo((): FilterStats => {
    const originalBalance = data.reduce((sum, t) => {
      return sum + (t.balance_amount || 
        (t.debit_amount || 0) - (t.credit_amount || 0));
    }, 0);
    
    const filteredBalance = filteredData.reduce((sum, t) => {
      return sum + (t.balance_amount || 
        (t.debit_amount || 0) - (t.credit_amount || 0));
    }, 0);

    return {
      originalCount: data.length,
      filteredCount: filteredData.length,
      removedCount: data.length - filteredData.length,
      originalBalance,
      filteredBalance,
      balanceChange: originalBalance - filteredBalance
    };
  }, [data, filteredData]);

  // Update parent component when filtered data changes
  React.useEffect(() => {
    onFilteredDataChange(filteredData, stats);
  }, [filteredData, stats, onFilteredDataChange]);

  const resetFilters = () => {
    setFilters({
      excludeOpeningBalance: true,
      accountNumberFilter: '',
      excludeAccounts: [],
      amountRange: { min: null, max: null },
      descriptionFilter: '',
      dateRange: { start: '', end: '' },
      voucherNumberFilter: ''
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.excludeOpeningBalance) count++;
    if (filters.accountNumberFilter) count++;
    if (filters.excludeAccounts.length > 0) count++;
    if (filters.amountRange.min !== null || filters.amountRange.max !== null) count++;
    if (filters.descriptionFilter) count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.voucherNumberFilter) count++;
    return count;
  }, [filters]);

  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <CardTitle className="text-lg">Avanserte filtre</CardTitle>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary">{activeFiltersCount} aktive</Badge>
                )}
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            <CardDescription>
              Filtrer transaksjoner for bedre analyse og balansering
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Filter Statistics */}
            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <div>
                    <div className="text-sm font-medium">Transaksjoner</div>
                    <div className="text-lg">{stats.filteredCount.toLocaleString('nb-NO')} av {stats.originalCount.toLocaleString('nb-NO')}</div>
                    {stats.removedCount > 0 && (
                      <div className="text-xs text-muted-foreground">
                        -{stats.removedCount.toLocaleString('nb-NO')} filtrert bort
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium">Opprinnelig balanse</div>
                    <div className="text-lg">{formatNorwegianNumber(stats.originalBalance)} kr</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Filtrert balanse</div>
                    <div className="text-lg">{formatNorwegianNumber(stats.filteredBalance)} kr</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Balanse-endring</div>
                    <div className={`text-lg ${Math.abs(stats.balanceChange) < 1 ? 'text-green-600' : 'text-orange-600'}`}>
                      {stats.balanceChange > 0 ? '+' : ''}{formatNorwegianNumber(stats.balanceChange)} kr
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Opening Balance Filter */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="exclude-opening"
                    checked={filters.excludeOpeningBalance}
                    onCheckedChange={(checked) =>
                      setFilters(prev => ({ ...prev, excludeOpeningBalance: checked }))
                    }
                  />
                  <Label htmlFor="exclude-opening">Ekskluder inngående balanse</Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Filtrerer bort transaksjoner som ser ut til å være inngående balanse
                </p>
              </div>

              {/* Account Number Filter */}
              <div className="space-y-2">
                <Label htmlFor="account-filter">Kontonummer filter</Label>
                <Input
                  id="account-filter"
                  placeholder="Søk etter kontonummer..."
                  value={filters.accountNumberFilter}
                  onChange={(e) =>
                    setFilters(prev => ({ ...prev, accountNumberFilter: e.target.value }))
                  }
                />
              </div>

              {/* Amount Range Filter */}
              <div className="space-y-2">
                <Label>Beløpsområde (kr)</Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Min"
                    type="number"
                    value={filters.amountRange.min || ''}
                    onChange={(e) =>
                      setFilters(prev => ({
                        ...prev,
                        amountRange: { ...prev.amountRange, min: e.target.value ? Number(e.target.value) : null }
                      }))
                    }
                  />
                  <Input
                    placeholder="Maks"
                    type="number"
                    value={filters.amountRange.max || ''}
                    onChange={(e) =>
                      setFilters(prev => ({
                        ...prev,
                        amountRange: { ...prev.amountRange, max: e.target.value ? Number(e.target.value) : null }
                      }))
                    }
                  />
                </div>
              </div>

              {/* Description Filter */}
              <div className="space-y-2">
                <Label htmlFor="description-filter">Beskrivelse filter</Label>
                <Input
                  id="description-filter"
                  placeholder="Søk i beskrivelse..."
                  value={filters.descriptionFilter}
                  onChange={(e) =>
                    setFilters(prev => ({ ...prev, descriptionFilter: e.target.value }))
                  }
                />
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <Label>Datotidsrom</Label>
                <div className="flex space-x-2">
                  <Input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) =>
                      setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))
                    }
                  />
                  <Input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) =>
                      setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }))
                    }
                  />
                </div>
              </div>

              {/* Voucher Number Filter */}
              <div className="space-y-2">
                <Label htmlFor="voucher-filter">Bilagsnummer filter</Label>
                <Input
                  id="voucher-filter"
                  placeholder="Søk etter bilagsnummer..."
                  value={filters.voucherNumberFilter}
                  onChange={(e) =>
                    setFilters(prev => ({ ...prev, voucherNumberFilter: e.target.value }))
                  }
                />
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={resetFilters} className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4" />
                <span>Tilbakestill filtre</span>
              </Button>
              
              <div className="text-sm text-muted-foreground">
                {stats.removedCount > 0 ? (
                  <span className="text-orange-600">
                    {stats.removedCount.toLocaleString('nb-NO')} transaksjoner filtrert bort
                  </span>
                ) : (
                  <span className="text-green-600">Ingen transaksjoner filtrert bort</span>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default GeneralLedgerFilters;