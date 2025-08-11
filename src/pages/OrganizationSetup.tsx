import { logger } from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Building2, Users, ArrowRight, AlertCircle, MessageSquare, Loader2 } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useExistingFirm } from '@/hooks/useExistingFirm';
import { useJoinFirm } from '@/hooks/useJoinFirm';
import ExistingFirmDialog from '@/components/Organization/ExistingFirmDialog';
import { useClaimFirm } from '@/hooks/useClaimFirm';
import { useRequestFirmAccess } from '@/hooks/useRequestFirmAccess';
import { useFirmAccessRequests } from '@/hooks/useFirmAccessRequests';
import { useCancelFirmAccess } from '@/hooks/useCancelFirmAccess';

const OrganizationSetup = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();
  const { data: userProfile, isLoading: profileLoading } = useUserProfile();
  const joinFirmMutation = useJoinFirm();
  const claimFirmMutation = useClaimFirm();
  const requestAccessMutation = useRequestFirmAccess();
  const { data: accessRequests, isLoading: accessLoading } = useFirmAccessRequests('pending');
  const cancelRequestMutation = useCancelFirmAccess();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showExistingFirmDialog, setShowExistingFirmDialog] = useState(false);
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

  const { data: existingFirm } = useExistingFirm(firmData.orgNumber);
  const myPending = accessRequests?.find(
    (r) => r.audit_firm_id === existingFirm?.id && r.requester_profile_id === session?.user?.id
  );
  const [brregLoading, setBrregLoading] = useState(false);

  // Redirect if user already has a firm
  useEffect(() => {
    if (!profileLoading && userProfile?.auditFirmId) {
      navigate('/organisasjon');
    }
  }, [userProfile, profileLoading, navigate]);

  // Show existing firm dialog when firm is found
  useEffect(() => {
    if (existingFirm && step === 2 && firmData.orgNumber) {
      setShowExistingFirmDialog(true);
    }
  }, [existingFirm, step, firmData.orgNumber]);

  const handleBrregLookup = async () => {
    const digits = (firmData.orgNumber || '').replace(/\D/g, '');
    if (!digits || digits.length < 9) {
      toast({
        title: 'Ugyldig org.nr',
        description: 'Skriv inn minst 9 sifre for å slå opp i BRREG',
        variant: 'destructive',
      });
      return;
    }

    try {
      setBrregLoading(true);
      const { data, error } = await supabase.functions.invoke('brreg', {
        body: { query: digits },
      });
      if (error) throw error;

      const basis: any = (data as any)?.basis;
      if (basis) {
        setFirmData((prev) => ({
          ...prev,
          name: prev.name || basis.navn || prev.name,
          website: prev.website || basis.homepage || prev.website,
        }));
        toast({ title: 'BRREG funnet', description: basis.navn || 'Oppslag vellykket' });
      } else {
        toast({ title: 'Ikke funnet', description: 'Fant ikke firma i BRREG', variant: 'destructive' });
      }
    } catch (e: any) {
      logger.error('BRREG lookup failed', e);
      toast({ title: 'Feil ved BRREG-oppslag', description: e?.message ?? 'Ukjent feil', variant: 'destructive' });
    } finally {
      setBrregLoading(false);
    }
  };

  const handleCreateFirm = async () => {
    if (!session?.user?.id) return;

    // Check for existing firm first
    if (existingFirm) {
      setShowExistingFirmDialog(true);
      return;
    }

    setLoading(true);
    try {
      // Validate required fields
      if (!firmData.name) {
        toast({
          title: "Validering feilet",
          description: "Firmanavn er påkrevd",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Create the audit firm
      const { data: firmResult, error: firmError } = await supabase
        .from('audit_firms')
        .insert({
          name: firmData.name,
          org_number: firmData.orgNumber || null,
          address: firmData.address || null,
          city: firmData.city || null,
          postal_code: firmData.postalCode || null,
          phone: firmData.phone || null,
          email: firmData.email || null,
          website: firmData.website || null
        })
        .select()
        .single();

      if (firmError) {
        if (firmError.code === '23505') { // Unique constraint violation
          toast({
            title: "Firma eksisterer allerede",
            description: "Et firma med dette organisasjonsnummeret er allerede registrert.",
            variant: "destructive"
          });
        } else {
          throw firmError;
        }
        setLoading(false);
        return;
      }

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
        .upsert({
          id: session.user.id,
          email: session.user.email,
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
      logger.error('Error creating firm:', error);
      toast({
        title: "Feil ved opprettelse",
        description: error.message || "En uventet feil oppstod",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Intercept the dialog's "join" action to enforce claim/access request logic
  const handleJoinExistingFirm = async () => {
    if (!existingFirm) return;

    try {
      // If firm is already claimed -> send access request (default role: employee)
      if (existingFirm.claimed_by) {
        await requestAccessMutation.mutateAsync({
          firmId: existingFirm.id,
          roleRequested: 'employee',
          message: 'Ønsker tilgang til firma',
        });
        setShowExistingFirmDialog(false);
        navigate('/organisasjon');
        return;
      }

      // If firm is not claimed -> claim it (first admin)
      if (firmData.orgNumber) {
        await claimFirmMutation.mutateAsync({
          orgNumber: firmData.orgNumber,
          firmName: (existingFirm.name ?? firmData.name) || undefined,
        });
        setShowExistingFirmDialog(false);
        navigate('/organisasjon');
        return;
      }

      // Fallback: (should not happen) join as before
      // Get the main department for this firm
      const { data: departments } = await supabase
        .from('departments')
        .select('id')
        .eq('audit_firm_id', existingFirm.id)
        .limit(1);

      const departmentId = departments?.[0]?.id;

      await joinFirmMutation.mutateAsync({
        firmId: existingFirm.id,
        departmentId
      });

      setShowExistingFirmDialog(false);
      navigate('/organisasjon');
    } catch (error) {
      logger.error('Error handling firm join/claim/request:', error);
      toast({
        title: "Feil",
        description: (error as any)?.message ?? "En uventet feil oppstod",
        variant: "destructive"
      });
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

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Laster...</p>
        </div>
      </div>
    );
  }

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

          {/* Add navigation to test communication */}
          <div className="mt-8 pt-6 border-t">
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Vil du teste kommunikasjonssystemet uten å opprette et firma først?
              </p>
              <Link to="/kommunikasjon">
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Gå til kommunikasjon
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-background p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Opprett revisjonsfirma</CardTitle>
            <CardDescription>
              Fyll inn informasjon om ditt revisjonsfirma
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {existingFirm && (
              <>
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <p className="text-sm text-amber-800">
                    Et firma med dette org.nummeret eksisterer allerede. {existingFirm.claimed_by ? 'Firmaet er allerede claimet. Du kan be om tilgang.' : 'Ingen har claimet firmaet ennå. Du kan claime det nå.'}
                  </p>
                </div>
                {myPending && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">Du har allerede en ventende forespørsel til dette firmaet.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cancelRequestMutation.mutate({ requestId: myPending.id })}
                      disabled={cancelRequestMutation.isPending}
                    >
                      {cancelRequestMutation.isPending ? 'Kansellerer...' : 'Kanseller forespørsel'}
                    </Button>
                  </div>
                )}
              </>
            )}

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
                <div className="flex gap-2">
                  <Input
                    id="orgNumber"
                    value={firmData.orgNumber}
                    onChange={(e) => setFirmData({ ...firmData, orgNumber: e.target.value })}
                    placeholder="123456789"
                  />
                  <Button type="button" variant="outline" onClick={handleBrregLookup} disabled={!firmData.orgNumber || brregLoading}>
                    {brregLoading ? (<><Loader2 className="h-4 w-4 animate-spin mr-2" /> Henter…</>) : 'Hent fra BRREG'}
                  </Button>
                </div>
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

            {/* Navigasjon og handlinger */}
            <div className="flex flex-wrap gap-3">
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

              {existingFirm && (
                <>
                  {!existingFirm.claimed_by ? (
                    <Button
                      variant="secondary"
                      onClick={() =>
                        claimFirmMutation.mutate(
                          { 
                            orgNumber: firmData.orgNumber, 
                            firmName: (existingFirm.name ?? firmData.name) || undefined 
                          },
                          {
                            onSuccess: () => navigate('/organisasjon')
                          }
                        )
                      }
                    >
                      Claime firma
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      disabled={!!myPending || requestAccessMutation.isPending}
                      onClick={() =>
                        requestAccessMutation.mutate(
                          { firmId: existingFirm.id, roleRequested: 'employee', message: 'Ønsker tilgang til firma' },
                          {
                            onSuccess: () => navigate('/organisasjon')
                          }
                        )
                      }
                    >
                      Be om tilgang
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ExistingFirmDialog
        open={showExistingFirmDialog}
        onOpenChange={setShowExistingFirmDialog}
        firmName={existingFirm?.name || ''}
        onJoinFirm={handleJoinExistingFirm}
        onCreateNew={() => {
          setShowExistingFirmDialog(false);
          setFirmData({ ...firmData, orgNumber: '' });
        }}
      />
    </>
  );
};

export default OrganizationSetup;
