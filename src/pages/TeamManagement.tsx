
import React, { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useClientTeams } from '@/hooks/useClientTeams';
import { useDepartments } from '@/hooks/useDepartments';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';
import TeamList from '@/components/Teams/TeamList';
import CreateTeamDialog from '@/components/Teams/CreateTeamDialog';
import TeamDetails from '@/components/Teams/TeamDetails';
import { ClientTeam } from '@/types/organization';

const TeamManagement = () => {
  const { data: userProfile } = useUserProfile();
  const { data: teams = [], isLoading, refetch } = useClientTeams();
  const { data: departments = [] } = useDepartments();
  const [selectedTeam, setSelectedTeam] = useState<ClientTeam | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Laster team...</p>
        </div>
      </div>
    );
  }

  const canCreateTeams = userProfile?.userRole === 'admin' || userProfile?.userRole === 'partner' || userProfile?.userRole === 'manager';

  return (
    <div className="w-full px-4 py-6 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground mt-1">
            Administrer team og tildel medlemmer til klientprosjekter
          </p>
        </div>
        {canCreateTeams && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Opprett team
          </Button>
        )}
      </div>

      <Tabs defaultValue="teams" className="space-y-6">
        <TabsList>
          <TabsTrigger value="teams">Mine team</TabsTrigger>
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
        </TabsList>

        <TabsContent value="teams" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <TeamList 
                    teams={teams}
                    selectedTeam={selectedTeam}
                    onSelectTeam={setSelectedTeam}
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="lg:col-span-2">
              {selectedTeam ? (
                <TeamDetails team={selectedTeam} onUpdate={refetch} />
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center h-64">
                    <p className="text-muted-foreground">Velg et team for å se detaljer</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Team oversikt</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <h3 className="text-2xl font-bold">{teams.length}</h3>
                  <p className="text-sm text-muted-foreground">Totalt antall team</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <h3 className="text-2xl font-bold">{teams.filter(t => t.isActive).length}</h3>
                  <p className="text-sm text-muted-foreground">Aktive team</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <h3 className="text-2xl font-bold">{departments.length}</h3>
                  <p className="text-sm text-muted-foreground">Avdelinger</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <CreateTeamDialog 
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onTeamCreated={refetch}
      />
    </div>
  );
};

export default TeamManagement;
