import React from 'react';
import { Client } from '@/types/revio';
import NextTaskCard from '../NextTaskCard';
import CompactAccountingStatus from '../CompactAccountingStatus';
import EnhancedClientInfoCard from '../EnhancedClientInfoCard';
import RevisionWorkflow from '../RevisionWorkflow';
import { useClientRoles } from '@/hooks/useClientRoles';
import { AuditPhase } from '@/types/revio';
import { useNavigate, useParams } from 'react-router-dom';

interface OverviewPhaseProps {
  client: Client;
}

const OverviewPhase = ({ client }: OverviewPhaseProps) => {
  const { data: roles = [], isLoading: rolesLoading } = useClientRoles(client.id);
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();

  const handlePhaseClick = (phase: AuditPhase) => {
    if (clientId) {
      navigate(`/clients/${clientId}/${phase}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NextTaskCard client={client} />
        <CompactAccountingStatus client={client} />
        
        {/* Client Status Summary */}
        <div className="bg-white border border-border rounded-lg p-4">
          <h3 className="text-sm font-medium mb-3">Status</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Fremgang</span>
              <span className="text-sm font-medium">{client.progress || 0}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Opprettet</span>
              <span className="text-sm">
                {new Date(client.created_at || '').toLocaleDateString('nb-NO')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Status</span>
              <span className="text-sm font-medium text-green-600">Aktiv</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Enhanced Client Information */}
      <EnhancedClientInfoCard 
        client={client} 
        roles={roles}
      />
    </div>
  );
};

export default OverviewPhase;