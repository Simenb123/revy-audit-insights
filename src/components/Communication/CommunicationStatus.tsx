
import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useChatRooms } from '@/hooks/useChatRooms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Users, MessageSquare, Building2 } from 'lucide-react';
import CreateTestDataButton from './CreateTestDataButton';

const CommunicationStatus = () => {
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useUserProfile();
  const { data: teamRooms } = useChatRooms('team');
  const { data: departmentRooms } = useChatRooms('department');
  const { data: firmRooms } = useChatRooms('firm');

  console.log('CommunicationStatus - userProfile:', userProfile);
  console.log('CommunicationStatus - profileLoading:', profileLoading);
  console.log('CommunicationStatus - profileError:', profileError);

  if (profileLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // Handle case where profile doesn't exist or failed to load
  const hasAuditFirm = !!userProfile?.auditFirmId;
  const hasDepartment = !!userProfile?.departmentId;
  const hasTeamRooms = (teamRooms?.length || 0) > 0;
  const hasDepartmentRooms = (departmentRooms?.length || 0) > 0;
  const hasFirmRooms = (firmRooms?.length || 0) > 0;

  const isFullyConfigured = hasAuditFirm && hasDepartment && (hasTeamRooms || hasDepartmentRooms || hasFirmRooms);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Status for kommunikasjonssystem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profileError && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                Kunne ikke laste brukerprofil. Dette kan være fordi du ikke er autentisert eller ikke har opprettet en profil ennå.
              </p>
            </div>
          )}

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasAuditFirm ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-orange-500" />}
                <span>Revisjonsfirma</span>
              </div>
              <Badge variant={hasAuditFirm ? "default" : "secondary"}>
                {hasAuditFirm ? "Konfigurert" : "Mangler"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasDepartment ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-orange-500" />}
                <span>Avdeling</span>
              </div>
              <Badge variant={hasDepartment ? "default" : "secondary"}>
                {hasDepartment ? "Konfigurert" : "Mangler"}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Team-chatter</span>
              </div>
              <Badge variant={hasTeamRooms ? "default" : "secondary"}>
                {teamRooms?.length || 0} tilgjengelig
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>Avdelings-chatter</span>
              </div>
              <Badge variant={hasDepartmentRooms ? "default" : "secondary"}>
                {departmentRooms?.length || 0} tilgjengelig
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Firma-chatter</span>
              </div>
              <Badge variant={hasFirmRooms ? "default" : "secondary"}>
                {firmRooms?.length || 0} tilgjengelig
              </Badge>
            </div>
          </div>

          {!isFullyConfigured && (
            <div className="pt-4 border-t">
              <div className="flex flex-col gap-3">
                <p className="text-sm text-muted-foreground">
                  For å teste kommunikasjonssystemet trenger du testdata. Klikk knappen under for å opprette automatisk.
                </p>
                <CreateTestDataButton />
              </div>
            </div>
          )}

          {isFullyConfigured && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Kommunikasjonssystemet er klart for bruk!</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunicationStatus;
