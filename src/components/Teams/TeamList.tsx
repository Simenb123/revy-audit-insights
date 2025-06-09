
import React from 'react';
import { ClientTeam } from '@/types/organization';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar } from 'lucide-react';

interface TeamListProps {
  teams: ClientTeam[];
  selectedTeam: ClientTeam | null;
  onSelectTeam: (team: ClientTeam) => void;
}

const TeamList = ({ teams, selectedTeam, onSelectTeam }: TeamListProps) => {
  if (teams.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Ingen team funnet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Opprett ditt første team for å komme i gang
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {teams.map((team) => (
        <Button
          key={team.id}
          variant={selectedTeam?.id === team.id ? "default" : "ghost"}
          className="w-full justify-start h-auto p-3"
          onClick={() => onSelectTeam(team)}
        >
          <div className="flex flex-col items-start w-full">
            <div className="flex items-center justify-between w-full">
              <span className="font-medium">{team.name}</span>
              <Badge variant={team.isActive ? "default" : "secondary"}>
                {team.isActive ? "Aktiv" : "Inaktiv"}
              </Badge>
            </div>
            {team.description && (
              <p className="text-xs text-muted-foreground mt-1 text-left">
                {team.description}
              </p>
            )}
            {team.startDate && (
              <div className="flex items-center gap-1 mt-1">
                <Calendar className="h-3 w-3" />
                <span className="text-xs text-muted-foreground">
                  Fra {new Date(team.startDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </Button>
      ))}
    </div>
  );
};

export default TeamList;
