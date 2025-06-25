
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useClientList } from '@/hooks/useClientList';
import { useClientAuditActions } from '@/hooks/useAuditActions';
import { useCopyActionsFromClient } from '@/hooks/useCopyActionsFromClient';

interface CopyFromClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetClientId: string;
  selectedArea: string;
  phase: string;
}

const CopyFromClientDialog = ({
  open,
  onOpenChange,
  targetClientId,
  selectedArea,
  phase
}: CopyFromClientDialogProps) => {
  const { data: clients = [], isLoading: clientsLoading } = useClientList();
  const [sourceClientId, setSourceClientId] = useState<string>('');
  const { data: sourceActions = [], isLoading: actionsLoading } =
    useClientAuditActions(sourceClientId);
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const copyMutation = useCopyActionsFromClient();

  useEffect(() => {
    setSelectedActions([]);
  }, [sourceClientId]);

  const filteredActions = sourceActions.filter(
    (a) => a.subject_area === selectedArea
  );

  const toggleAction = (id: string, checked: boolean) => {
    setSelectedActions((prev) =>
      checked ? [...prev, id] : prev.filter((a) => a !== id)
    );
  };

  const handleCopy = async () => {
    try {
      await copyMutation.mutateAsync({
        targetClientId,
        sourceClientId,
        actionIds: selectedActions,
        phase
      });
      onOpenChange(false);
    } catch (err) {
      // errors handled in mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kopier handlinger fra annen klient</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="source-client">Kildeklient</Label>
            <Select
              value={sourceClientId}
              onValueChange={setSourceClientId}
            >
              <SelectTrigger id="source-client">
                <SelectValue placeholder="Velg klient" />
              </SelectTrigger>
              <SelectContent>
                {clientsLoading ? (
                  <SelectItem value="" disabled>
                    Laster...
                  </SelectItem>
                ) : (
                  clients
                    .filter((c) => c.id !== targetClientId)
                    .map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name || client.name}
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>

          {sourceClientId && (
            <div className="max-h-60 overflow-auto border rounded-md p-2 space-y-2">
              {actionsLoading ? (
                <p className="text-sm text-muted-foreground">Laster handlinger...</p>
              ) : filteredActions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ingen handlinger i dette fagområdet.</p>
              ) : (
                filteredActions.map((action) => (
                  <div key={action.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`action-${action.id}`}
                      checked={selectedActions.includes(action.id)}
                      onCheckedChange={(checked) =>
                        toggleAction(action.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={`action-${action.id}`} className="text-sm">
                      {action.name}
                    </Label>
                  </div>
                ))
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Avbryt
            </Button>
            <Button
              onClick={handleCopy}
              disabled={
                selectedActions.length === 0 ||
                copyMutation.isPending ||
                !sourceClientId
              }
            >
              {copyMutation.isPending ? 'Kopierer...' : 'Kopier'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CopyFromClientDialog;
