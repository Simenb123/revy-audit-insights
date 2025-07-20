import { logger } from '@/utils/logger';

import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useDepartments } from '@/hooks/useDepartments';
import { useClientTeams } from '@/hooks/useClientTeams';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Users, Briefcase, ArrowLeft, Settings, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';
import FlexibleGrid from '@/components/Layout/FlexibleGrid';
import ConstrainedWidth from '@/components/Layout/ConstrainedWidth';
import PageHeader from '@/components/Layout/PageHeader';
import { logger } from '@/utils/logger';

const OrganizationOverview = () => {
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const { data: departments = [], isLoading: departmentsLoading } = useDepartments();
  const { data: teams = [], isLoading: teamsLoading } = useClientTeams();

  logger.log('OrganizationOverview rendering with profile:', userProfile);

  if (profileLoading) {
    return (
      <ConstrainedWidth width="medium">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </ConstrainedWidth>
    );
  }

  if (!userProfile) {
    return (
      <ConstrainedWidth width="medium">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 mb-4">Kunne ikke laste brukerdata</p>
            <Link to="/dashboard">
              <Button>Tilbake til hovedmeny</Button>
            </Link>
          </CardContent>
        </Card>
      </ConstrainedWidth>
    );
  }

  const userDepartment = departments.find(d => d.id === userProfile.departmentId);
  const activeTeams = teams.filter(t => t.isActive);
  const isAdmin = userProfile.userRole === 'admin' || userProfile.userRole === 'partner';

  return (
    <ConstrainedWidth width="wide">
      <StandardPageLayout
        header={
          <div className="flex justify-between items-center">
            <PageHeader
              title="Organisasjonsoversikt"
              subtitle="Oversikt over din organisasjon og rolle"
            />
            <Link to="/dashboard">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Tilbake
              </Button>
            </Link>
          </div>
        }
      >
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Din profil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <div className="flex justify-between">
                <span className="font-medium">Navn:</span>
                <span>{userProfile.firstName} {userProfile.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">E-post:</span>
                <span>{userProfile.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Rolle:</span>
                <span className="font-semibold capitalize">{userProfile.userRole}</span>
              </div>
              {userProfile.workplaceCompanyName && (
                <div className="flex justify-between">
                  <span className="font-medium">Firma:</span>
                  <span>{userProfile.workplaceCompanyName}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <FlexibleGrid columns={{ sm: 1, md: 3 }} gap="md">
          <Card>
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <Building2 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h3 className="text-2xl font-bold">{departmentsLoading ? '...' : departments.length}</h3>
                <p className="text-sm text-muted-foreground">Avdelinger</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <Briefcase className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h3 className="text-2xl font-bold">{teamsLoading ? '...' : activeTeams.length}</h3>
                <p className="text-sm text-muted-foreground">Aktive team</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="flex items-center justify-center p-6">
              <div className="text-center">
                <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <h3 className="text-2xl font-bold">1</h3>
                <p className="text-sm text-muted-foreground">Ditt firma</p>
              </div>
            </CardContent>
          </Card>
        </FlexibleGrid>

        {/* Department Info */}
        <Card>
          <CardHeader>
            <CardTitle>Min avdeling</CardTitle>
          </CardHeader>
          <CardContent>
            {userDepartment ? (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{userDepartment.name}</h3>
                {userDepartment.description && (
                  <p className="text-muted-foreground">{userDepartment.description}</p>
                )}
                <Button asChild variant="outline" className="mt-2">
                  <Link to="/avdeling">Se avdelingsdetaljer</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">
                  {departmentsLoading ? 'Laster avdelingsdata...' : 'Du er ikke tilordnet en avdeling ennå.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Hurtighandlinger</CardTitle>
          </CardHeader>
          <CardContent>
            <FlexibleGrid columns={{ sm: 1, md: 3 }} gap="md">
              <Button asChild className="h-16 flex-col">
                <Link to="/team">
                  <Briefcase className="h-5 w-5 mb-1" />
                  Mine team
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="h-16 flex-col">
                <Link to="/kommunikasjon">
                  <MessageSquare className="h-5 w-5 mb-1" />
                  Kommunikasjon
                </Link>
              </Button>
              
              {isAdmin && (
                <Button asChild variant="outline" className="h-16 flex-col">
                  <Link to="/organisasjonsinnstillinger">
                    <Settings className="h-5 w-5 mb-1" />
                    Innstillinger
                  </Link>
                </Button>
              )}
            </FlexibleGrid>
          </CardContent>
        </Card>
      </StandardPageLayout>
    </ConstrainedWidth>
  );
};

export default OrganizationOverview;
