
import React, { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuditFirm } from '@/hooks/useAuditFirm';
import { useDepartments } from '@/hooks/useDepartments';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Building2, Users, Settings, Plus, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const OrganizationSettings = () => {
  const { data: userProfile } = useUserProfile();
  const { data: auditFirm } = useAuditFirm();
  const { data: departments } = useDepartments();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [firmData, setFirmData] = useState({
    name: auditFirm?.name || '',
    orgNumber: auditFirm?.orgNumber || '',
    address: auditFirm?.address || '',
    city: auditFirm?.city || '',
    postalCode: auditFirm?.postalCode || '',
    phone: auditFirm?.phone || '',
    email: auditFirm?.email || '',
    website: auditFirm?.website || ''
  });

  const canAccessSettings = userProfile?.userRole === 'admin' || userProfile?.userRole === 'partner';

  React.useEffect(() => {
    if (auditFirm) {
      setFirmData({
        name: auditFirm.name || '',
        orgNumber: auditFirm.orgNumber || '',
        address: auditFirm.address || '',
        city: auditFirm.city || '',
        postalCode: auditFirm.postalCode || '',
        phone: auditFirm.phone || '',
        email: auditFirm.email || '',
        website: auditFirm.website || ''
      });
    }
  }, [auditFirm]);

  if (!canAccessSettings) {
    return (
      <div className="w-full px-4 py-6 md:px-6 lg:px-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Tilgang nektet</h2>
              <p className="text-muted-foreground">
                Du har ikke tilgang til organisasjonsinnstillinger. Kun administratorer og partnere kan endre disse innstillingene.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-6 md:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Organisasjonsinnstillinger</h1>
          <p className="text-muted-foreground">
            Administrer firmainformasjon og avdelinger
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Firm Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Firmainformasjon
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Firmanavn</Label>
                <Input
                  id="name"
                  value={firmData.name}
                  onChange={(e) => setFirmData({ ...firmData, name: e.target.value })}
                  placeholder="Navn på revisjonsfirmaet"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orgNumber">Organisasjonsnummer</Label>
                <Input
                  id="orgNumber"
                  value={firmData.orgNumber}
                  onChange={(e) => setFirmData({ ...firmData, orgNumber: e.target.value })}
                  placeholder="123456789"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={firmData.address}
                onChange={(e) => setFirmData({ ...firmData, address: e.target.value })}
                placeholder="Gateadresse"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postnummer</Label>
                <Input
                  id="postalCode"
                  value={firmData.postalCode}
                  onChange={(e) => setFirmData({ ...firmData, postalCode: e.target.value })}
                  placeholder="0001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Poststed</Label>
                <Input
                  id="city"
                  value={firmData.city}
                  onChange={(e) => setFirmData({ ...firmData, city: e.target.value })}
                  placeholder="Oslo"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  value={firmData.phone}
                  onChange={(e) => setFirmData({ ...firmData, phone: e.target.value })}
                  placeholder="+47 12 34 56 78"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input
                  id="email"
                  type="email"
                  value={firmData.email}
                  onChange={(e) => setFirmData({ ...firmData, email: e.target.value })}
                  placeholder="post@firma.no"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Nettside</Label>
              <Input
                id="website"
                value={firmData.website}
                onChange={(e) => setFirmData({ ...firmData, website: e.target.value })}
                placeholder="https://firma.no"
              />
            </div>

            <Button disabled={loading}>
              {loading ? 'Lagrer...' : 'Lagre endringer'}
            </Button>
          </CardContent>
        </Card>

        {/* Departments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Avdelinger
              </CardTitle>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Ny avdeling
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departments?.map((dept) => (
                <div key={dept.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{dept.name}</h3>
                      {dept.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {dept.description}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!departments || departments.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  Ingen avdelinger opprettet ennå
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrganizationSettings;
