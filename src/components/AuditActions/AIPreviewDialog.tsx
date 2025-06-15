
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import VersionDiffViewer from './VersionDiffViewer';

interface AIPreviewDialogProps {
  isOpen: boolean;
  onClose: (approved: boolean) => void;
  originalContent: string;
  suggestedContent: string;
}

const AIPreviewDialog: React.FC<AIPreviewDialogProps> = ({ isOpen, onClose, originalContent, suggestedContent }) => {

  const handleApprove = () => onClose(true);
  const handleReject = () => onClose(false);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) handleReject(); // Behandle Esc/overlay-klikk som avvisning
    }}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Forhåndsvisning av AI-forslag</DialogTitle>
          <DialogDescription>
            Se gjennom endringene foreslått av Revy AI. Godkjenn for å bruke endringene, eller avvis for å beholde originalen.
          </DialogDescription>
        </DialogHeader>
        <VersionDiffViewer oldContent={originalContent} newContent={suggestedContent} />
        <DialogFooter>
          <Button variant="outline" onClick={handleReject}>Avvis</Button>
          <Button onClick={handleApprove}>Godkjenn og bruk</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIPreviewDialog;
