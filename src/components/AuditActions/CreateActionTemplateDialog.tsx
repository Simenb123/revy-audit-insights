
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import CreateActionTemplateForm from './CreateActionTemplateForm';
import { AuditSubjectArea } from '@/types/audit-actions';

interface CreateActionTemplateDialogProps {
  selectedArea?: AuditSubjectArea;
  trigger?: React.ReactNode;
}

const CreateActionTemplateDialog = ({ selectedArea, trigger }: CreateActionTemplateDialogProps) => {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Ny handlingsmal
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Opprett ny handlingsmal</DialogTitle>
        </DialogHeader>
        <CreateActionTemplateForm 
          selectedArea={selectedArea}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateActionTemplateDialog;
