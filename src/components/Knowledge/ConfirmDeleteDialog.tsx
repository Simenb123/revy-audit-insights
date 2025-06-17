
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  itemName: string;
  itemType: string;
  usageCount?: number;
  consequences?: string[];
}

const ConfirmDeleteDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  itemName,
  itemType,
  usageCount = 0,
  consequences = []
}: ConfirmDeleteDialogProps) => {
  const hasUsage = usageCount > 0;
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Er du sikker på at du vil slette <strong>{itemType}</strong> "{itemName}"?
            </p>
            
            {hasUsage && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive font-medium mb-2">
                  ⚠️ Dette elementet er i bruk:
                </p>
                <Badge variant="destructive">
                  {usageCount} {usageCount === 1 ? 'artikkel' : 'artikler'} påvirkes
                </Badge>
              </div>
            )}
            
            {consequences.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Konsekvenser av sletting:</p>
                <ul className="text-sm space-y-1">
                  {consequences.map((consequence, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-destructive">•</span>
                      {consequence}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground">
              {hasUsage 
                ? 'Du må først fjerne alle tilkoblinger før du kan slette dette elementet.'
                : 'Denne handlingen kan ikke angres.'
              }
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Avbryt</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={hasUsage}
          >
            {hasUsage ? 'Kan ikke slette' : 'Slett'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ConfirmDeleteDialog;
