
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface CreateActionTemplateDialogProps {
  selectedArea?: string;
  trigger: React.ReactNode;
}

const CreateActionTemplateDialog = ({ selectedArea, trigger }: CreateActionTemplateDialogProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Opprett ny handlingsmal</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">
            Funksjonalitet for å opprette nye handlingsmaler kommer snart.
          </p>
          {selectedArea && (
            <p className="text-xs text-muted-foreground mt-2">
              Område: {selectedArea}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateActionTemplateDialog;
