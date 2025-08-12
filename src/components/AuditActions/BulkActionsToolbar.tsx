import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog';
import { Circle, Clock, CheckCircle, Trash2 } from 'lucide-react';

export type BulkStatus = 'not_started' | 'in_progress' | 'completed' | 'reviewed' | 'approved';

interface BulkActionsToolbarProps {
  selectedCount: number;
  disabled?: boolean;
  onStatus: (status: BulkStatus) => void;
  onDeleteConfirm: () => void;
  onClear: () => void;
  confirmOpen: boolean;
  setConfirmOpen: (open: boolean) => void;
}

const BulkActionsToolbar: React.FC<BulkActionsToolbarProps> = ({
  selectedCount,
  disabled = false,
  onStatus,
  onDeleteConfirm,
  onClear,
  confirmOpen,
  setConfirmOpen,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">{selectedCount} valgt</span>
      <Button
        size="sm"
        variant="secondary"
        disabled={disabled}
        onClick={() => onStatus('not_started')}
        className="gap-1"
        title="Sett status til Ikke startet (1)"
        aria-label="Sett status til Ikke startet"
      >
        <Circle size={14} /> Ikke startet
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={disabled}
        onClick={() => onStatus('in_progress')}
        className="gap-1"
        title="Sett status til Pågår (2)"
        aria-label="Sett status til Pågår"
      >
        <Clock size={14} /> Pågår
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={disabled}
        onClick={() => onStatus('completed')}
        className="gap-1"
        title="Sett status til Fullført (3)"
        aria-label="Sett status til Fullført"
      >
        <CheckCircle size={14} /> Fullført
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={disabled}
        onClick={() => onStatus('reviewed')}
        title="Markér som gjennomgått (R)"
        aria-label="Markér som gjennomgått"
      >
        Markér som gjennomgått
      </Button>
      <Button
        size="sm"
        variant="secondary"
        disabled={disabled}
        onClick={() => onStatus('approved')}
        title="Markér som godkjent (G)"
        aria-label="Markér som godkjent"
      >
        Markér som godkjent
      </Button>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogTrigger asChild>
          <Button
            size="sm"
            variant="destructive"
            disabled={disabled}
            className="gap-1"
            title="Slett valgte (Delete)"
            aria-label="Slett valgte"
          >
            <Trash2 size={14} /> Slett
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slette {selectedCount} handling(er)?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette kan ikke angres. Valgte handlinger blir permanent fjernet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteConfirm}>
              Bekreft sletting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button
        size="sm"
        variant="outline"
        onClick={onClear}
        disabled={disabled}
        title="Fjern valg (Esc)"
        aria-label="Fjern valg"
      >
        Fjern valg
      </Button>
    </div>
  );
};

export default BulkActionsToolbar;
