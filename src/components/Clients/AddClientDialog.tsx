
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus, Search, Database, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import BrregSearch from './ClientAdmin/BrregSearch';
import { BulkDiscoveryDialog } from './BulkDiscoveryDialog';
import { BrregSearchResult } from '@/types/revio';

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientAdded: () => void;
}

const AddClientDialog: React.FC<AddClientDialogProps> = ({ open, onOpenChange, onClientAdded }) => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  
  // Manual form state
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    org_number: '',
    industry: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    email: '',
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.org_number) {
      toast({
        title: "Påkrevde felt mangler",
        description: "Vennligst fyll ut navn og organisasjonsnummer",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Ikke autentisert');
      }

      const { error } = await supabase.from('clients').insert([{
        ...formData,
        company_name: formData.company_name || formData.name,
        user_id: user.user.id,
        phase: 'engagement',
        progress: 0,
        is_test_data: false
      }]);

      if (error) throw error;

      toast({
        title: "Klient opprettet",
        description: `${formData.name} er lagt til som ny klient`,
        variant: "success" as any
      });

      // Reset form
      setFormData({
        name: '',
        company_name: '',
        org_number: '',
        industry: '',
        address: '',
        city: '',
        postal_code: '',
        phone: '',
        email: '',
      });

      onClientAdded();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Feil ved opprettelse",
        description: error.message || "Kunne ikke opprette klient",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleBrregSelect = async (result: BrregSearchResult) => {
    setIsCreating(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Ikke autentisert');
      }

      const clientData = {
        name: result.navn,
        company_name: result.navn,
        org_number: result.organisasjonsnummer,
        org_form_code: result.organisasjonsform?.kode,
        org_form_description: result.organisasjonsform?.beskrivelse,
        registration_date: result.registreringsdatoEnhetsregisteret ? 
          new Date(result.registreringsdatoEnhetsregisteret).toISOString().split('T')[0] : null,
        homepage: result.hjemmeside,
        user_id: user.user.id,
        phase: 'engagement',
        progress: 0,
        is_test_data: false
      };

      const { error } = await supabase.from('clients').insert([clientData]);

      if (error) throw error;

      toast({
        title: "Klient importert",
        description: `${result.navn} er importert fra Brønnøysundregisteret`,
        variant: "success" as any
      });

      onClientAdded();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Feil ved import",
        description: error.message || "Kunne ikke importere klient",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Legg til ny klient
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Manuell opprettelse
            </TabsTrigger>
            <TabsTrigger value="brreg" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Søk i Brønnøysund
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Bulk discovery
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Opprett klient manuelt</CardTitle>
                <CardDescription>
                  Fyll ut klientinformasjon manuelt for å opprette en ny klient
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Navn *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="org_number">Organisasjonsnummer *</Label>
                      <Input
                        id="org_number"
                        value={formData.org_number}
                        onChange={(e) => handleInputChange('org_number', e.target.value)}
                        pattern="[0-9]{9}"
                        maxLength={9}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_name">Selskapsnavnet</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => handleInputChange('company_name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="industry">Bransje</Label>
                      <Input
                        id="industry"
                        value={formData.industry}
                        onChange={(e) => handleInputChange('industry', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="city">By</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="postal_code">Postnummer</Label>
                      <Input
                        id="postal_code"
                        value={formData.postal_code}
                        onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">E-post</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                      Avbryt
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? 'Oppretter...' : 'Opprett klient'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="brreg" className="space-y-4">
            <BrregSearch 
              onSelectClient={handleBrregSelect}
              isSearching={isSearching}
              setIsSearching={setIsSearching}
            />
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Bulk discovery</CardTitle>
                <CardDescription>
                  Søk etter alle selskaper som har registrert ditt revisjonsfirma som revisor i Brønnøysundregisteret
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BulkDiscoveryDialog>
                  <Button className="w-full">
                    <Database className="mr-2 h-4 w-4" />
                    Start bulk-søk
                  </Button>
                </BulkDiscoveryDialog>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientDialog;
