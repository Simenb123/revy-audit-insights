import React, { useMemo, useState, useCallback } from 'react';
import DataTable, { DataTableProps } from './data-table';
import { useProgressiveDisclosure, commonDisclosureConfigs } from '@/hooks/useProgressiveDisclosure';
import { useIntelligentCache } from '@/hooks/useIntelligentCache';
import { useWidgetInteractionHandler } from '@/contexts/WidgetInteractionContext';
import { Button } from './button';
import { Badge } from './badge';
import { Settings, Eye, EyeOff, Filter, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from './dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { cn } from '@/lib/utils';

interface EnhancedDataTableProps<T> extends Omit<DataTableProps<T>, 'data'> {
  className?: string;
  widgetId: string;
  fetchData: () => Promise<T[]>;
  clientId?: string;
  enableProgressive?: boolean;
  enableInteractions?: boolean;
  enableCaching?: boolean;
  cacheConfig?: {
    ttl?: number;
    priority?: 'low' | 'medium' | 'high';
  };
  onSelectionChange?: (selectedItems: T[]) => void;
  onFilterApplied?: (filters: any[]) => void;
}

export function EnhancedDataTable<T extends Record<string, any>>({
  widgetId,
  fetchData,
  clientId,
  columns,
  enableProgressive = true,
  enableInteractions = true,
  enableCaching = true,
  cacheConfig = {},
  onSelectionChange,
  onFilterApplied,
  title,
  description,
  className,
  ...dataTableProps
}: EnhancedDataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  
  // Cache hook
  const cacheKey = `table:${widgetId}:${clientId || 'default'}`;
  const { 
    data: cachedData, 
    isLoading: isCacheLoading, 
    error: cacheError,
    isStale,
    refetch 
  } = useIntelligentCache(
    cacheKey,
    fetchData,
    {
      enabled: enableCaching,
      ttl: cacheConfig.ttl || 5 * 60 * 1000,
      priority: cacheConfig.priority || 'medium',
      backgroundRefresh: true
    }
  );

  // Progressive disclosure
  const disclosure = useProgressiveDisclosure({
    ...commonDisclosureConfigs.dataTable,
    storageKey: `table-disclosure-${widgetId}`
  });

  // Widget interactions
  const {
    applyFilterToTarget,
    handleSelection,
    emitCustomEvent,
    activeFilters
  } = useWidgetInteractionHandler(widgetId);

  // Filter columns based on progressive disclosure
  const visibleColumns = useMemo(() => {
    if (!enableProgressive) return columns;
    
    return columns.filter(column => {
      const fieldId = typeof column.accessor === 'string' ? column.accessor : column.key;
      return fieldId && disclosure.shouldShowField(fieldId);
    });
  }, [columns, disclosure.shouldShowField, enableProgressive]);

  // Apply active filters to data
  const filteredData = useMemo(() => {
    if (!cachedData || !activeFilters.length) return cachedData || [];

    return cachedData.filter(item => {
      return activeFilters.every(filter => {
        const value = item[filter.field];
        
        switch (filter.operator) {
          case 'equals':
            return value === filter.value;
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'greater':
            return Number(value) > Number(filter.value);
          case 'less':
            return Number(value) < Number(filter.value);
          case 'in':
            return Array.isArray(filter.value) && filter.value.includes(value);
          default:
            return true;
        }
      });
    });
  }, [cachedData, activeFilters]);

  // Handle row selection
  const handleRowSelection = useCallback((selectedItems: T[]) => {
    setSelectedRows(selectedItems);
    
    if (enableInteractions) {
      handleSelection(selectedItems);
    }
    
    onSelectionChange?.(selectedItems);
    
    if (selectedItems.length > 0) {
      emitCustomEvent('rows-selected', {
        count: selectedItems.length,
        items: selectedItems
      });
    }
  }, [enableInteractions, handleSelection, onSelectionChange, emitCustomEvent]);

  // Handle filters
  const handleFilterChange = useCallback((filters: any[]) => {
    onFilterApplied?.(filters);
    
    if (enableInteractions && filters.length > 0) {
      emitCustomEvent('filters-applied', { filters });
    }
  }, [enableInteractions, onFilterApplied, emitCustomEvent]);

  // Apply filter to other widgets
  const applyFilterToOtherWidgets = useCallback((field: string, value: any) => {
    // You could make this configurable to specify target widgets
    emitCustomEvent('filter-request', { field, value });
  }, [emitCustomEvent]);

  const renderHeader = () => (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <div>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Cache status */}
        {enableCaching && (
          <Badge variant={isStale ? "destructive" : "secondary"} className="text-xs">
            {isStale ? "Stale" : "Fresh"}
          </Badge>
        )}
        
        {/* Active filters indicator */}
        {activeFilters.length > 0 && (
          <Badge variant="outline" className="text-xs">
            <Filter className="w-3 h-3 mr-1" />
            {activeFilters.length}
          </Badge>
        )}
        
        {/* Selected items indicator */}
        {selectedRows.length > 0 && (
          <Badge variant="default" className="text-xs">
            {selectedRows.length} selected
          </Badge>
        )}
        
        {/* Progressive disclosure controls */}
        {enableProgressive && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Vis nivå</DropdownMenuLabel>
              {disclosure.levels.map((level) => (
                <DropdownMenuItem
                  key={level.id}
                  onClick={() => disclosure.setLevel(level.id)}
                  className={cn(
                    disclosure.currentLevel === level.id && "bg-accent"
                  )}
                >
                  {level.label}
                  {level.description && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      {level.description}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={disclosure.toggleExpansion}>
                {disclosure.isExpanded ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Skjul detaljer
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Vis alle detaljer
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Action menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {enableCaching && (
              <DropdownMenuItem onClick={() => refetch()}>
                Oppdater data
              </DropdownMenuItem>
            )}
            {selectedRows.length > 0 && enableInteractions && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => {
                    // Example: Apply selection as filter to other widgets
                    const values = selectedRows.map(row => row.id || row.key);
                    applyFilterToOtherWidgets('id', values);
                  }}
                >
                  Filtrer andre widgets
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </CardHeader>
  );

  if (cacheError) {
    return (
      <Card className={className}>
        {renderHeader()}
        <CardContent>
          <div className="text-center py-4 text-destructive">
            Feil ved lasting av data: {cacheError.message}
            <Button onClick={() => refetch()} className="ml-2" size="sm">
              Prøv igjen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      {renderHeader()}
      <CardContent className="p-0">
        <DataTable<T>
          title={title}
          description={description}
          {...dataTableProps}
          data={filteredData}
          columns={visibleColumns}
          isLoading={isCacheLoading}
        />
      </CardContent>
    </Card>
  );
}