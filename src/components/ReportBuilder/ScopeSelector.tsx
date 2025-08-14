import React from 'react';
import { Button } from '@/components/ui/button';
import { useScope } from '@/contexts/ScopeContext';
import { ClientsMultiSelect } from './ClientsMultiSelect';
import { ExportReportDialog } from './ExportReportDialog';
import { ShareDialog } from './ShareDialog';
import { ViewModeToggle } from './ViewModeToggle';
import { Download, Share2 } from 'lucide-react';
import { useFiscalYear } from '@/contexts/FiscalYearContext';

export function ScopeSelector() {
  const { scopeType, setScopeType } = useScope();
  const { selectedFiscalYear } = useFiscalYear();
  const [showExportDialog, setShowExportDialog] = React.useState(false);
  const [showShareDialog, setShowShareDialog] = React.useState(false);

  return (
    <div className="flex flex-col gap-4" aria-label="Omfangsvelger">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-80">Omfang:</span>
          <div className="flex gap-1">
            <Button
              variant={scopeType === 'client' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeType('client')}
              aria-pressed={scopeType === 'client'}
            >
              Klient
            </Button>
            <Button
              variant={scopeType === 'firm' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeType('firm')}
              aria-pressed={scopeType === 'firm'}
            >
              Firma
            </Button>
            <Button
              variant={scopeType === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setScopeType('custom')}
              aria-pressed={scopeType === 'custom'}
            >
              Egendefinert
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
          <ViewModeToggle fiscalYear={selectedFiscalYear} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShareDialog(true)}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Del
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExportDialog(true)}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Eksporter
          </Button>
        </div>
      </div>

      {scopeType === 'custom' && (
        <div className="pl-14">
          <ClientsMultiSelect />
        </div>
      )}

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />
      
      <ExportReportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />
    </div>
  );
}
