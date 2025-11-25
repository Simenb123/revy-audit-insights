import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Library } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddActionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectFromTemplates: () => void;
}

const AddActionsDialog = ({
  open,
  onOpenChange,
  onSelectFromTemplates,
}: AddActionsDialogProps) => {
  const handleSelectFromTemplates = () => {
    onSelectFromTemplates();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Legg til handlinger</DialogTitle>
          <DialogDescription>
            Velg handlinger fra malbiblioteket
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <Card
            onClick={handleSelectFromTemplates}
            className={cn(
              "cursor-pointer transition-all hover:border-primary hover:shadow-md",
              "group"
            )}
          >
            <CardContent className="flex flex-col items-center justify-center p-6 space-y-4 text-center">
              <div className="rounded-full bg-primary/10 p-4 group-hover:bg-primary/20 transition-colors">
                <Library className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Velg fra maler</h3>
                <p className="text-sm text-muted-foreground">
                  Bla gjennom malbiblioteket og velg handlinger som passer for denne klienten
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddActionsDialog;
