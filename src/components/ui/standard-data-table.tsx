import React from 'react';
import DataTable, { DataTableColumn, DataTableProps } from './data-table';
import { TextSanitizer } from '@/components/Utils/TextSanitizer';
import TableToolbar from './table-toolbar';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  // Enable internal toolbar by default for StandardDataTable
  enableInternalToolbar: true,
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
  // PDF Export options
  enablePdfExport?: boolean;
  pdfTitle?: string;
  pdfOrientation?: 'portrait' | 'landscape';
}

const StandardDataTable = <T extends Record<string, any>>({
  columns,
  enableNorwegianCharacters = true,
  autoFixColumnAlignment = true,
  tableName,
  preferencesKey,
  enablePdfExport = false,
  pdfTitle,
  pdfOrientation = 'landscape',
  ...props
}: StandardDataTableProps<T>) => {
  // Generate preferences key from table name if not provided
  const finalPreferencesKey = preferencesKey || (tableName ? `standard-table-${tableName}` : undefined);

  // PDF Export function
  const handlePdfExport = React.useCallback(async (data: T[]) => {
    if (!data || data.length === 0) return;

    const doc = new jsPDF({
      orientation: pdfOrientation,
      unit: 'mm',
      format: 'a4'
    });

    // Set title
    const title = pdfTitle || tableName || 'Rapport';
    doc.setFontSize(16);
    doc.text(title, 20, 20);
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generert: ${new Date().toLocaleDateString('no-NO')}`, 20, 30);

    // Prepare table data
    const exportColumns = columns.filter(col => col.key !== 'actions');
    const headers = exportColumns.map(col => col.header);
    
    const tableData = data.map(item => {
      return exportColumns.map(column => {
        const value = typeof column.accessor === 'function' 
          ? column.accessor(item) 
          : (item[column.accessor as keyof T] as any);
        
        // Clean up the value for PDF
        if (typeof value === 'string') {
          return value.replace(/<[^>]*>/g, ''); // Remove HTML tags
        }
        return String(value || '');
      });
    });

    // Add table to PDF
    (doc as any).autoTable({
      head: [headers],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [64, 64, 64],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: exportColumns.reduce((acc, col, index) => {
        if (col.align === 'right') {
          acc[index] = { halign: 'right' };
        } else if (col.align === 'center') {
          acc[index] = { halign: 'center' };
        }
        return acc;
      }, {} as any),
    });

    // Save the PDF
    const fileName = `${tableName || 'rapport'}_${new Date().getFullYear()}.pdf`;
    doc.save(fileName);
  }, [columns, tableName, pdfTitle, pdfOrientation]);

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

  // Merge with Norwegian defaults and enable internal toolbar + PDF export
  const finalProps = {
    ...NORWEGIAN_DEFAULTS,
    ...props,
    columns: enhancedColumns,
    preferencesKey: finalPreferencesKey,
    enablePdfExport: enablePdfExport,
    onPdfExport: enablePdfExport ? () => handlePdfExport(props.data || []) : undefined,
  };

  return <DataTable {...finalProps} />;
};

export default StandardDataTable;