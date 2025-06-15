
import React, { useState } from 'react';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Client, BrregSearchResult } from '@/types/revio';
import { useToast } from '@/hooks/use-toast';
import ClientForm from '@/components/Clients/ClientAdmin/ClientForm';
import ClientList from '@/components/Clients/ClientAdmin/ClientList';
import BrregSearch from '@/components/Clients/ClientAdmin/BrregSearch';
import { mockClients } from '@/components/Clients/ClientAdmin/mockData';

const ClientAdmin = () => {
  const { setContext } = useRevyContext();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [activeTab, setActiveTab] = useState('list');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Partial<Client> | null>(null);

  React.useEffect(() => {
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

  const handleAddClient = (client: Client) => {
    const updatedClients = [...clients, client];
    setClients(updatedClients);
    setSelectedClient(null);
    setActiveTab('list');

    toast({
      title: "Klient lagt til",
      description: `${client.name} er lagt til i klientdatabasen.`,
    });
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setActiveTab('edit');
  };

  const handleUpdateClient = (updatedClient: Client) => {
    const updatedClients = clients.map(c => 
      c.id === updatedClient.id ? updatedClient : c
    );
    setClients(updatedClients);
    setSelectedClient(null);
    setActiveTab('list');

    toast({
      title: "Klient oppdatert",
      description: `${updatedClient.name} er oppdatert.`,
    });
  };

  const handleDeleteClient = (id: string) => {
    const updatedClients = clients.filter(c => c.id !== id);
    setClients(updatedClients);

    toast({
      title: "Klient slettet",
      description: "Klienten er fjernet fra databasen.",
    });
  };

  return (
    <div className="w-full px-4 py-6 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Klientadministrasjon</h1>
          <p className="text-muted-foreground mt-1">
            Administrer klienter og importer fra Brønnøysundregisteret
          </p>
        </div>
      </div>
      
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
    </div>
  );
};

export default ClientAdmin;
