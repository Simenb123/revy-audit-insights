import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Download, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface DataTableColumn<T = any> {
  key: string;
  header: string;
  accessor: keyof T | ((row: T) => any);
  sortable?: boolean;
  searchable?: boolean;
  format?: (value: any) => string | React.ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export interface DataTableProps<T = any> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  data: T[];
  columns: DataTableColumn<T>[];
  isLoading?: boolean;
  error?: Error | null;
  searchPlaceholder?: string;
  enableExport?: boolean;
  exportFileName?: string;
  enablePagination?: boolean;
  pageSize?: number;
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  showTotals?: boolean;
  totalRow?: React.ReactNode;
  emptyMessage?: string;
}

const DataTable = <T extends Record<string, any>>({
  title,
  description,
  icon,
  data,
  columns,
  isLoading = false,
  error = null,
  searchPlaceholder = "Søk...",
  enableExport = true,
  exportFileName = "data",
  enablePagination = false,
  pageSize = 100,
  totalCount = 0,
  currentPage = 1,
  onPageChange,
  showTotals = false,
  totalRow,
  emptyMessage = "Ingen data funnet"
}: DataTableProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    console.log('DataTable - input data:', data);
    console.log('DataTable - columns:', columns);
    if (!data) return [];
    
    // Filter first
    let filtered = data;
    if (searchTerm) {
      const searchableColumns = columns.filter(col => col.searchable !== false);
      filtered = data.filter(item => {
        return searchableColumns.some(column => {
          const value = typeof column.accessor === 'function' 
            ? column.accessor(item)
            : item[column.accessor as keyof T];
          
          return String(value || '').toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }
    
    // Then sort
    if (sortBy) {
      const column = columns.find(col => col.key === sortBy);
      if (column) {
        filtered = [...filtered].sort((a, b) => {
          const aValue = typeof column.accessor === 'function' 
            ? column.accessor(a)
            : a[column.accessor as keyof T];
          const bValue = typeof column.accessor === 'function' 
            ? column.accessor(b)
            : b[column.accessor as keyof T];
          
          // Handle different data types
          let aCompare: any = aValue;
          let bCompare: any = bValue;
          
          // Handle dates
          if (aValue instanceof Date || (typeof aValue === 'string' && !isNaN(Date.parse(aValue)))) {
            aCompare = new Date(aValue);
            bCompare = new Date(bValue);
          }
          // Handle numbers
          else if (typeof aValue === 'number' || !isNaN(Number(aValue))) {
            aCompare = Number(aValue) || 0;
            bCompare = Number(bValue) || 0;
          }
          // Handle strings
          else if (typeof aValue === 'string') {
            aCompare = aValue.toLowerCase();
            bCompare = String(bValue || '').toLowerCase();
          }
          
          if (sortOrder === 'asc') {
            return aCompare < bCompare ? -1 : aCompare > bCompare ? 1 : 0;
          } else {
            return aCompare > bCompare ? -1 : aCompare < bCompare ? 1 : 0;
          }
        });
      }
    }
    
    return filtered;
  }, [data, searchTerm, sortBy, sortOrder, columns]);

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return;
    
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnKey);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (!column?.sortable) return null;
    
    if (sortBy !== columnKey) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleExport = () => {
    if (!data || data.length === 0) return;
    
    const exportColumns = columns.filter(col => col.key !== 'actions');
    const csvContent = [
      exportColumns.map(col => col.header).join(','),
      ...data.map(item => 
        exportColumns.map(column => {
          const value = typeof column.accessor === 'function' 
            ? column.accessor(item)
            : item[column.accessor as keyof T];
          
          // Clean value for CSV
          let cleanValue = String(value || '');
          if (cleanValue.includes(',') || cleanValue.includes('"')) {
            cleanValue = `"${cleanValue.replace(/"/g, '""')}"`;
          }
          return cleanValue;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exportFileName}_${new Date().getFullYear()}.csv`;
    link.click();
  };

  const totalPages = enablePagination ? Math.ceil(totalCount / pageSize) : 1;
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">Feil ved lasting av data: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">{description}</p>
            )}
            {enablePagination && totalCount > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Viser {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, totalCount)} av {totalCount} poster
                {totalPages > 1 && ` • Side ${currentPage} av ${totalPages}`}
              </p>
            )}
          </div>
          {enableExport && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              disabled={!data || data.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Eksporter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead 
                      key={column.key}
                      className={`${column.sortable !== false ? 'cursor-pointer hover:bg-muted/50 select-none' : ''} ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''} ${column.className || ''}`}
                      onClick={() => column.sortable !== false && handleSort(column.key)}
                    >
                      <div className={`flex items-center gap-2 ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : ''}`}>
                        {column.header}
                        {getSortIcon(column.key)}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="text-center text-muted-foreground">
                      {emptyMessage}
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {filteredAndSortedData.map((item, index) => (
                      <TableRow key={item.id || index}>
                        {columns.map((column) => {
                          const value = typeof column.accessor === 'function' 
                            ? column.accessor(item)
                            : item[column.accessor as keyof T];
                          
                          const formattedValue = column.format ? column.format(value) : value;
                          
                          return (
                            <TableCell 
                              key={column.key}
                              className={`${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''} ${column.className || ''}`}
                            >
                              {formattedValue}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                    {showTotals && totalRow && totalRow}
                  </>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination and info */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {searchTerm 
                ? `Viser ${filteredAndSortedData.length} filtrerte av ${data?.length || 0} poster` 
                : enablePagination 
                  ? `Side ${currentPage} av ${totalPages}`
                  : `${data?.length || 0} poster totalt`
              }
            </div>
            
            {enablePagination && !searchTerm && totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                  disabled={!hasPrevPage}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Forrige
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Side {currentPage} av {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
                  disabled={!hasNextPage}
                >
                  Neste
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataTable;