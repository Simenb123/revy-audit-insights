
import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAllUserProfiles } from '@/hooks/useAllUserProfiles';
import { useUpdateUserRole } from '@/hooks/useUpdateUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield } from 'lucide-react';
import type { UserRole } from '@/types/organization';
import PageLayout from '@/components/Layout/PageLayout';
import ConstrainedWidth from '@/components/Layout/ConstrainedWidth';
import PageHeader from '@/components/Layout/PageHeader';

const RoleAccessAdmin = () => {
  const { data: userProfile } = useUserProfile();
  const { data: users, isLoading } = useAllUserProfiles();
  const updateRole = useUpdateUserRole();

  const canAccess = userProfile?.userRole === 'admin' || userProfile?.userRole === 'partner';

  if (!canAccess) {
    return (
      <ConstrainedWidth width="medium">
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Tilgang nektet</h2>
            <p className="text-muted-foreground">Du har ikke tilgang til rolleadministrasjon.</p>
          </CardContent>
        </Card>
      </ConstrainedWidth>
    );
  }

  return (
    <PageLayout
      width="full"
      header={
        <PageHeader
          title="Rolleadministrasjon"
          subtitle="Endre roller for brukere i organisasjonen"
        />
      }
    >
        <Card>
          <CardHeader>
            <CardTitle>Brukere</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && <p>Laster...</p>}
            {users && users.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="py-2">Navn</th>
                      <th className="py-2">E-post</th>
                      <th className="py-2">Rolle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-t">
                        <td className="py-2">{u.first_name} {u.last_name}</td>
                        <td className="py-2">{u.email}</td>
                        <td className="py-2">
                          <div className="flex items-center gap-2">
                            <Select
                              value={u.user_role}
                              onValueChange={(value: UserRole) => updateRole.mutate({ userId: u.id, role: value })}
                            >
                              <SelectTrigger className="w-[150px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="partner">Partner</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="employee">Employee</SelectItem>
                              </SelectContent>
                            </Select>
                            {updateRole.isPending && updateRole.variables?.userId === u.id && (
                              <span>Oppdaterer...</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {users && users.length === 0 && <p>Ingen brukere funnet.</p>}
          </CardContent>
        </Card>
      </PageLayout>
  );
};

export default RoleAccessAdmin;
