
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CopyFromClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetClientId: string;
  selectedArea: string;
  phase: string;
}

const CopyFromClientDialog = ({ 
  open, 
  onOpenChange, 
  targetClientId, 
  selectedArea, 
  phase 
}: CopyFromClientDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kopier handlinger fra annen klient</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            Funksjonalitet for å kopiere handlinger fra andre klienter kommer snart.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Målklient: {targetClientId}, Område: {selectedArea}, Fase: {phase}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CopyFromClientDialog;
