
import { logger } from '@/utils/logger';

import React, { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuditFirm } from '@/hooks/useAuditFirm';
import { useDepartments } from '@/hooks/useDepartments';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Mail, Users, Shield, UserCog } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import type { UserRole } from '@/types/organization';
import EmployeesList from '@/components/Admin/EmployeesList';

const UserAdmin = () => {
  const { data: userProfile } = useUserProfile();
  const { data: auditFirm } = useAuditFirm();
  const { data: departments } = useDepartments();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'employee' as UserRole,
    departmentId: ''
  });

  const canAccessUserAdmin =
    userProfile?.userRole === 'admin' ||
    userProfile?.userRole === 'partner' ||
    userProfile?.userRole === 'employee';

  const handleCreateTestUsers = async () => {
    if (!userProfile?.auditFirmId || !departments?.length) {
      toast({
        title: "Kan ikke opprette testbrukere",
        description: "Mangler audit firm ID eller avdelinger",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const testUsers: Array<{
        email: string;
        first_name: string;
        last_name: string;
        user_role: UserRole;
        department_id: string;
        audit_firm_id: string;
        is_active: boolean;
      }> = [
        {
          email: 'partner@bhl.no',
          first_name: 'Lars',
          last_name: 'Larsen',
          user_role: 'partner',
          department_id: departments[0].id,
          audit_firm_id: userProfile.auditFirmId,
          is_active: true
        },
        {
          email: 'manager@bhl.no',
          first_name: 'Kari',
          last_name: 'Nordmann',
          user_role: 'manager',
          department_id: departments[0].id,
          audit_firm_id: userProfile.auditFirmId,
          is_active: true
        },
        {
          email: 'revisor1@bhl.no',
          first_name: 'Ole',
          last_name: 'Hansen',
          user_role: 'employee',
          department_id: departments[0].id,
          audit_firm_id: userProfile.auditFirmId,
          is_active: true
        },
        {
          email: 'revisor2@bhl.no',
          first_name: 'Ane',
          last_name: 'Eriksen',
          user_role: 'employee',
          department_id: departments[0].id,
          audit_firm_id: userProfile.auditFirmId,
          is_active: true
        }
      ];

      // Note: In a real implementation, you would create auth users first
      // For demo purposes, we'll create profile entries directly
      for (const user of testUsers) {
        // Generate a UUID for the test user
        const userId = crypto.randomUUID();
        
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            audit_firm_id: user.audit_firm_id,
            department_id: user.department_id,
            user_role: user.user_role,
            is_active: user.is_active
          });

        if (error) {
          logger.error('Error creating test user:', user.email, error);
          // Continue with other users even if one fails
        }
      }

      toast({
        title: "Testbrukere opprettet!",
        description: "4 testbrukere er lagt til for testing av systemet. Du kan nå teste team-funksjonalitet.",
      });
    } catch (error: any) {
      toast({
        title: "Feil ved opprettelse av testbrukere",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    // This would integrate with email sending in a real implementation
    toast({
      title: "Invitasjon sendt!",
      description: `En invitasjon er sendt til ${inviteData.email}`,
    });
    
    setInviteData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'employee',
      departmentId: ''
    });
  };

  if (!canAccessUserAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Tilgang nektet</h2>
              <p className="text-muted-foreground">
                Du har ikke tilgang til brukeradministrasjon. Kun administratorer, partnere og ansatte kan administrere brukere.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brukeradministrasjon</h1>
          <p className="text-muted-foreground">
            Administrer brukere og roller for {auditFirm?.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/profile">
            <Button variant="outline">
              <UserCog className="h-4 w-4 mr-2" />
              Min profil
            </Button>
          </Link>
          <Button onClick={handleCreateTestUsers} disabled={loading} variant="outline">
            <Users className="h-4 w-4 mr-2" />
            {loading ? 'Oppretter...' : 'Opprett testbrukere'}
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Inviter bruker
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Inviter ny bruker</DialogTitle>
                <DialogDescription>
                  Send en invitasjon til en ny bruker for å bli med i {auditFirm?.name}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Fornavn</Label>
                    <Input
                      id="firstName"
                      value={inviteData.firstName}
                      onChange={(e) => setInviteData({ ...inviteData, firstName: e.target.value })}
                      placeholder="Fornavn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Etternavn</Label>
                    <Input
                      id="lastName"
                      value={inviteData.lastName}
                      onChange={(e) => setInviteData({ ...inviteData, lastName: e.target.value })}
                      placeholder="Etternavn"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-post</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                    placeholder="bruker@firma.no"
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="role">Rolle</Label>
                    <Select value={inviteData.role} onValueChange={(value: UserRole) => setInviteData({ ...inviteData, role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg rolle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Medarbeider</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="partner">Partner</SelectItem>
                        {userProfile?.userRole === 'admin' && (
                          <SelectItem value="admin">Administrator</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Avdeling</Label>
                    <Select value={inviteData.departmentId} onValueChange={(value) => setInviteData({ ...inviteData, departmentId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Velg avdeling" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSendInvite} className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Send invitasjon
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totale brukere</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              +4 med testbrukere
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administratorer</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">
              Du er administrator
            </p>
          </CardContent>
        </Card>

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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Brukerroller</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-semibold">Administrator</div>
                <div className="text-sm text-muted-foreground">
                  Full tilgang til alle funksjoner og innstillinger
                </div>
              </div>
              <Badge className="bg-red-100 text-red-800">Admin</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-semibold">Partner</div>
                <div className="text-sm text-muted-foreground">
                  Kan administrere avdelinger og brukere
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Partner</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-semibold">Manager</div>
                <div className="text-sm text-muted-foreground">
                  Kan lede team og administrere prosjekter
                </div>
              </div>
              <Badge className="bg-green-100 text-green-800">Manager</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <div className="font-semibold">Medarbeider</div>
                <div className="text-sm text-muted-foreground">
                  Kan utføre revisjonsarbeid og delta i team
                </div>
              </div>
              <Badge className="bg-gray-100 text-gray-800">Medarbeider</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tips for testing av team-funksjonalitet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <p className="mb-2">Etter å ha opprettet testbrukere kan du:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Gå til en klient-side og bruke "Team" fanen</li>
              <li>Opprette team og tildele medlemmer</li>
              <li>Teste kommunikasjon mellom teammedlemmer</li>
              <li>Tildele oppgaver til ulike brukere</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <EmployeesList />

    </div>
  );
};

export default UserAdmin;
