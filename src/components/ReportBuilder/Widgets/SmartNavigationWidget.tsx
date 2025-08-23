import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Navigation, 
  Zap, 
  Target, 
  TrendingUp, 
  AlertCircle,
  Clock,
  ChevronRight
} from 'lucide-react';
import { useTrialBalanceData } from '@/hooks/useTrialBalanceData';
import { useGeneralLedgerData } from '@/hooks/useGeneralLedgerData';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { Widget } from '@/contexts/WidgetManagerContext';
import { getBalanceCategory, getBalanceCategoryLabel } from '@/utils/standardAccountCategory';

interface SmartNavigationWidgetProps {
  widget: Widget;
  onNavigate?: (target: NavigationTarget) => void;
}

interface NavigationTarget {
  type: 'account' | 'category' | 'transaction';
  id: string;
  label: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  target: NavigationTarget;
}

interface AccountSuggestion {
  accountNumber: string;
  accountName: string;
  balance: number;
  transactionCount: number;
  category: string;
}

export function SmartNavigationWidget({ widget, onNavigate }: SmartNavigationWidgetProps) {
  const { selectedFiscalYear } = useFiscalYear();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'search' | 'quick' | 'recent'>('search');

  const clientId = widget.config?.clientId || '';
  
  const { data: trialBalanceData = [] } = useTrialBalanceData(clientId, undefined, selectedFiscalYear);
  const { data: transactionData = [] } = useGeneralLedgerData(clientId, undefined, { page: 1, pageSize: 10000 });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nb-NO', { 
      style: 'currency', 
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Search suggestions based on accounts
  const searchSuggestions = useMemo((): AccountSuggestion[] => {
    if (!searchQuery || searchQuery.length < 2) return [];

    const query = searchQuery.toLowerCase();
    
    return trialBalanceData
      .filter(entry => {
        const accountNumber = entry.account_number.toLowerCase();
        const accountName = (entry.account_name || '').toLowerCase();
        return accountNumber.includes(query) || accountName.includes(query);
      })
      .map(entry => {
        const accountNumber = parseInt(entry.account_number);
        const transactionCount = transactionData.filter(tx => 
          tx.account_number === entry.account_number
        ).length;

        return {
          accountNumber: entry.account_number,
          accountName: entry.account_name || 'Ukjent konto',
          balance: entry.closing_balance || 0,
          transactionCount,
          category: isNaN(accountNumber) ? 'UK' : getBalanceCategory(accountNumber)
        };
      })
      .sort((a, b) => {
        // Prioritize exact matches, then by transaction count
        const aExact = a.accountNumber.toLowerCase().startsWith(searchQuery.toLowerCase());
        const bExact = b.accountNumber.toLowerCase().startsWith(searchQuery.toLowerCase());
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        return b.transactionCount - a.transactionCount;
      })
      .slice(0, 8);
  }, [searchQuery, trialBalanceData, transactionData]);

  // Quick actions for common navigation patterns
  const quickActions = useMemo((): QuickAction[] => {
    const totalTransactions = transactionData.length;
    const totalAccounts = trialBalanceData.length;
    
    // Find accounts with high activity
    const accountActivity = new Map<string, number>();
    transactionData.forEach(tx => {
      const count = accountActivity.get(tx.account_number || '') || 0;
      accountActivity.set(tx.account_number || '', count + 1);
    });

    const topAccounts = Array.from(accountActivity.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    const actions: QuickAction[] = [
      {
        id: 'revenue-accounts',
        label: 'Salgsinntekter (3000-3999)',
        description: 'Vis alle salgsinntekter',
        icon: TrendingUp,
        target: {
          type: 'category',
          id: 'revenue',
          label: 'Salgsinntekter',
          metadata: { accountRange: [3000, 3999] }
        }
      },
      {
        id: 'expense-accounts',
        label: 'Driftskostnader (4000-7999)',
        description: 'Vis alle driftskostnader',
        icon: Target,
        target: {
          type: 'category',
          id: 'expenses',
          label: 'Driftskostnader',
          metadata: { accountRange: [4000, 7999] }
        }
      },
      {
        id: 'high-activity',
        label: 'Høy aktivitet',
        description: `${topAccounts.length} kontoer med flest transaksjoner`,
        icon: Zap,
        target: {
          type: 'category',
          id: 'high-activity',
          label: 'Høy aktivitet',
          metadata: { accounts: topAccounts.map(([acc]) => acc) }
        }
      }
    ];

    // Add specific account quick actions for top accounts
    topAccounts.slice(0, 2).forEach(([accountNumber, count], index) => {
      const accountData = trialBalanceData.find(tb => tb.account_number === accountNumber);
      if (accountData) {
        actions.push({
          id: `account-${accountNumber}`,
          label: `${accountNumber} - ${(accountData.account_name || '').substring(0, 20)}`,
          description: `${count} transaksjoner`,
          icon: Target,
          target: {
            type: 'account',
            id: accountNumber,
            label: `${accountNumber} - ${accountData.account_name}`,
            metadata: { transactionCount: count }
          }
        });
      }
    });

    return actions;
  }, [trialBalanceData, transactionData]);

  // Recent navigation (would typically come from localStorage or context)
  const recentNavigations = useMemo((): NavigationTarget[] => {
    // Mock recent navigation data
    return [
      {
        type: 'account',
        id: '3000',
        label: '3000 - Salg, høy sats',
        description: 'Besøkt for 10 minutter siden'
      },
      {
        type: 'category',
        id: 'AM',
        label: 'Anleggsmidler',
        description: 'Besøkt i dag'
      },
      {
        type: 'account',
        id: '4000',
        label: '4000 - Varekostnader',
        description: 'Besøkt i går'
      }
    ];
  }, []);

  const handleNavigate = (target: NavigationTarget) => {
    if (onNavigate) {
      onNavigate(target);
    }
    // Also store in recent navigation (localStorage etc.)
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSuggestions.length > 0) {
      const first = searchSuggestions[0];
      handleNavigate({
        type: 'account',
        id: first.accountNumber,
        label: `${first.accountNumber} - ${first.accountName}`,
        metadata: { balance: first.balance, transactionCount: first.transactionCount }
      });
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="h-5 w-5" />
          Smart navigasjon
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Søk</TabsTrigger>
            <TabsTrigger value="quick">Hurtigval</TabsTrigger>
            <TabsTrigger value="recent">Nylig</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk etter konto eller kontonavn..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            <div className="space-y-2">
              {searchSuggestions.map((suggestion) => (
                <Button
                  key={suggestion.accountNumber}
                  variant="ghost"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => handleNavigate({
                    type: 'account',
                    id: suggestion.accountNumber,
                    label: `${suggestion.accountNumber} - ${suggestion.accountName}`,
                    metadata: { 
                      balance: suggestion.balance, 
                      transactionCount: suggestion.transactionCount 
                    }
                  })}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="text-left">
                      <div className="font-medium">
                        {suggestion.accountNumber} - {suggestion.accountName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getBalanceCategoryLabel(suggestion.category as any)} • 
                        {suggestion.transactionCount} transaksjoner
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatCurrency(suggestion.balance)}
                      </div>
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </Button>
              ))}

              {searchQuery.length >= 2 && searchSuggestions.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Ingen kontoer funnet for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="quick" className="space-y-2">
            {quickActions.map((action) => (
              <Button
                key={action.id}
                variant="ghost"
                className="w-full justify-start h-auto p-3"
                onClick={() => handleNavigate(action.target)}
              >
                <div className="flex items-center gap-3 w-full">
                  <action.icon className="h-5 w-5 text-primary" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{action.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Button>
            ))}
          </TabsContent>

          <TabsContent value="recent" className="space-y-2">
            {recentNavigations.map((nav, index) => (
              <Button
                key={`${nav.type}-${nav.id}-${index}`}
                variant="ghost"
                className="w-full justify-start h-auto p-3"
                onClick={() => handleNavigate(nav)}
              >
                <div className="flex items-center gap-3 w-full">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{nav.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {nav.description}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </Button>
            ))}

            {recentNavigations.length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2" />
                <p>Ingen nylig navigasjon</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}