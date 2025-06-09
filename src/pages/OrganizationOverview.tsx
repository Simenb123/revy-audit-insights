
import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuditFirm } from '@/hooks/useAuditFirm';
import { useDepartments } from '@/hooks/useDepartments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, UserCheck, Calendar } from 'lucide-react';

const OrganizationOverview = () => {
  const { data: userProfile } = useUserProfile();
  const { data: auditFirm } = useAuditFirm();
  const { data: departments } = useDepartments();

  if (!userProfile || !auditFirm) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-muted-foreground">Ingen organisasjonsinformasjon tilgjengelig</p>
        </div>
      </div>
    );
  }

  const getUserRoleBadge = (role: string) => {
    const roleColors = {
      admin: 'bg-red-100 text-red-800',
      partner: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800',
      employee: 'bg-gray-100 text-gray-800'
    };
    
    const roleLabels = {
      admin: 'Administrator',
      partner: 'Partner',
      manager: 'Manager',
      employee: 'Medarbeider'
    };

    return (
      <Badge className={roleColors[role as keyof typeof roleColors] || roleColors.employee}>
        {roleLabels[role as keyof typeof roleLabels] || role}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Organisasjonsoversikt</h1>
        {getUserRoleBadge(userProfile.userRole)}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Firm Information */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revisjonsfirma</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditFirm.name}</div>
            {auditFirm.orgNumber && (
              <p className="text-xs text-muted-foreground">
                Org.nr: {auditFirm.orgNumber}
              </p>
            )}
            {auditFirm.city && (
              <p className="text-xs text-muted-foreground">
                {auditFirm.city}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Departments Count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avdelinger</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Aktive avdelinger
            </p>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Min profil</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {userProfile.firstName} {userProfile.lastName}
            </div>
            <p className="text-xs text-muted-foreground">
              {userProfile.email}
            </p>
            {userProfile.hireDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Ansatt siden: {new Date(userProfile.hireDate).toLocaleDateString('nb-NO')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Departments List */}
      {departments && departments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Avdelinger</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {departments.map((dept) => (
                <div key={dept.id} className="p-4 border rounded-lg">
                  <h3 className="font-semibold">{dept.name}</h3>
                  {dept.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {dept.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline">
                      {userProfile.departmentId === dept.id ? 'Min avdeling' : 'Annen avdeling'}
                    </Badge>
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

export default OrganizationOverview;
