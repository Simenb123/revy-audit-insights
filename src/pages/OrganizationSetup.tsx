
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Building2, Users, ArrowRight } from 'lucide-react';

const OrganizationSetup = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [firmData, setFirmData] = useState({
    name: '',
    orgNumber: '',
    address: '',
    city: '',
    postalCode: '',
    phone: '',
    email: '',
    website: ''
  });
  const [departmentData, setDepartmentData] = useState({
    name: 'Revisjon',
    description: 'Hovedavdeling for revisjonstjenester'
  });

  const handleCreateFirm = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      // Create the audit firm
      const { data: firmResult, error: firmError } = await supabase
        .from('audit_firms')
        .insert({
          name: firmData.name,
          org_number: firmData.orgNumber,
          address: firmData.address,
          city: firmData.city,
          postal_code: firmData.postalCode,
          phone: firmData.phone,
          email: firmData.email,
          website: firmData.website
        })
        .select()
        .single();

      if (firmError) throw firmError;

      // Create the main department
      const { data: deptResult, error: deptError } = await supabase
        .from('departments')
        .insert({
          audit_firm_id: firmResult.id,
          name: departmentData.name,
          description: departmentData.description,
          partner_id: session.user.id
        })
        .select()
        .single();

      if (deptError) throw deptError;

      // Update user profile to link to firm and department with admin role
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          audit_firm_id: firmResult.id,
          department_id: deptResult.id,
          user_role: 'admin'
        })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      toast({
        title: "Revisjonsfirma opprettet!",
        description: `${firmData.name} er nå registrert og du har administratortilgang.`,
      });

      navigate('/organisasjon');
    } catch (error: any) {
      toast({
        title: "Feil ved opprettelse",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSetupBHL = async () => {
    setLoading(true);
    setFirmData({
      name: 'BHL DA',
      orgNumber: '123456789',
      address: 'Storgate 1',
      city: 'Oslo',
      postalCode: '0001',
      phone: '+47 12 34 56 78',
      email: 'post@bhl.no',
      website: 'https://bhl.no'
    });
    setDepartmentData({
      name: 'Revisjon',
      description: 'Hovedavdeling for revisjonstjenester'
    });
    setStep(2);
    setLoading(false);
  };

  if (step === 1) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-2">
            <Building2 className="h-12 w-12 mx-auto text-primary" />
            <h1 className="text-3xl font-bold">Velkommen til Revio</h1>
            <p className="text-muted-foreground">
              La oss sette opp ditt revisjonsfirma og komme i gang
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleQuickSetupBHL}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Hurtigoppsett BHL DA
                </CardTitle>
                <CardDescription>
                  Opprett BHL DA med forhåndsutfylte data for testing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" disabled={loading}>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Opprett BHL DA
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStep(2)}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Manuelt oppsett
                </CardTitle>
                <CardDescription>
                  Opprett ditt eget revisjonsfirma med egne data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Manuelt oppsett
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Opprett revisjonsfirma</CardTitle>
          <CardDescription>
            Fyll inn informasjon om ditt revisjonsfirma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Firmanavn *</Label>
              <Input
                id="name"
                value={firmData.name}
                onChange={(e) => setFirmData({ ...firmData, name: e.target.value })}
                placeholder="Navn på revisjonsfirmaet"
                required
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

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">Standard avdeling</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deptName">Avdelingsnavn</Label>
                <Input
                  id="deptName"
                  value={departmentData.name}
                  onChange={(e) => setDepartmentData({ ...departmentData, name: e.target.value })}
                  placeholder="Revisjon"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deptDescription">Beskrivelse</Label>
                <Textarea
                  id="deptDescription"
                  value={departmentData.description}
                  onChange={(e) => setDepartmentData({ ...departmentData, description: e.target.value })}
                  placeholder="Beskrivelse av avdelingen"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep(1)}>
              Tilbake
            </Button>
            <Button 
              onClick={handleCreateFirm} 
              disabled={loading || !firmData.name}
              className="flex-1"
            >
              {loading ? 'Oppretter...' : 'Opprett firma'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationSetup;
