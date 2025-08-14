import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useScope } from '@/contexts/ScopeContext';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useWidgetManager } from '@/contexts/WidgetManagerContext';
import { exportReportToPDF } from '@/utils/reportExport';
import { useToast } from '@/hooks/use-toast';

interface ExportReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportReportDialog({ open, onOpenChange }: ExportReportDialogProps) {
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  
  const { scopeType, selectedClientIds } = useScope();
  const { selectedFiscalYear } = useFiscalYear();
  const { widgets, layouts } = useWidgetManager();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const metadata = {
        scope: scopeType,
        fiscalYear: selectedFiscalYear,
        clientCount: selectedClientIds.length,
        exportDate: new Date().toLocaleDateString('nb-NO'),
        totalWidgets: widgets.length
      };

      if (format === 'pdf') {
        await exportReportToPDF(widgets, layouts, metadata);
        toast({
          title: "Rapport eksportert",
          description: "PDF-rapporten er lastet ned til din enhet.",
        });
      } else {
        // Excel export placeholder
        toast({
          title: "Kommer snart",
          description: "Excel-eksport er under utvikling.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Eksportfeil",
        description: "Kunne ikke eksportere rapporten. Prøv igjen.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Eksporter rapport</DialogTitle>
          <DialogDescription>
            Velg format for eksport av rapporten med {widgets.length} widgets.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="format" className="text-right">
              Format
            </Label>
            <Select value={format} onValueChange={(value: 'pdf' | 'excel') => setFormat(value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel (kommer snart)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <div>Omfang: {scopeType === 'client' ? 'Enkelt klient' : scopeType === 'firm' ? 'Hele firmaet' : 'Egendefinert'}</div>
            <div>År: {selectedFiscalYear}</div>
            <div>Klienter: {selectedClientIds.length}</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? 'Eksporterer...' : 'Eksporter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}