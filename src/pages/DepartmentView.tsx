
import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useDepartments } from '@/hooks/useDepartments';
import { useClientTeams } from '@/hooks/useClientTeams';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Briefcase, MessageSquare } from 'lucide-react';

const DepartmentView = () => {
  const { data: userProfile } = useUserProfile();
  const { data: departments } = useDepartments();
  const { data: clientTeams } = useClientTeams();

  const userDepartment = departments?.find(dept => dept.id === userProfile?.departmentId);

  if (!userProfile || !userDepartment) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Du er ikke tilknyttet en avdeling</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{userDepartment.name}</h1>
          {userDepartment.description && (
            <p className="text-muted-foreground mt-1">{userDepartment.description}</p>
          )}
        </div>
        <Badge variant="outline">Min avdeling</Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Active Teams */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive team</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientTeams?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Revisjonsteam i avdelingen
            </p>
          </CardContent>
        </Card>

        {/* My Role */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Min rolle</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold capitalize">
              {userProfile.userRole === 'admin' && 'Administrator'}
              {userProfile.userRole === 'partner' && 'Partner'}
              {userProfile.userRole === 'manager' && 'Manager'}
              {userProfile.userRole === 'employee' && 'Medarbeider'}
            </div>
            <p className="text-xs text-muted-foreground">
              I {userDepartment.name}
            </p>
          </CardContent>
        </Card>

        {/* Department Communication */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kommunikasjon</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">Avdelingschat</div>
            <p className="text-xs text-muted-foreground">
              Kommuniser med avdelingen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Teams Overview */}
      {clientTeams && clientTeams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mine revisjonsteam</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clientTeams.map((team) => (
                <div key={team.id} className="p-4 border rounded-lg">
                  <h3 className="font-semibold">{team.name}</h3>
                  {team.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {team.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline">Aktivt</Badge>
                    {team.startDate && (
                      <span className="text-xs text-muted-foreground">
                        Start: {new Date(team.startDate).toLocaleDateString('nb-NO')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DepartmentView;
