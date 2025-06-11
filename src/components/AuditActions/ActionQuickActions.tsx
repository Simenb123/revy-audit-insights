
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Play, Square, CheckCircle, Clock, Edit } from 'lucide-react';
import { useUpdateClientAuditAction } from '@/hooks/useAuditActions';
import { useStartTimeTracking } from '@/hooks/useStartTimeTracking';
import { useCompleteAction } from '@/hooks/useCompleteAction';
import { ClientAuditAction } from '@/types/audit-actions';

interface ActionQuickActionsProps {
  action: ClientAuditAction;
  onEdit?: () => void;
}

const ActionQuickActions = ({ action, onEdit }: ActionQuickActionsProps) => {
  const updateMutation = useUpdateClientAuditAction();
  const startTrackingMutation = useStartTimeTracking();
  const completeMutation = useCompleteAction();

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
      console.error('Error updating action status:', error);
    }
  };

  const isLoading = updateMutation.isPending || startTrackingMutation.isPending || completeMutation.isPending;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isLoading}>
          <MoreHorizontal size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {action.status === 'not_started' && (
          <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
            <Play size={16} className="mr-2" />
            Start arbeid
          </DropdownMenuItem>
        )}
        
        {action.status === 'in_progress' && (
          <>
            <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
              <CheckCircle size={16} className="mr-2" />
              Marker som fullført
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('not_started')}>
              <Square size={16} className="mr-2" />
              Stopp arbeid
            </DropdownMenuItem>
          </>
        )}
        
        {action.status === 'completed' && (
          <>
            <DropdownMenuItem onClick={() => handleStatusChange('under_review')}>
              <Clock size={16} className="mr-2" />
              Send til gjennomgang
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
              <Play size={16} className="mr-2" />
              Gjenåpne
            </DropdownMenuItem>
          </>
        )}

        {action.status === 'under_review' && (
          <DropdownMenuItem onClick={() => handleStatusChange('completed')}>
            <CheckCircle size={16} className="mr-2" />
            Godkjenn
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onEdit}>
          <Edit size={16} className="mr-2" />
          Rediger detaljer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ActionQuickActions;
