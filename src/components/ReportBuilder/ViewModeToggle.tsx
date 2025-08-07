import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Edit3, Download } from 'lucide-react';
import { useViewMode } from './ViewModeContext';
import { cn } from '@/lib/utils';

interface ViewModeToggleProps {
  disabled?: boolean;
  onExportPDF?: () => void;
}

export function ViewModeToggle({ disabled, onExportPDF }: ViewModeToggleProps) {
  const { isViewMode, toggleViewMode } = useViewMode();

  const handlePrintToPDF = () => {
    if (onExportPDF) {
      onExportPDF();
    } else {
      // Default browser print
      window.print();
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isViewMode ? "default" : "outline"}
        size="sm"
        onClick={toggleViewMode}
        disabled={disabled}
        className="flex items-center gap-2"
      >
        {isViewMode ? (
          <>
            <Edit3 className="h-4 w-4" />
            Rediger
          </>
        ) : (
          <>
            <Eye className="h-4 w-4" />
            Forhåndsvis
          </>
        )}
      </Button>
      
      {isViewMode && (
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrintToPDF}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Eksporter PDF
        </Button>
      )}
    </div>
  );
}