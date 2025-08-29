
import React, { useState, useEffect } from 'react';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Client, BrregSearchResult } from '@/types/revio';
import { useToast } from '@/hooks/use-toast';
import ClientForm from '@/components/Clients/ClientAdmin/ClientForm';
import ClientList from '@/components/Clients/ClientAdmin/ClientList';
import BrregSearch from '@/components/Clients/ClientAdmin/BrregSearch';
import { useClientList } from '@/hooks/useClientList';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';
import { usePageTitle } from '@/components/Layout/PageTitleContext';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const ClientAdmin = () => {
  const { setContext } = useRevyContext();
  const { toast } = useToast();
const { data: clientList = [], isLoading } = useClientList();
const queryClient = useQueryClient();
const clients: Client[] = (clientList || []).map((c: any) => ({
  id: c.id,
  company_name: c.company_name,
  name: c.name,
  org_number: c.org_number,
  client_group: c.client_group,
}));
  const [activeTab, setActiveTab] = useState('list');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Partial<Client> | null>(null);
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('Klientadmin');
  }, [setPageTitle]);

  useEffect(() => {
    setContext('general');
  }, [setContext]);

  const handleSelectFromBrreg = (result: BrregSearchResult) => {
    const newClient: Partial<Client> = {
      id: Math.random().toString(36).substring(2, 9),
      name: result.navn,
      company_name: result.navn,
      org_number: result.organisasjonsnummer,
      phase: 'engagement',
      progress: 0,
      registration_date: result.registreringsdatoEnhetsregisteret?.substring(0, 10),
      industry: result.organisasjonsform.beskrivelse,
      riskAreas: [],
      documents: [],
      org_form_code: result.organisasjonsform.kode,
      org_form_description: result.organisasjonsform.beskrivelse,
      homepage: result.hjemmeside || '',
      status: 'ACTIVE',
      nace_code: '',
      nace_description: '',
      municipality_code: '',
      municipality_name: '',
      department: '',
      contact_person: '',
      chair: '',
      ceo: '',
      address: '',
      postal_code: '',
      city: '',
      email: '',
      phone: '',
      bank_account: '',
      notes: '',
      roles: []
    };

    setSelectedClient(newClient);
    setActiveTab('new');

    toast({
      title: "Klient valgt",
      description: `${result.navn} er valgt. Fullfør klientinformasjonen.`,
    });
  };

  const handleAddClient = async (client: Partial<Client>) => {
    const { error } = await (supabase as any).from('clients').insert({
      name: client.name ?? client.company_name ?? '',
      company_name: client.company_name ?? client.name ?? '',
      org_number: client.org_number ?? null,
      client_group: client.client_group ?? null,
    });

    if (error) {
      toast({ title: 'Kunne ikke legge til klient', description: error.message, variant: 'destructive' });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['client-list'] });
    setSelectedClient(null);
    setActiveTab('list');

    toast({ title: 'Klient lagt til', description: `${client.name || client.company_name} er lagt til i klientdatabasen.` });
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setActiveTab('edit');
  };

  const handleUpdateClient = async (updatedClient: Client) => {
    const { error } = await (supabase as any)
      .from('clients')
      .update({
        name: updatedClient.name ?? updatedClient.company_name ?? '',
        company_name: updatedClient.company_name ?? updatedClient.name ?? '',
        org_number: updatedClient.org_number ?? null,
        client_group: (updatedClient as any).client_group ?? null,
      })
      .eq('id', updatedClient.id);

    if (error) {
      toast({ title: 'Kunne ikke oppdatere', description: error.message, variant: 'destructive' });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['client-list'] });
    setSelectedClient(null);
    setActiveTab('list');

    toast({ title: 'Klient oppdatert', description: `${updatedClient.name || updatedClient.company_name} er oppdatert.` });
  };

  const handleDeleteClient = async (id: string) => {
    const { error } = await (supabase as any)
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: 'Kunne ikke slette', description: error.message, variant: 'destructive' });
      return;
    }

    await queryClient.invalidateQueries({ queryKey: ['client-list'] });

    toast({ title: 'Klient slettet', description: 'Klienten er fjernet fra databasen.' });
  };

  return (
    <StandardPageLayout className="w-full px-4 py-6 md:px-6 lg:px-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid grid-cols-3 w-[400px]">
          <TabsTrigger value="list">Klientliste</TabsTrigger>
          <TabsTrigger value="new">Ny klient</TabsTrigger>
          <TabsTrigger value="search">Søk i Brønnøysund</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-6">
          <ClientList 
            clients={clients} 
            onEdit={handleEditClient}
            onDelete={handleDeleteClient}
          />
        </TabsContent>
        
        <TabsContent value="new" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ny klient</CardTitle>
              <CardDescription>Legg til en ny klient i databasen</CardDescription>
            </CardHeader>
            <CardContent>
              <ClientForm 
                initialData={selectedClient || undefined}
                onSubmit={handleAddClient}
                submitLabel="Legg til klient"
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="edit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Rediger klient</CardTitle>
              <CardDescription>Oppdater klientinformasjon</CardDescription>
            </CardHeader>
            <CardContent>
              {selectedClient && (
                <ClientForm 
                  initialData={selectedClient}
                  onSubmit={handleUpdateClient}
                  submitLabel="Oppdater klient"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="search" className="mt-6">
          <BrregSearch
            onSelectClient={handleSelectFromBrreg}
            isSearching={isSearching}
            setIsSearching={setIsSearching}
          />
        </TabsContent>
      </Tabs>
    </StandardPageLayout>
  );
};

export default ClientAdmin;
