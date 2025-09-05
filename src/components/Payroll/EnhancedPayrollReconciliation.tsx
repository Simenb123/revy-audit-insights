import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  BarChart3, 
  Calculator, 
  CheckCircle, 
  Search, 
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import ReconciliationDashboard from './ReconciliationDashboard';
import InteractiveReconciliationPanel from './InteractiveReconciliationPanel';
import DragDropMappingInterface from './DragDropMappingInterface';
import SmartGuidanceSystem from './SmartGuidanceSystem';
import EnhancedSearchAndFilter, { FilterOptions } from './EnhancedSearchAndFilter';
import { AccountListDisplay } from './AccountDisplay';

interface ReconciliationData {
  code: string;
  description: string;
  accounts: string[];
  accountNames?: string[];
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  amelding: number;
  difference: number;
  notes?: string;
}

interface EnhancedPayrollReconciliationProps {
  reconciliationData: ReconciliationData[];
  trialBalanceData?: Array<{
    id: string;
    account_number: string;
    account_name: string;
    closing_balance: number;
  }>;
  internalCodes?: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  isLoading?: boolean;
  onRefresh?: () => void;
  onExport?: () => void;
  onUpdateNotes?: (code: string, notes: string) => void;
  onAcceptDiscrepancy?: (code: string) => void;
  onRejectDiscrepancy?: (code: string) => void;
  onUpdateMapping?: (accountId: string, codeId: string) => void;
  onBulkUpdateMapping?: (mappings: Array<{ accountId: string; codeId: string }>) => void;
}

const EnhancedPayrollReconciliation: React.FC<EnhancedPayrollReconciliationProps> = ({
  reconciliationData,
  trialBalanceData = [],
  internalCodes = [],
  isLoading = false,
  onRefresh,
  onExport,
  onUpdateNotes,
  onAcceptDiscrepancy,
  onRejectDiscrepancy,
  onUpdateMapping,
  onBulkUpdateMapping
}) => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'discrepancies' | 'matches'>('all');
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    accountTypes: [],
    mappingStatus: [],
    discrepancyRange: [0, 100000],
    sortBy: 'account_number',
    sortOrder: 'asc',
    showOnlyProblems: false
  });
  const [completedGuidanceSteps, setCompletedGuidanceSteps] = useState<string[]>([]);
  const [showGuidance, setShowGuidance] = useState(true);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalItems = reconciliationData.length;
    const perfectMatches = reconciliationData.filter(item => Math.abs(item.difference) <= 0.01).length;
    const smallDiscrepancies = reconciliationData.filter(item => 
                            Math.abs(item.difference) > 0.01 && Math.abs(item.difference) <= 5
    ).length;
        const largeDiscrepancies = reconciliationData.filter(item => Math.abs(item.difference) > 5).length;
    
    const totalDiscrepancy = reconciliationData.reduce((sum, item) => sum + Math.abs(item.difference), 0);
    
    const allAccounts = new Set<string>();
    reconciliationData.forEach(item => {
      item.accounts.forEach(account => allAccounts.add(account));
    });
    
    const accountsCovered = reconciliationData.reduce((sum, item) => sum + item.accounts.length, 0);
    const totalAccounts = allAccounts.size;

    return {
      totalItems,
      perfectMatches,
      smallDiscrepancies,
      largeDiscrepancies,
      totalDiscrepancy,
      accountsCovered,
      totalAccounts
    };
  }, [reconciliationData]);

  // Transform trial balance data for mapping interface
  const mappingItems = useMemo(() => {
    return trialBalanceData.map(item => ({
      id: item.id,
      accountNumber: item.account_number,
      accountName: item.account_name,
      amount: item.closing_balance,
      currentMapping: '', // This would come from existing mappings
      suggestedMapping: '', // This would come from AI suggestions
      confidence: 0.8 // This would come from AI confidence scores
    }));
  }, [trialBalanceData]);

  // Account types for filtering
  const accountTypes = useMemo(() => {
    const types = new Map<string, number>();
    trialBalanceData.forEach(item => {
      const type = item.account_number.charAt(0);
      types.set(type, (types.get(type) || 0) + 1);
    });
    
    return Array.from(types.entries()).map(([type, count]) => ({
      value: type,
      label: `${type}xxx kontoer`,
      count
    }));
  }, [trialBalanceData]);

  // Handle guidance system
  const handleStepComplete = (stepId: string) => {
    setCompletedGuidanceSteps(prev => [...prev, stepId]);
  };

  const getCurrentContext = () => {
    switch (selectedTab) {
      case 'mapping': return 'mapping';
      case 'interactive': return 'reconciliation';
      case 'details': return 'review';
      default: return 'mapping';
    }
  };

  // Filter and search logic
  const filteredData = useMemo(() => {
    let filtered = reconciliationData;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.accounts.some(account => account.includes(searchTerm))
      );
    }

    // Apply type filter
    switch (filterType) {
          case 'discrepancies':
                filtered = filtered.filter(item => Math.abs(item.difference) > 5);
                break;
              case 'matches':
                filtered = filtered.filter(item => Math.abs(item.difference) <= 5);
            break;
      default:
        // 'all' - no additional filtering
        break;
    }

    return filtered;
  }, [reconciliationData, searchTerm, filterType]);

  return (
    <div className="space-y-6">
      {/* Smart Guidance System */}
      {showGuidance && (
        <SmartGuidanceSystem
          currentContext={getCurrentContext() as any}
          userLevel="intermediate"
          completedSteps={completedGuidanceSteps}
          onStepComplete={handleStepComplete}
          onDismiss={() => setShowGuidance(false)}
        />
      )}

      {/* Dashboard Overview */}
      <ReconciliationDashboard summary={summary} isLoading={isLoading} />

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Oversikt</TabsTrigger>
            <TabsTrigger value="mapping">Mapping</TabsTrigger>
            <TabsTrigger value="interactive">Interaktiv Avstemming</TabsTrigger>
            <TabsTrigger value="details">Detaljer</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              Oppdater
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
            >
              <Download className="h-4 w-4 mr-1" />
              Eksporter
            </Button>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summary Charts Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Avstemmingsstatus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Perfekte match</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-success/20 rounded-full h-2">
                        <div 
                          className="bg-success h-2 rounded-full" 
                          style={{ width: `${(summary.perfectMatches / summary.totalItems) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{summary.perfectMatches}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Små avvik (≤5kr)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-warning/20 rounded-full h-2">
                        <div 
                          className="bg-warning h-2 rounded-full" 
                          style={{ width: `${(summary.smallDiscrepancies / summary.totalItems) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{summary.smallDiscrepancies}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Store avvik ({'>'}5kr)</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-destructive/20 rounded-full h-2">
                        <div 
                          className="bg-destructive h-2 rounded-full" 
                          style={{ width: `${(summary.largeDiscrepancies / summary.totalItems) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{summary.largeDiscrepancies}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Hurtighandlinger</CardTitle>
                <CardDescription>
                  Vanlige operasjoner for avstemming
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Calculator className="h-4 w-4 mr-2" />
                  Kjør automatisk avstemming
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Godkjenn alle små avvik
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Last ned avstemmingsrapport
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mapping Tab */}
        <TabsContent value="mapping" className="space-y-4">
          <EnhancedSearchAndFilter
            filters={filters}
            onFiltersChange={setFilters}
            accountTypes={accountTypes}
            totalRecords={mappingItems.length}
            filteredRecords={mappingItems.length} // TODO: Apply actual filtering
          />
          
          <DragDropMappingInterface
            accounts={mappingItems}
            internalCodes={internalCodes}
            onUpdateMapping={onUpdateMapping || (() => {})}
            onBulkUpdate={onBulkUpdateMapping || (() => {})}
            searchTerm={filters.searchTerm}
            onSearchChange={(term) => setFilters(prev => ({ ...prev, searchTerm: term }))}
          />
        </TabsContent>

        {/* Interactive Reconciliation Tab */}
        <TabsContent value="interactive" className="space-y-4">
          {/* Search and Filter Controls */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="search" className="text-sm font-medium">
                    Søk i avstemmingsposter
                  </Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Søk etter kode, beskrivelse eller konto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="sm:w-48">
                  <Label htmlFor="filter" className="text-sm font-medium">
                    Filtrer etter
                  </Label>
                  <div className="relative mt-1">
                    <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      id="filter"
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="all">Alle poster</option>
                      <option value="discrepancies">Kun avvik</option>
                      <option value="matches">Kun match</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Panel */}
          <InteractiveReconciliationPanel
            items={filteredData}
            onUpdateNotes={onUpdateNotes}
            onAcceptDiscrepancy={onAcceptDiscrepancy}
            onRejectDiscrepancy={onRejectDiscrepancy}
          />
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detaljert Avstemmingstabell</CardTitle>
              <CardDescription>
                Tradisjonell tabellvisning med alle avstemmingsdetaljer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Kode</th>
                      <th className="text-left p-2">Beskrivelse</th>
                      <th className="text-left p-2">Kontoer</th>
                      <th className="text-right p-2">A (P&L)</th>
                      <th className="text-right p-2">B (Neg.avs.)</th>
                      <th className="text-right p-2">C (Pos.avs.)</th>
                      <th className="text-right p-2">D (A+B-C)</th>
                      <th className="text-right p-2">A-melding</th>
                      <th className="text-right p-2">Avvik</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((row) => (
                      <tr key={row.code} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-mono text-xs">{row.code}</td>
                        <td className="p-2">{row.description}</td>
                        <td className="p-2">
                          <AccountListDisplay 
                            accounts={row.accounts.map((acc, idx) => ({
                              number: acc,
                              name: row.accountNames?.[idx]
                            }))}
                            variant="compact"
                            maxDisplay={2}
                          />
                        </td>
                        <td className="p-2 text-right font-mono text-xs">
                          {row.A.toLocaleString('nb-NO')}
                        </td>
                        <td className="p-2 text-right font-mono text-xs">
                          {row.B.toLocaleString('nb-NO')}
                        </td>
                        <td className="p-2 text-right font-mono text-xs">
                          {row.C.toLocaleString('nb-NO')}
                        </td>
                        <td className="p-2 text-right font-mono text-xs font-medium">
                          {row.D.toLocaleString('nb-NO')}
                        </td>
                        <td className="p-2 text-right font-mono text-xs">
                          {row.amelding.toLocaleString('nb-NO')}
                        </td>
                        <td className="p-2 text-right">
                <span className={`font-mono text-xs px-2 py-1 rounded ${
                  Math.abs(row.difference) <= 5 
                    ? 'bg-success/20 text-success' 
                    : 'bg-destructive/20 text-destructive'
                }`}>
                            {row.difference.toLocaleString('nb-NO')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedPayrollReconciliation;