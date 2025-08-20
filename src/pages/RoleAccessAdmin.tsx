
import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAllUserProfiles } from '@/hooks/useAllUserProfiles';
import { useUpdateUserRole } from '@/hooks/useUpdateUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';
import type { UserRole } from '@/types/organization';
import PageLayout from '@/components/Layout/PageLayout';
import ConstrainedWidth from '@/components/Layout/ConstrainedWidth';
import { usePageTitle } from '@/components/Layout/PageTitleContext';
import SecureRoleSelect from '@/components/Security/SecureRoleSelect';
import { useToast } from '@/hooks/use-toast';
import RoleDisplay from '@/components/Profile/RoleDisplay';

const RoleAccessAdmin = () => {
  const { data: userProfile } = useUserProfile();
  const { data: users, isLoading } = useAllUserProfiles();
  const updateRole = useUpdateUserRole();
  const { setPageTitle } = usePageTitle();
  const { toast } = useToast();

  React.useEffect(() => {
    setPageTitle('Rolleadministrasjon');
  }, [setPageTitle]);

  const handleRoleChange = (userId: string, role: UserRole) => {
    updateRole.mutate(
      { userId, role },
      {
        onSuccess: () => {
          toast({
            title: "Rolle oppdatert",
            description: "Brukerens rolle har blitt oppdatert.",
          });
        },
        onError: (error) => {
          toast({
            title: "Feil ved oppdatering",
            description: error.message || "Kunne ikke oppdatere brukerens rolle.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const canAccess = userProfile?.userRole === 'admin' || userProfile?.userRole === 'partner';

  if (!canAccess) {
    return (
      <ConstrainedWidth width="full">
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
    <PageLayout width="full">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rolleadministrasjon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-800 mb-1">
                  Sikkerhetsmerknad
                </h4>
                <p className="text-sm text-amber-700">
                  Rolleendringer påvirker brukernes tilgang til systemet. Alle endringer blir logget for revisjon.
                </p>
              </div>
            </div>
          </div>

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
                      <td className="py-2 space-y-2">
                        <RoleDisplay 
                          userRole={u.user_role} 
                          userId={u.id}
                          showBadges={true}
                          className="mb-2"
                        />
                        <SecureRoleSelect
                          currentRole={u.user_role}
                          userId={u.id}
                          userName={`${u.first_name} ${u.last_name}`}
                          onRoleChange={handleRoleChange}
                          isLoading={updateRole.isPending && updateRole.variables?.userId === u.id}
                        />
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
