import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { Trash2 } from 'lucide-react';
import { useDeleteAccountingVersion } from '@/hooks/useVersionManagement';

interface VersionDeleteButtonProps {
  versionId: string;
  versionLabel: string;
  isActive?: boolean;
  onDeleted?: () => void;
}

export const VersionDeleteButton: React.FC<VersionDeleteButtonProps> = ({
  versionId,
  versionLabel,
  isActive = false,
  onDeleted
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const deleteVersion = useDeleteAccountingVersion();

  const handleDelete = async () => {
    try {
      await deleteVersion.mutateAsync(versionId);
      setIsOpen(false);
      onDeleted?.();
    } catch (error) {
      // Error handling is done in the hook
      console.error('Delete failed:', error);
    }
  };

  if (isActive) {
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        disabled 
        className="text-muted-foreground"
      >
        <Trash2 className="h-3 w-3 mr-1" />
        Aktiv versjon
      </Button>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          disabled={deleteVersion.isPending}
        >
          <Trash2 className="h-3 w-3 mr-1" />
          Slett
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Slett hovedboksversjon</AlertDialogTitle>
          <AlertDialogDescription>
            Er du sikker på at du vil slette "{versionLabel}"?
            <br /><br />
            <strong>Dette vil permanent slette:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Alle transaksjoner knyttet til denne versjonen</li>
              <li>Alle analyseresultater basert på disse dataene</li>
              <li>Alle rapporter generert fra denne versjonen</li>
            </ul>
            <br />
            <strong className="text-destructive">Denne handlingen kan ikke angres.</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Avbryt</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={deleteVersion.isPending}
          >
            {deleteVersion.isPending ? 'Sletter...' : 'Slett versjon'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};