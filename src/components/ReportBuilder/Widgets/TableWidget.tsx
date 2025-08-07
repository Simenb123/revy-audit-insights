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
import { useFiscalYear } from '@/contexts/FiscalYearContext';

interface TableWidgetProps {
  widget: Widget;
}

export function TableWidget({ widget }: TableWidgetProps) {
  const { selectedFiscalYear } = useFiscalYear();
  const { updateWidget } = useWidgetManager();
  const clientId = widget.config?.clientId;

  const handleTitleChange = (newTitle: string) => {
    updateWidget(widget.id, { title: newTitle });
  };
  const maxRows = widget.config?.maxRows || 10;
  const sortBy = widget.config?.sortBy || 'balance';
  const showPercentage = widget.config?.showPercentage !== false;
  const groupByCategory = widget.config?.groupByCategory !== false;
  const classificationFilter = widget.config?.filterByClassification;
  
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());
  
  const { data: trialBalanceData, isLoading } = useTrialBalanceWithMappings(
    clientId, 
    selectedFiscalYear,
    widget.config?.selectedVersion
  );

  const { groupedData, categories, totalBalance } = React.useMemo(() => {
    if (!trialBalanceData?.trialBalanceEntries) {
      return { groupedData: {}, categories: [], totalBalance: 0 };
    }

    let filteredEntries = [...trialBalanceData.trialBalanceEntries]
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
      filteredEntries = filteredEntries.filter(entry => 
        entry.standard_name === selectedCategory || 
        (!entry.standard_name && selectedCategory === 'unmapped')
      );
    }

    // Group by classification
    const grouped: Record<string, any[]> = {};
    const categorySet = new Set<string>();

    filteredEntries.forEach(entry => {
      const category = entry.standard_name || 'Ikke klassifisert';
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
  }, [trialBalanceData, selectedCategory, sortBy, classificationFilter]);

  const toggleGroup = (category: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedGroups(newExpanded);
  };

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
    <Card className="h-full">
      <CardHeader className="pb-3">
        <InlineEditableTitle 
          title={widget.title} 
          onTitleChange={handleTitleChange}
          size="sm"
        />
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
                    className="w-full justify-between p-2 h-auto text-xs font-medium hover:bg-muted/50"
                    onClick={() => toggleGroup(category)}
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
                          <TableRow key={`${category}-${index}`} className="text-xs border-l-2 border-l-muted ml-4">
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
                <TableRow key={index} className="text-xs">
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