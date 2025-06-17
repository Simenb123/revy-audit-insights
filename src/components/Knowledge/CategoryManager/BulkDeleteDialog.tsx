
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

interface BulkDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  categoryName: string;
  subcategoriesCount: number;
  articlesCount: number;
}

const BulkDeleteDialog = ({
  open,
  onOpenChange,
  onConfirm,
  categoryName,
  subcategoriesCount,
  articlesCount
}: BulkDeleteDialogProps) => {
  const totalItems = subcategoriesCount + articlesCount;
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Slett kategori og alt innhold
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Er du sikker på at du vil slette kategorien <strong>"{categoryName}"</strong> og alt innhold?
            </p>
            
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive font-medium mb-2">
                ⚠️ Dette vil permanent slette:
              </p>
              <div className="space-y-1">
                {subcategoriesCount > 0 && (
                  <Badge variant="destructive">
                    {subcategoriesCount} underkategorier
                  </Badge>
                )}
                {articlesCount > 0 && (
                  <Badge variant="destructive">
                    {articlesCount} artikler
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Konsekvenser:</p>
              <ul className="text-sm space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  Alle underkategorier slettes permanent
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  Alle artikler i kategorien slettes permanent
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  Handlingen kan ikke angres
                </li>
              </ul>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Dette er en destruktiv handling som ikke kan angres.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Avbryt</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Slett alt ({totalItems} elementer)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BulkDeleteDialog;
