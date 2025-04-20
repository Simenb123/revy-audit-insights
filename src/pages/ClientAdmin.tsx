
import React, { useState } from 'react';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Client, BrregSearchResult } from '@/types/revio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Search } from 'lucide-react';
import ClientForm from '@/components/Clients/ClientAdmin/ClientForm';
import ClientList from '@/components/Clients/ClientAdmin/ClientList';

// Mockdata for klienter
const mockClients: Client[] = [
  {
    id: '1',
    name: 'Nordheim AS',
    orgNumber: '912345678',
    phase: 'planning',
    progress: 65,
    department: 'Oslo',
    contactPerson: 'Mats Hansen',
    chair: 'Ola Nordmann',
    ceo: 'Erik Hansen',
    industry: 'Eiendom',
    registrationDate: '2010-05-10',
    address: 'Storgata 1',
    postalCode: '0123',
    city: 'Oslo',
    riskAreas: [
      { name: 'Inntekter', risk: 'medium' },
      { name: 'Kostnader', risk: 'low' },
      { name: 'Anleggsmidler', risk: 'high' }
    ],
    documents: [
      { type: 'shareholder_report', status: 'submitted', dueDate: '2025-05-15' },
      { type: 'tax_return', status: 'pending', dueDate: '2025-06-30' },
      { type: 'annual_report', status: 'pending', dueDate: '2025-07-31' }
    ]
  },
  {
    id: '2',
    name: 'Sørland Byggverk AS',
    orgNumber: '921234567',
    phase: 'execution',
    progress: 40,
    department: 'Kristiansand',
    contactPerson: 'Julie Nilsen',
    chair: 'Per Andersen',
    ceo: 'Lisa Olsen',
    industry: 'Bygg og anlegg',
    registrationDate: '2015-03-15',
    address: 'Havnegata 5',
    postalCode: '4630',
    city: 'Kristiansand',
    riskAreas: [
      { name: 'Inntekter', risk: 'low' },
      { name: 'Kostnader', risk: 'medium' },
      { name: 'Anleggsmidler', risk: 'low' }
    ],
    documents: [
      { type: 'shareholder_report', status: 'accepted', dueDate: '2025-05-15' },
      { type: 'tax_return', status: 'submitted', dueDate: '2025-06-30' },
      { type: 'annual_report', status: 'pending', dueDate: '2025-07-31' }
    ]
  },
];

// Mock Brønnøysundregisteret API resultat
const mockBrregResults: BrregSearchResult[] = [
  {
    organisasjonsnummer: '912345678',
    navn: 'NORDHEIM AS',
    organisasjonsform: {
      kode: 'AS',
      beskrivelse: 'Aksjeselskap'
    },
    registreringsdatoEnhetsregisteret: '2010-05-10T00:00:00.000Z',
    hjemmeside: 'www.nordheim.no',
    registrertIForetaksregisteret: true,
    registrertIStiftelsesregisteret: false,
    registrertIFrivillighetsregisteret: false
  },
  {
    organisasjonsnummer: '945678901',
    navn: 'NORDHEIM EIENDOM AS',
    organisasjonsform: {
      kode: 'AS',
      beskrivelse: 'Aksjeselskap'
    },
    registrertIForetaksregisteret: true,
    registrertIStiftelsesregisteret: false,
    registrertIFrivillighetsregisteret: false
  }
];

const ClientAdmin = () => {
  const { setContext } = useRevyContext();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BrregSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Sett context for Revy assistant
  React.useEffect(() => {
    setContext('client-admin');
  }, [setContext]);

  const handleSearch = () => {
    if (searchTerm.length < 3) {
      toast({
        title: "Søkeord for kort",
        description: "Vennligst skriv inn minst 3 tegn for å søke",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);

    // I en ekte app ville dette være en API-kall til Brønnøysundregisteret
    // For nå simulerer vi en API-respons med timeout
    setTimeout(() => {
      setSearchResults(mockBrregResults);
      setIsSearching(false);
    }, 1000);
  };

  const handleSelectFromBrreg = (result: BrregSearchResult) => {
    // Konverter Brreg-resultat til Client format
    const newClient: Client = {
      id: Math.random().toString(36).substring(2, 9),
      name: result.navn,
      orgNumber: result.organisasjonsnummer,
      phase: 'engagement',
      progress: 0,
      registrationDate: result.registreringsdatoEnhetsregisteret?.substring(0, 10),
      industry: result.organisasjonsform.beskrivelse,
      riskAreas: [],
      documents: []
    };

    setSelectedClient(newClient);
    setActiveTab('new');

    toast({
      title: "Klient valgt",
      description: `${result.navn} er valgt. Fullfør klientinformasjonen.`,
    });
  };

  const handleAddClient = (client: Client) => {
    // I en ekte app ville dette være et API-kall for å lagre klienten
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
    // I en ekte app ville dette være et API-kall for å oppdatere klienten
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
    // I en ekte app ville dette være et API-kall for å slette klienten
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
          <Card>
            <CardHeader>
              <CardTitle>Søk i Brønnøysundregisteret</CardTitle>
              <CardDescription>Finn og importer klientinformasjon fra Brønnøysundregisteret</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 mb-6">
                <div className="flex-1">
                  <Input 
                    placeholder="Firmanavn eller organisasjonsnummer..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching} className="flex items-center gap-2">
                  <Search size={18} />
                  <span>Søk</span>
                </Button>
              </div>
              
              {isSearching ? (
                <div className="text-center py-6">Søker...</div>
              ) : (
                searchResults.length > 0 && (
                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3">Organisasjonsnummer</th>
                          <th className="text-left p-3">Navn</th>
                          <th className="text-left p-3">Type</th>
                          <th className="p-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {searchResults.map((result) => (
                          <tr key={result.organisasjonsnummer} className="border-b hover:bg-muted/50">
                            <td className="p-3">{result.organisasjonsnummer}</td>
                            <td className="p-3">{result.navn}</td>
                            <td className="p-3">{result.organisasjonsform.beskrivelse}</td>
                            <td className="p-3 text-right">
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => handleSelectFromBrreg(result)}
                              >
                                Velg
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </CardContent>
            <CardFooter className="text-sm text-muted-foreground">
              I en fullverdig løsning vil dette være en direkteintegrasjon mot Brønnøysundregisteret API.
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientAdmin;
