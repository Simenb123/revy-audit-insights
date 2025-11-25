
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CreateActionTemplateForm from '@/components/AuditActions/CreateActionTemplateForm';

interface CreateActionTemplateDialogProps {
  selectedArea?: string;
  trigger: React.ReactNode;
}

const CreateActionTemplateDialog = ({ selectedArea, trigger }: CreateActionTemplateDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Opprett ny handlingsmal</DialogTitle>
        </DialogHeader>
        <CreateActionTemplateForm
          selectedArea={selectedArea}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateActionTemplateDialog;
