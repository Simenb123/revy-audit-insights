import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
import { MoreHorizontal, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { useUpdateClientAuditAction } from '@/hooks/useAuditActions';
import { useStartTimeTracking } from '@/hooks/useStartTimeTracking';
import { useCompleteAction } from '@/hooks/useCompleteAction';
import { useDeleteClientAction } from '@/hooks/audit-actions/useDeleteClientAction';
import { ClientAuditAction } from '@/types/audit-actions';

interface ActionQuickActionsProps {
  action: ClientAuditAction;
  onEdit?: () => void;
  isSystemTemplate?: boolean;
}

const ActionQuickActions = ({ action, onEdit, isSystemTemplate = false }: ActionQuickActionsProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const updateMutation = useUpdateClientAuditAction();
  const startTrackingMutation = useStartTimeTracking();
  const completeMutation = useCompleteAction();
  const deleteMutation = useDeleteClientAction();

  const handleStatusChange = async (newStatus: string) => {
    try {
      if (newStatus === 'in_progress') {
        await startTrackingMutation.mutateAsync({
          actionId: action.id,
          clientId: action.client_id
        });
      } else if (newStatus === 'completed') {
        await completeMutation.mutateAsync({
          actionId: action.id,
          clientId: action.client_id
        });
      } else {
        await updateMutation.mutateAsync({
          id: action.id,
          updates: { status: newStatus as any }
        });
      }
    } catch (error) {
      logger.error('Error updating action status:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        actionId: action.id,
        clientId: action.client_id
      });
      setDeleteDialogOpen(false);
    } catch (error) {
      logger.error('Error deleting action:', error);
    }
  };

  const isLoading = updateMutation.isPending || startTrackingMutation.isPending || 
                    completeMutation.isPending || deleteMutation.isPending;

  // Determine primary action based on status
  const getPrimaryAction = () => {
    switch (action.status) {
      case 'not_started':
      case 'in_progress':
        return { label: 'Marker som fullført', status: 'completed' };
      case 'completed':
        return { label: 'Marker som gjennomgått', status: 'reviewed' };
      case 'reviewed':
        return { label: 'Godkjenn', status: 'approved' };
      default:
        return null;
    }
  };

  const primaryAction = getPrimaryAction();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isLoading}>
            <MoreHorizontal size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {primaryAction && (
            <DropdownMenuItem onClick={() => handleStatusChange(primaryAction.status)}>
              <CheckCircle size={16} className="mr-2" />
              {primaryAction.label}
            </DropdownMenuItem>
          )}

          {onEdit && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onEdit}>
                <Edit size={16} className="mr-2" />
                Rediger detaljer
              </DropdownMenuItem>
            </>
          )}

          {!isSystemTemplate && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 size={16} className="mr-2" />
                Slett handling
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slette handling?</AlertDialogTitle>
            <AlertDialogDescription>
              Dette kan ikke angres. Handlingen vil bli permanent fjernet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Bekreft sletting
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ActionQuickActions;
