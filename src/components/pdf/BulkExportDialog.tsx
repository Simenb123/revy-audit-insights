import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { BulkExportProgress } from '@/hooks/useBulkPDFExport';

interface BulkExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: BulkExportProgress;
  onCancel?: () => void;
}

export const BulkExportDialog: React.FC<BulkExportDialogProps> = ({
  open,
  onOpenChange,
  progress,
  onCancel
}) => {
  const progressPercentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {progress.isRunning ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : progress.hasError ? (
              <XCircle className="h-5 w-5 text-destructive" />
            ) : progress.completed > 0 ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : null}
            
            {progress.isRunning ? 'Eksporterer bilag...' : 
             progress.hasError ? 'Eksport feilet' :
             progress.completed > 0 ? 'Eksport fullført' : 'Eksporterer bilag'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Fremdrift</span>
              <span>{progress.completed} av {progress.total}</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>

          {progress.current && (
            <div className="text-sm text-muted-foreground">
              {progress.current}
            </div>
          )}

          {progress.hasError && progress.errorMessage && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {progress.errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-2">
            {progress.isRunning && onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Avbryt
              </Button>
            )}
            
            {!progress.isRunning && (
              <Button onClick={() => onOpenChange(false)}>
                {progress.hasError ? 'Lukk' : 'Ferdig'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};