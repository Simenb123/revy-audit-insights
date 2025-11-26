import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TemplateLibrary from './TemplateLibrary';

interface AddActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  phase?: string;
  onCopyToClient?: (templateIds: string[]) => void;
}

const AddActionsDialog = ({
  open,
  onOpenChange,
  clientId,
  phase,
  onCopyToClient,
}: AddActionsDialogProps) => {
  const handleCopy = (templateIds: string[]) => {
    if (onCopyToClient) {
      onCopyToClient(templateIds);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Legg til handlinger fra maler</DialogTitle>
          <DialogDescription>
            Velg handlinger fra malbiblioteket som passer for denne klienten
          </DialogDescription>
        </DialogHeader>
        
        <TemplateLibrary
          phase={phase}
          onCopyToClient={handleCopy}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddActionsDialog;
