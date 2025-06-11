
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Copy } from 'lucide-react';
import { useClientList } from '@/hooks/useClientList';
import { useClientAuditActions } from '@/hooks/useAuditActions';
import { useCopyActionsFromClient } from '@/hooks/useCopyActionsFromClient';
import { AuditSubjectArea, SUBJECT_AREA_LABELS } from '@/types/audit-actions';

interface CopyFromClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetClientId: string;
  selectedArea: AuditSubjectArea;
  phase?: string;
}

const CopyFromClientDialog = ({ 
  open, 
  onOpenChange, 
  targetClientId, 
  selectedArea,
  phase = 'execution' 
}: CopyFromClientDialogProps) => {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionIds, setSelectedActionIds] = useState<string[]>([]);

  const { data: clients = [], isLoading: clientsLoading } = useClientList();
  const { data: sourceActions = [], isLoading: actionsLoading } = useClientAuditActions(selectedClientId);
  const copyActionsMutation = useCopyActionsFromClient();

  // Filter clients based on search term and exclude target client
  const filteredClients = clients.filter(client => 
    client.id !== targetClientId &&
    (client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     client.org_number.includes(searchTerm))
  );

  // Filter actions by selected area
  const filteredActions = sourceActions.filter(action => 
    action.subject_area === selectedArea
  );

  const handleActionToggle = (actionId: string, checked: boolean) => {
    if (checked) {
      setSelectedActionIds(prev => [...prev, actionId]);
    } else {
      setSelectedActionIds(prev => prev.filter(id => id !== actionId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedActionIds(filteredActions.map(action => action.id));
    } else {
      setSelectedActionIds([]);
    }
  };

  const handleCopy = async () => {
    if (!selectedClientId || selectedActionIds.length === 0) return;

    try {
      await copyActionsMutation.mutateAsync({
        targetClientId,
        sourceClientId: selectedClientId,
        actionIds: selectedActionIds,
        phase
      });
      
      // Reset state and close dialog
      setSelectedClientId('');
      setSelectedActionIds([]);
      setSearchTerm('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error copying actions:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Kopier handlinger fra annen klient</DialogTitle>
          <DialogDescription>
            Velg klient og handlinger å kopiere til {SUBJECT_AREA_LABELS[selectedArea]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client search and selection */}
          <div className="space-y-2">
            <Label>Søk etter klient</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Søk på firmanavn eller org.nr..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Client selector */}
          <div className="space-y-2">
            <Label>Velg klient</Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger>
                <SelectValue placeholder="Velg en klient..." />
              </SelectTrigger>
              <SelectContent>
                {filteredClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company_name} ({client.org_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions list */}
          {selectedClientId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Handlinger i {SUBJECT_AREA_LABELS[selectedArea]}</Label>
                {filteredActions.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedActionIds.length === filteredActions.length}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">Velg alle</span>
                  </div>
                )}
              </div>

              {actionsLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Laster handlinger...
                </div>
              ) : filteredActions.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Ingen handlinger funnet for {SUBJECT_AREA_LABELS[selectedArea]}
                </div>
              ) : (
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {filteredActions.map((action) => (
                    <div key={action.id} className="flex items-start space-x-3 p-3 border-b last:border-b-0">
                      <Checkbox
                        checked={selectedActionIds.includes(action.id)}
                        onCheckedChange={(checked) => handleActionToggle(action.id, checked as boolean)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{action.name}</p>
                        {action.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {action.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {action.action_type}
                          </span>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {action.risk_level}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={copyActionsMutation.isPending}
          >
            Avbryt
          </Button>
          <Button
            onClick={handleCopy}
            disabled={!selectedClientId || selectedActionIds.length === 0 || copyActionsMutation.isPending}
            className="gap-2"
          >
            <Copy size={16} />
            {copyActionsMutation.isPending 
              ? 'Kopierer...' 
              : `Kopier ${selectedActionIds.length} handlinger`
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CopyFromClientDialog;
