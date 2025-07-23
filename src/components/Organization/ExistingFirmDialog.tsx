
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building2, UserPlus } from 'lucide-react';

interface ExistingFirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firmName: string;
  onJoinFirm: () => void;
  onCreateNew: () => void;
}

const ExistingFirmDialog = ({ 
  open, 
  onOpenChange, 
  firmName, 
  onJoinFirm, 
  onCreateNew 
}: ExistingFirmDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[var(--content-wide)] w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Firma eksisterer allerede
          </DialogTitle>
          <DialogDescription>
            Et revisjonsfirma med dette organisasjonsnummeret eksisterer allerede i systemet.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium text-sm">{firmName}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Dette firmaet er allerede registrert i Revio
            </p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={onJoinFirm} 
              className="w-full"
              size="lg"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Koble meg til dette firmaet
            </Button>
            
            <Button 
              onClick={onCreateNew} 
              variant="outline" 
              className="w-full"
              size="lg"
            >
              Opprett nytt firma med andre data
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            Ved å koble deg til eksisterende firma vil du få tilgang basert på din rolle
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExistingFirmDialog;
