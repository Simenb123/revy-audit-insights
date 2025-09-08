import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, ChevronLeft, ChevronRight, Download, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Column {
  key: string;
  label: string;
  type?: 'string' | 'number' | 'date' | 'boolean';
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  render?: (value: any, row: any) => React.ReactNode;
}

interface FilterState {
  search: string;
  columnFilters: Record<string, string>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

interface UniversalDataTableProps<T = any> {
  data?: T[];
  columns: Column[];
  
  // Large dataset support
  enableVirtualization?: boolean;
  enableServerSidePagination?: boolean;
  enableServerSideFiltering?: boolean;
  enableServerSideSorting?: boolean;
  
  // Server-side data fetching
  onDataFetch?: (params: {
    page: number;
    pageSize: number;
    search?: string;
    filters?: Record<string, string>;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => Promise<{ data: T[]; total: number }>;
  
  // Loading states
  loading?: boolean;
  
  // UI customization
  title?: string;
  description?: string;
  emptyMessage?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  showPagination?: boolean;
  showExport?: boolean;
  
  // Row configuration
  rowHeight?: number;
  maxRows?: number;
  
  // Callbacks
  onRowClick?: (row: T, index: number) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  onExport?: (data: T[]) => void;
  
  className?: string;
}

const UniversalDataTable = <T extends Record<string, any>>({
  data = [],
  columns,
  enableVirtualization = true,
  enableServerSidePagination = false,
  enableServerSideFiltering = false,
  enableServerSideSorting = false,
  onDataFetch,
  loading = false,
  title,
  description,
  emptyMessage = 'Ingen data funnet',
  showSearch = true,
  showFilters = true,
  showPagination = true,
  showExport = true,
  rowHeight = 50,
  maxRows = 1000,
  onRowClick,
  onSelectionChange,
  onExport,
  className
}: UniversalDataTableProps<T>) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    columnFilters: {}
  });
  
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: enableVirtualization ? 50 : 25,
    total: 0
  });
  
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [serverData, setServerData] = useState<T[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  // Determine data source
  const isServerSide = enableServerSidePagination || enableServerSideFiltering || enableServerSideSorting;
  const workingData = isServerSide ? serverData : data;

  // Server-side data fetching
  const fetchData = useCallback(async () => {
    if (!onDataFetch || !isServerSide) return;
    
    setIsFetching(true);
    try {
      const result = await onDataFetch({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: enableServerSideFiltering ? filters.search : undefined,
        filters: enableServerSideFiltering ? filters.columnFilters : undefined,
        sortBy: enableServerSideSorting ? filters.sortBy : undefined,
        sortOrder: enableServerSideSorting ? filters.sortOrder : undefined
      });
      
      setServerData(result.data);
      setPagination(prev => ({ ...prev, total: result.total }));
    } catch (error) {
      console.error('Data fetch error:', error);
    } finally {
      setIsFetching(false);
    }
  }, [
    onDataFetch,
    isServerSide,
    pagination.page,
    pagination.pageSize,
    filters,
    enableServerSideFiltering,
    enableServerSideSorting
  ]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side filtering and sorting
  const filteredAndSortedData = useMemo(() => {
    if (isServerSide) return workingData;
    
    let filtered = [...workingData];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(row =>
        columns.some(col => {
          const value = row[col.key];
          return value?.toString().toLowerCase().includes(searchLower);
        })
      );
    }
    
    // Apply column filters
    Object.entries(filters.columnFilters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(row => {
          const rowValue = row[key];
          return rowValue?.toString().toLowerCase().includes(value.toLowerCase());
        });
      }
    });
    
    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        const aVal = a[filters.sortBy!];
        const bVal = b[filters.sortBy!];
        
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        if (aVal > bVal) comparison = 1;
        
        return filters.sortOrder === 'desc' ? -comparison : comparison;
      });
    }
    
    return filtered;
  }, [workingData, filters, columns, isServerSide]);

  // Pagination for client-side data
  const paginatedData = useMemo(() => {
    if (isServerSide || !showPagination) return filteredAndSortedData;
    
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredAndSortedData.slice(start, end);
  }, [filteredAndSortedData, pagination, isServerSide, showPagination]);

  // Virtual scrolling setup
  const parentRef = React.useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: paginatedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    enabled: enableVirtualization && paginatedData.length > 100
  });

  const items = enableVirtualization && paginatedData.length > 100 
    ? virtualizer.getVirtualItems() 
    : paginatedData.map((_, index) => ({ index, start: index * rowHeight, size: rowHeight }));

  // Update total for client-side pagination
  useEffect(() => {
    if (!isServerSide) {
      setPagination(prev => ({ ...prev, total: filteredAndSortedData.length }));
    }
  }, [filteredAndSortedData.length, isServerSide]);

  // Handle search
  const handleSearch = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    if (!enableServerSideFiltering) {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [enableServerSideFiltering]);

  // Handle column filter
  const handleColumnFilter = useCallback((column: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      columnFilters: { ...prev.columnFilters, [column]: value }
    }));
    if (!enableServerSideFiltering) {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  }, [enableServerSideFiltering]);

  // Handle sorting
  const handleSort = useCallback((column: string) => {
    setFilters(prev => {
      const newOrder = prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc';
      return {
        ...prev,
        sortBy: column,
        sortOrder: newOrder
      };
    });
  }, []);

  // Handle row selection
  const handleRowSelect = useCallback((index: number, selected: boolean) => {
    setSelectedRows(prev => {
      const newSelection = new Set(prev);
      if (selected) {
        newSelection.add(index);
      } else {
        newSelection.delete(index);
      }
      
      if (onSelectionChange) {
        const selectedData = Array.from(newSelection).map(i => paginatedData[i]);
        onSelectionChange(selectedData);
      }
      
      return newSelection;
    });
  }, [paginatedData, onSelectionChange]);

  // Handle export
  const handleExport = useCallback(() => {
    if (onExport) {
      const dataToExport = selectedRows.size > 0 
        ? Array.from(selectedRows).map(i => paginatedData[i])
        : filteredAndSortedData;
      onExport(dataToExport);
    }
  }, [onExport, selectedRows, paginatedData, filteredAndSortedData]);

  const isLoading = loading || isFetching;
  const totalPages = Math.ceil(pagination.total / pagination.pageSize);
  const hasData = paginatedData.length > 0;

  return (
    <Card className={cn('w-full', className)}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </CardHeader>
      )}
      
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Søk..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
            )}
            
            {showFilters && (
              <Select value="" onValueChange={() => {}}>
                <SelectTrigger className="w-[120px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  {columns.filter(col => col.filterable).map(col => (
                    <SelectItem key={col.key} value={col.key}>
                      {col.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="flex gap-2 items-center">
            {selectedRows.size > 0 && (
              <Badge variant="secondary">
                {selectedRows.size} valgt
              </Badge>
            )}
            
            {showExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={!hasData}
              >
                <Download className="h-4 w-4 mr-2" />
                Eksporter
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="relative border rounded-md">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          
          {/* Header */}
          <div className="border-b bg-muted/50">
            <div className="flex">
              <div className="w-12 p-2 border-r">
                <input
                  type="checkbox"
                  checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRows(new Set(paginatedData.map((_, i) => i)));
                    } else {
                      setSelectedRows(new Set());
                    }
                  }}
                  className="rounded"
                />
              </div>
              {columns.map((column) => (
                <div
                  key={column.key}
                  className={cn(
                    "flex-1 p-2 border-r last:border-r-0 font-medium text-sm",
                    column.sortable && "cursor-pointer hover:bg-muted/70"
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center justify-between">
                    {column.label}
                    {filters.sortBy === column.key && (
                      <span className="text-xs">
                        {filters.sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div
            ref={parentRef}
            className="overflow-auto"
            style={{
              height: enableVirtualization && paginatedData.length > 100 
                ? `${Math.min(paginatedData.length * rowHeight, 600)}px` 
                : 'auto',
              maxHeight: enableVirtualization ? '600px' : 'none'
            }}
          >
            {!hasData && !isLoading ? (
              <div className="p-8 text-center text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <div
                style={{
                  height: enableVirtualization && paginatedData.length > 100 
                    ? `${virtualizer.getTotalSize()}px` 
                    : 'auto',
                  width: '100%',
                  position: 'relative'
                }}
              >
                {items.map((virtualItem) => {
                  const index = virtualItem.index;
                  const row = paginatedData[index];
                  if (!row) return null;
                  
                  return (
                    <div
                      key={index}
                      className={cn(
                        "absolute top-0 left-0 w-full flex border-b hover:bg-muted/30",
                        onRowClick && "cursor-pointer"
                      )}
                      style={{
                        height: `${virtualItem.size}px`,
                        transform: `translateY(${virtualItem.start}px)`
                      }}
                      onClick={() => onRowClick?.(row, index)}
                    >
                      <div className="w-12 p-2 border-r flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedRows.has(index)}
                          onChange={(e) => handleRowSelect(index, e.target.checked)}
                          className="rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      {columns.map((column) => (
                        <div
                          key={column.key}
                          className="flex-1 p-2 border-r last:border-r-0 text-sm flex items-center"
                          style={{ width: column.width }}
                        >
                          {column.render 
                            ? column.render(row[column.key], row)
                            : row[column.key]?.toString() || '-'
                          }
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {showPagination && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Viser {((pagination.page - 1) * pagination.pageSize) + 1} til{' '}
              {Math.min(pagination.page * pagination.pageSize, pagination.total)} av{' '}
              {pagination.total.toLocaleString()} rader
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm">
                Side {pagination.page} av {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === totalPages || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UniversalDataTable;
export type { Column, FilterState, PaginationState, UniversalDataTableProps };