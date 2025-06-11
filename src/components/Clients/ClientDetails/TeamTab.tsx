
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, UserPlus, Crown, Calendar, Mail, Phone } from 'lucide-react';
import { Client } from '@/types/revio';
import { useClientTeams } from '@/hooks/useClientTeams';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import CreateTeamDialog from '@/components/Teams/CreateTeamDialog';
import TeamDetails from '@/components/Teams/TeamDetails';
import TeamList from '@/components/Teams/TeamList';

interface TeamTabProps {
  client: Client;
}

const TeamTab = ({ client }: TeamTabProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const { data: teams = [], refetch: refetchTeams } = useClientTeams(client.id);

  const handleTeamCreated = () => {
    refetchTeams();
    setIsCreateDialogOpen(false);
  };

  const handleTeamUpdate = () => {
    refetchTeams();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Team Management</h2>
          <p className="text-muted-foreground">
            Administrer team og medlemmer for {client.companyName}
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Opprett Team
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team ({teams.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TeamList 
              teams={teams}
              selectedTeam={selectedTeam}
              onSelectTeam={setSelectedTeam}
            />
          </CardContent>
        </Card>

        {/* Team Details */}
        <div className="lg:col-span-2">
          {selectedTeam ? (
            <TeamDetails 
              team={selectedTeam}
              onUpdate={handleTeamUpdate}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Velg et team</h3>
                <p className="text-muted-foreground">
                  Velg et team fra listen til venstre for å se detaljer og administrere medlemmer.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <CreateTeamDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        clientId={client.id}
        onTeamCreated={handleTeamCreated}
      />
    </div>
  );
};

export default TeamTab;
