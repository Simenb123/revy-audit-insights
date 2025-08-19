import React from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Settings2, RotateCcw, FileSpreadsheet, FileText } from 'lucide-react';
import ColumnManager, { ColumnState as CMState } from '@/components/ui/column-manager';

export interface TableToolbarProps {
  // Column management
  enableColumnManager?: boolean;
  columns?: CMState[];
  onColumnsChange?: (columns: CMState[]) => void;
  
  // Width management
  enableWidthReset?: boolean;
  onWidthReset?: () => void;
  
  // Export functions
  enableExport?: boolean;
  enablePdfExport?: boolean;
  onExcelExport?: () => void;
  onPdfExport?: () => void;
  isExportDisabled?: boolean;
  
  // Views dropdown
  viewsDropdown?: React.ReactNode;
  
  // Custom actions
  customActions?: React.ReactNode;
}

const TableToolbar: React.FC<TableToolbarProps> = ({
  enableColumnManager = false,
  columns = [],
  onColumnsChange,
  enableWidthReset = false,
  onWidthReset,
  enableExport = false,
  enablePdfExport = false,
  onExcelExport,
  onPdfExport,
  isExportDisabled = false,
  viewsDropdown,
  customActions,
}) => {
  const hasExportOptions = enableExport && (onExcelExport || onPdfExport);
  const hasOnlyExcel = enableExport && onExcelExport && !onPdfExport;

  return (
    <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/20">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground font-medium">Verktøy:</span>
        
        {enableColumnManager && onColumnsChange && (
          <ColumnManager 
            columns={columns} 
            onChange={onColumnsChange} 
            allowPinLeft 
            title="Tilpass kolonner" 
            triggerLabel="Velg kolonner"
          />
        )}
        
        {enableWidthReset && onWidthReset && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onWidthReset} 
            title="Tilbakestill kolonnebredder"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Tilbakestill bredder
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {viewsDropdown}
        
        {customActions}
        
        {/* Export dropdown - always show dropdown with download icon only */}
        {hasExportOptions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={isExportDisabled}
                title="Eksporter data"
              >
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onExcelExport && (
                <DropdownMenuItem onClick={onExcelExport}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </DropdownMenuItem>
              )}
              {onPdfExport && (
                <DropdownMenuItem onClick={onPdfExport}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

export default TableToolbar;