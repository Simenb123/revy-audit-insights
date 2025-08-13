import React from 'react';
import { Widget, useWidgetManager } from '@/contexts/WidgetManagerContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { InlineEditableTitle } from '../InlineEditableTitle';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Filter, ChevronDown, ChevronRight } from 'lucide-react';
import { useTrialBalanceWithMappings } from '@/hooks/useTrialBalanceWithMappings';
import { useGeneralLedgerData } from '@/hooks/useGeneralLedgerData';
import { useBudgetAnalytics } from '@/hooks/useBudgetAnalytics';
import { useFilteredData } from '@/hooks/useFilteredData';
import { useFilters } from '@/contexts/FilterContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

interface TableWidgetProps {
  widget: Widget;
}

export function TableWidget({ widget }: TableWidgetProps) {
  const { selectedFiscalYear } = useFiscalYear();
  const { updateWidget, clientId: contextClientId, year } = useWidgetManager();
  const { filters, setCrossFilter, clearCrossFilter } = useFilters();
  const clientId = widget.config?.clientId || contextClientId;
  const periodYear = widget.config?.period_year || selectedFiscalYear || year;
  const dataSource = widget.config?.dataSource || 'trial_balance';

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };
  const maxRows = widget.config?.maxRows || 10;
  const sortBy = widget.config?.sortBy || 'balance';
  const showPercentage = widget.config?.showPercentage !== false;
  const drillPath: string[] = widget.config?.drillPath || ['standard_name', 'account'];
  const groupField = drillPath[0];
  const groupByCategory = widget.config?.groupByCategory !== false && !!groupField;
  const classificationFilter = widget.config?.filterByClassification;
  const enableCrossFilter = widget.config?.enableCrossFilter !== false;
  
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());
  
  const { data: trialBalanceData, isLoading: tbLoading } = useTrialBalanceWithMappings(
    clientId,
    periodYear,
    widget.config?.selectedVersion
  );
  const { data: transactionsData, isLoading: txLoading } = useGeneralLedgerData(
    clientId || '',
    widget.config?.selectedVersion
  );
  const { data: budgetData, isLoading: budgetLoading } = useBudgetAnalytics(
    clientId,
    periodYear
  );

  let rawEntries: any[] = [];
  let isLoading = false;

  if (dataSource === 'transactions') {
    isLoading = txLoading;
    rawEntries = (transactionsData || []).map(t => ({
      account_number: t.account_number,
      account_name: t.account_name,
      closing_balance: (t.debit_amount || 0) - (t.credit_amount || 0),
      ...t,
    }));
  } else if (dataSource === 'budget') {
    isLoading = budgetLoading;
    const dimension = (widget.config?.dimension as 'member' | 'team') || 'member';
    const items = dimension === 'team' ? budgetData?.byTeam : budgetData?.byUser;
    rawEntries = (items || []).map((r: any) => ({
      account_number: r.teamId || r.userId,
      account_name: r.name,
      closing_balance: r.hours,
      balance: r.hours,
    }));
  } else {
    isLoading = tbLoading;
    rawEntries = trialBalanceData?.trialBalanceEntries || [];
  }

  // Apply global filters to source entries
  const filteredTrialBalanceEntries = useFilteredData(rawEntries);

  const getFieldValue = React.useCallback((entry: any, field: string) => {
    switch (field) {
      case 'account':
      case 'account_number':
        return `${entry.account_number} - ${entry.account_name}`;
      case 'standard_name':
        return entry.standard_name || 'Ikke klassifisert';
      case 'standard_category':
        return entry.standard_category || 'Ikke klassifisert';
      default:
        return entry[field] || 'Ikke klassifisert';
    }
  }, []);

  const { groupedData, categories, totalBalance } = React.useMemo(() => {
    if (!filteredTrialBalanceEntries || filteredTrialBalanceEntries.length === 0) {
      return { groupedData: {}, categories: [], totalBalance: 0 };
    }

    let filteredEntries = [...filteredTrialBalanceEntries]
      .filter(entry => Math.abs(entry.closing_balance) > 0);

    // Filter by classification if configured
    if (classificationFilter) {
      filteredEntries = filteredEntries.filter(entry =>
        entry.standard_account_type === classificationFilter ||
        entry.standard_category === classificationFilter
      );
    }

    // Filter by selected category
    if (selectedCategory !== 'all') {
      filteredEntries = filteredEntries.filter(entry => {
        const val = getFieldValue(entry, groupField);
        return selectedCategory === val ||
          (selectedCategory === 'unmapped' && val === 'Ikke klassifisert');
      });
    }

    // Group by configured field
    const grouped: Record<string, any[]> = {};
    const categorySet = new Set<string>();

    filteredEntries.forEach(entry => {
      const category = getFieldValue(entry, groupField);
      categorySet.add(category);

      if (!grouped[category]) {
        grouped[category] = [];
      }

      grouped[category].push({
        ...entry,
        account: `${entry.account_number} - ${entry.account_name}`,
        balance: entry.closing_balance,
        formattedBalance: new Intl.NumberFormat('no-NO').format(entry.closing_balance)
      });
    });

    // Sort entries within each category
    Object.keys(grouped).forEach(category => {
      switch (sortBy) {
        case 'name':
          grouped[category].sort((a, b) => a.account_name.localeCompare(b.account_name));
          break;
        case 'number':
          grouped[category].sort((a, b) => a.account_number.localeCompare(b.account_number));
          break;
        case 'balance':
        default:
          grouped[category].sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));
          break;
      }
    });

    const total = filteredEntries.reduce((sum, entry) => sum + Math.abs(entry.closing_balance), 0);
    const cats = Array.from(categorySet).sort();

    return { 
      groupedData: grouped, 
      categories: cats, 
      totalBalance: total 
    };
  }, [filteredTrialBalanceEntries, selectedCategory, sortBy, classificationFilter, groupField, getFieldValue]);

  const toggleGroup = (category: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedGroups(newExpanded);
  };

  // Handle account row clicks for cross-filtering
  const handleAccountClick = (entry: any) => {
    if (!enableCrossFilter) return;
    
    // Check if this account is already filtered
    if (filters.crossFilter?.value === entry.account_number) {
      clearCrossFilter();
    } else {
      setCrossFilter(
        widget.id,
        'account',
        entry.account_number,
        `Konto: ${entry.account_name}`
      );
    }
  };

  // Handle category clicks for cross-filtering  
  const handleCategoryClick = (category: string, totalBalance: number) => {
    if (!enableCrossFilter) return;

    const filterType =
      groupField === 'account' || groupField === 'account_number'
        ? 'account'
        : 'category';

    if (filters.crossFilter?.value === category) {
      clearCrossFilter();
    } else {
      setCrossFilter(
        widget.id,
        filterType,
        category,
        `${filterType === 'account' ? 'Konto' : 'Kategori'}: ${category}`
      );
    }
  };

  // Check if this widget is the source of current cross-filter
  const isFilterSource = filters.crossFilter?.sourceWidgetId === widget.id;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <InlineEditableTitle 
            title={widget.title} 
            onTitleChange={handleTitleChange}
            size="sm"
          />
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Laster data...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`h-full ${isFilterSource ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <InlineEditableTitle 
            title={widget.title} 
            onTitleChange={handleTitleChange}
            size="sm"
          />
          {filters.crossFilter && !isFilterSource && (
            <div className="text-xs text-muted-foreground flex items-center">
              <span className="w-2 h-2 bg-primary rounded-full mr-1"></span>
              Filtrert
            </div>
          )}
        </div>
        {enableCrossFilter && (
          <div className="text-xs text-muted-foreground">
            💡 Klikk på kategorier/kontoer for å filtrere andre widgets
          </div>
        )}
        {groupByCategory && categories.length > 1 && (
          <div className="flex items-center gap-2 mt-2">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-6 text-xs w-32">
                <SelectValue placeholder="Alle kategorier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle kategorier</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
                <SelectItem value="unmapped">Ikke klassifisert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {groupByCategory ? (
          <div className="space-y-2">
            {Object.entries(groupedData).map(([category, entries]) => {
              const categoryTotal = entries.reduce((sum, entry) => sum + Math.abs(entry.balance), 0);
              const isExpanded = expandedGroups.has(category);
              const displayEntries = isExpanded ? entries.slice(0, maxRows) : entries.slice(0, 3);
              
              return (
                <div key={category} className="border-b border-border last:border-b-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`w-full justify-between p-2 h-auto text-xs font-medium hover:bg-muted/50 ${
                      enableCrossFilter ? 'cursor-pointer' : ''
                    } ${filters.crossFilter?.value === category ? 'bg-primary/10' : ''}`}
                    onClick={() => {
                      toggleGroup(category);
                      if (enableCrossFilter) {
                        handleCategoryClick(category, categoryTotal);
                      }
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                      <span>{category}</span>
                      <Badge variant="secondary" className="text-xs">
                        {entries.length}
                      </Badge>
                    </div>
                    <span className="text-xs font-medium">
                      {new Intl.NumberFormat('no-NO').format(categoryTotal)}
                    </span>
                  </Button>
                  
                  {isExpanded && (
                    <Table>
                      <TableBody>
                        {displayEntries.map((entry, index) => (
                          <TableRow 
                            key={`${category}-${index}`} 
                            className={`text-xs border-l-2 border-l-muted ml-4 ${
                              enableCrossFilter ? 'cursor-pointer hover:bg-muted/50' : ''
                            } ${filters.crossFilter?.value === entry.account_number ? 'bg-primary/10' : ''}`}
                            onClick={() => enableCrossFilter && handleAccountClick(entry)}
                          >
                            <TableCell className="font-medium pl-6">{entry.account}</TableCell>
                            <TableCell className="text-right">{entry.formattedBalance}</TableCell>
                            {showPercentage && (
                              <TableCell className="text-right">
                                {totalBalance > 0 
                                  ? ((Math.abs(entry.balance) / totalBalance) * 100).toFixed(1) + '%'
                                  : '0%'
                                }
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                        {!isExpanded && entries.length > 3 && (
                          <TableRow className="text-xs">
                            <TableCell colSpan={showPercentage ? 3 : 2} className="text-center text-muted-foreground pl-6">
                              ... og {entries.length - 3} flere kontoer
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </div>
              );
            })}
            {Object.keys(groupedData).length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-xs">
                Ingen data tilgjengelig
              </div>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Konto</TableHead>
                <TableHead className="text-xs text-right">Saldo</TableHead>
                {showPercentage && <TableHead className="text-xs text-right">%</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.values(groupedData).flat().slice(0, maxRows).map((entry, index) => (
                <TableRow 
                  key={index} 
                  className={`text-xs ${
                    enableCrossFilter ? 'cursor-pointer hover:bg-muted/50' : ''
                  } ${filters.crossFilter?.value === entry.account_number ? 'bg-primary/10' : ''}`}
                  onClick={() => enableCrossFilter && handleAccountClick(entry)}
                >
                  <TableCell className="font-medium">{entry.account}</TableCell>
                  <TableCell className="text-right">{entry.formattedBalance}</TableCell>
                  {showPercentage && (
                    <TableCell className="text-right">
                      {totalBalance > 0 
                        ? ((Math.abs(entry.balance) / totalBalance) * 100).toFixed(1) + '%'
                        : '0%'
                      }
                    </TableCell>
                  )}
                </TableRow>
              )) }
              {Object.keys(groupedData).length === 0 && (
                <TableRow>
                  <TableCell colSpan={showPercentage ? 3 : 2} className="text-center text-muted-foreground">
                    Ingen data tilgjengelig
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}