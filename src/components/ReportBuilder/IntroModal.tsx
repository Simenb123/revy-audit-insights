import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface IntroModalProps {
  open: boolean;
  onClose: () => void;
}

export function IntroModal({ open, onClose }: IntroModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kom i gang</DialogTitle>
          <DialogDescription>
            En kort guide for å starte med rapportbyggeren
          </DialogDescription>
        </DialogHeader>
        <ul className="list-disc pl-4 text-sm space-y-1 text-muted-foreground">
          <li>Legg til widgets fra biblioteket for å bygge rapporten.</li>
          <li>Dra og slipp for å endre plassering.</li>
          <li>Lagre rapporten når du er fornøyd.</li>
        </ul>
        <div className="mt-4 flex justify-end">
          <Button onClick={onClose}>Skjønner</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
