
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TeamList from '@/components/Teams/TeamList';
import CreateTeamDialog from '@/components/Teams/CreateTeamDialog';
import TeamDetails from '@/components/Teams/TeamDetails';
import { useTeamManagement } from '@/hooks/useTeamManagement';
import TeamManagementHeader from '@/components/Teams/TeamManagementHeader';
import TeamOverview from '@/components/Teams/TeamOverview';
import ConstrainedWidth from '@/components/Layout/ConstrainedWidth';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';

const TeamManagement = () => {
  const {
    teams,
    isLoading,
    departments,
    selectedTeam,
    setSelectedTeam,
    isCreateDialogOpen,
    setIsCreateDialogOpen,
    canCreateTeams,
    refetchTeams,
  } = useTeamManagement();

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

  return (
    <ConstrainedWidth width="full">
      <StandardPageLayout
        header={
          <TeamManagementHeader
            canCreateTeams={canCreateTeams}
            onCreateTeam={() => setIsCreateDialogOpen(true)}
          />
        }
      >

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
                <TeamDetails team={selectedTeam} onUpdate={refetchTeams} />
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
          <TeamOverview teams={teams} departments={departments} />
        </TabsContent>
      </Tabs>

        <CreateTeamDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onTeamCreated={refetchTeams}
        />
      </StandardPageLayout>
    </ConstrainedWidth>
  );
};

export default TeamManagement;
