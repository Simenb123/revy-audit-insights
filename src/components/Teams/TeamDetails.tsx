
import React, { useState } from 'react';
import { ClientTeam } from '@/types/organization';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Settings, UserPlus } from 'lucide-react';
import TeamMembers from './TeamMembers';
import AddMemberDialog from './AddMemberDialog';
import { useTeamMembers } from '@/hooks/useTeamMembers';

interface TeamDetailsProps {
  team: ClientTeam;
  onUpdate: () => void;
}

const TeamDetails = ({ team, onUpdate }: TeamDetailsProps) => {
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const { data: members = [], refetch: refetchMembers } = useTeamMembers(team.id);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              {team.name}
              <Badge variant={team.isActive ? "default" : "secondary"}>
                {team.isActive ? "Aktiv" : "Inaktiv"}
              </Badge>
            </CardTitle>
            {team.description && (
              <p className="text-muted-foreground mt-2">{team.description}</p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddMemberDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Legg til medlem
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList>
            <TabsTrigger value="members">Medlemmer</TabsTrigger>
            <TabsTrigger value="details">Detaljer</TabsTrigger>
          </TabsList>

          <TabsContent value="members">
            <TeamMembers 
              teamId={team.id}
              members={members}
              onUpdate={refetchMembers}
            />
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Opprettet</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(team.createdAt).toLocaleDateString()}
                </p>
              </div>

              {team.startDate && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Startdato</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(team.startDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {team.endDate && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Sluttdato</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(team.endDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Antall medlemmer</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {members.filter(m => m.isActive).length} aktive medlemmer
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <AddMemberDialog
          open={isAddMemberDialogOpen}
          onOpenChange={setIsAddMemberDialogOpen}
          teamId={team.id}
          onMemberAdded={refetchMembers}
        />
      </CardContent>
    </Card>
  );
};

export default TeamDetails;
