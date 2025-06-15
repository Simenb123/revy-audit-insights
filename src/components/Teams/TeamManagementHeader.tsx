
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface TeamManagementHeaderProps {
  canCreateTeams: boolean;
  onCreateTeam: () => void;
}

const TeamManagementHeader = ({ canCreateTeams, onCreateTeam }: TeamManagementHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h1 className="text-3xl font-bold">Team Management</h1>
        <p className="text-muted-foreground mt-1">
          Administrer team og tildel medlemmer til klientprosjekter
        </p>
      </div>
      {canCreateTeams && (
        <Button onClick={onCreateTeam}>
          <Plus className="h-4 w-4 mr-2" />
          Opprett team
        </Button>
      )}
    </div>
  );
};

export default TeamManagementHeader;
