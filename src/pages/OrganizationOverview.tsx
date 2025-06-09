
import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useDepartments } from '@/hooks/useDepartments';
import { useClientTeams } from '@/hooks/useClientTeams';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Building2, Users, Briefcase, MessageSquare, Plus, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const OrganizationOverview = () => {
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments();
  const { data: teams = [], isLoading: teamsLoading } = useClientTeams();

  if (profileLoading || departmentsLoading || teamsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Laster organisasjonsdata...</p>
        </div>
      </div>
    );
  }

  const userDepartment = departments.find(d => d.id === userProfile?.departmentId);
  const activeTeams = teams.filter(t => t.isActive);

  return (
    <div className="w-full px-4 py-6 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Organisasjonsoversikt</h1>
          <p className="text-muted-foreground mt-1">
            Oversikt over din organisasjon, avdeling og team
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="communication">Kommunikasjon</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <Building2 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold">1</h3>
                  <p className="text-sm text-muted-foreground">Revisjonsfirma</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold">{departments.length}</h3>
                  <p className="text-sm text-muted-foreground">Avdelinger</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <Briefcase className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold">{activeTeams.length}</h3>
                  <p className="text-sm text-muted-foreground">Aktive team</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center justify-center p-6">
                <div className="text-center">
                  <MessageSquare className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <h3 className="text-2xl font-bold">0</h3>
                  <p className="text-sm text-muted-foreground">Nye meldinger</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Department */}
          {userDepartment && (
            <Card>
              <CardHeader>
                <CardTitle>Min avdeling</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{userDepartment.name}</h3>
                  {userDepartment.description && (
                    <p className="text-muted-foreground">{userDepartment.description}</p>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button asChild variant="outline">
                      <Link to="/avdeling">
                        Se avdelingsdetaljer
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Hurtighandlinger</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button asChild className="h-20 flex-col">
                  <Link to="/team">
                    <Briefcase className="h-6 w-6 mb-2" />
                    Administrer team
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="h-20 flex-col">
                  <Link to="/kommunikasjon">
                    <MessageSquare className="h-6 w-6 mb-2" />
                    Kommunikasjon
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="h-20 flex-col">
                  <Link to="/klienter">
                    <Users className="h-6 w-6 mb-2" />
                    Se klienter
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="h-20 flex-col">
                  <Link to="/revisjonslogger">
                    <FileText className="h-6 w-6 mb-2" />
                    Revisjonslogger
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication">
          <Card>
            <CardHeader>
              <CardTitle>Kommunikasjonssystem</CardTitle>
              <p className="text-muted-foreground">
                Kommuniser med teammedlemmer og avdelingen din
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Kommunikasjonssystemet kommer snart</p>
                <p className="text-sm text-muted-foreground">
                  Dette vil inkludere team-chat, kunngjøringer og meldinger
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrganizationOverview;
