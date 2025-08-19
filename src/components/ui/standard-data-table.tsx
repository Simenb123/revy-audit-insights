import React from 'react';
import DataTable, { DataTableColumn, DataTableProps } from './data-table';
import { TextSanitizer } from '@/components/Utils/TextSanitizer';

// Standard Norwegian defaults for all tables
const NORWEGIAN_DEFAULTS = {
  searchPlaceholder: 'Søk...',
  emptyMessage: 'Ingen data funnet',
  exportFileName: 'data',
  enableExport: true,
  enableColumnManager: true,
  showSearch: true,
  stickyHeader: true,
  maxBodyHeight: '70vh',
  pageSize: 50,
  enablePagination: false,
  wrapInCard: true,
};

// Enhanced column with Norwegian character support
export interface StandardDataTableColumn<T = any> extends DataTableColumn<T> {
  format?: (value: any, row: T) => string | React.ReactNode;
}

export interface StandardDataTableProps<T = any> extends Omit<DataTableProps<T>, 'columns'> {
  columns: StandardDataTableColumn<T>[];
  // Additional standard features
  enableNorwegianCharacters?: boolean;
  autoFixColumnAlignment?: boolean;
  tableName?: string; // For preferences key generation
}

const StandardDataTable = <T extends Record<string, any>>({
  columns,
  enableNorwegianCharacters = true,
  autoFixColumnAlignment = true,
  tableName,
  preferencesKey,
  ...props
}: StandardDataTableProps<T>) => {
  // Generate preferences key from table name if not provided
  const finalPreferencesKey = preferencesKey || (tableName ? `standard-table-${tableName}` : undefined);

  // Enhance columns with Norwegian character support and auto-alignment
  const enhancedColumns: DataTableColumn<T>[] = React.useMemo(() => {
    return columns.map(col => {
      const enhanced: DataTableColumn<T> = { ...col };
      
      // Auto-detect alignment for common Norwegian data types
      if (autoFixColumnAlignment && !col.align) {
        const key = String(col.key).toLowerCase();
        if (key.includes('beløp') || key.includes('amount') || key.includes('sum') || 
            key.includes('pris') || key.includes('verdi') || key.includes('saldo') ||
            key.includes('kr') || key.includes('nok')) {
          enhanced.align = 'right';
        } else if (key.includes('dato') || key.includes('date') || key.includes('tid') || key.includes('time')) {
          enhanced.align = 'center';
        }
      }

      // Add Norwegian character sanitization to format function
      if (enableNorwegianCharacters) {
        const originalFormat = col.format;
        enhanced.format = (value: any, row: T) => {
          const formatted = originalFormat ? originalFormat(value, row) : value;
          if (typeof formatted === 'string') {
            return <TextSanitizer text={formatted} />;
          }
          return formatted;
        };
      }

      return enhanced;
    });
  }, [columns, enableNorwegianCharacters, autoFixColumnAlignment]);

  // Merge with Norwegian defaults
  const finalProps = {
    ...NORWEGIAN_DEFAULTS,
    ...props,
    columns: enhancedColumns,
    preferencesKey: finalPreferencesKey,
  };

  return <DataTable {...finalProps} />;
};

export default StandardDataTable;