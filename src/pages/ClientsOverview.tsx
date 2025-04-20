
import React, { useState, useEffect } from 'react';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client, Announcement, RiskArea, ClientDocument } from '@/types/revio';
import ClientStatsGrid from '@/components/Clients/ClientStats/ClientStatsGrid';
import ClientsTable from '@/components/Clients/ClientsTable/ClientsTable';
import AnnouncementsList from '@/components/Clients/Announcements/AnnouncementsList';
import ClientFilters from '@/components/Clients/ClientFilters/ClientFilters';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

const ClientsOverview = () => {
  const { setContext } = useRevyContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Fetch clients from Supabase
  const { data: clients = [], isLoading, error } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: async () => {
      // First get clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientsError) {
        toast({
          title: "Feil ved lasting av klienter",
          description: clientsError.message,
          variant: "destructive"
        });
        return [];
      }

      // Then get risk areas for all clients
      const { data: riskAreasData, error: riskAreasError } = await supabase
        .from('risk_areas')
        .select('*');

      if (riskAreasError) {
        console.error("Error fetching risk areas:", riskAreasError);
      }

      // Then get documents for all clients
      const { data: documentsData, error: documentsError } = await supabase
        .from('client_documents')
        .select('*');

      if (documentsError) {
        console.error("Error fetching client documents:", documentsError);
      }

      // Transform data to match our Client type
      return clientsData.map(client => {
        // Find risk areas for this client
        const clientRiskAreas: RiskArea[] = (riskAreasData || [])
          .filter(area => area.client_id === client.id)
          .map(area => ({
            name: area.name,
            risk: area.risk
          }));

        // Find documents for this client
        const clientDocuments: ClientDocument[] = (documentsData || [])
          .filter(doc => doc.client_id === client.id)
          .map(doc => ({
            type: doc.type,
            status: doc.status,
            dueDate: doc.due_date
          }));

        // If no risk areas or documents found, provide defaults
        if (clientRiskAreas.length === 0) {
          clientRiskAreas.push({ name: 'Generell', risk: 'low' });
        }
        
        if (clientDocuments.length === 0) {
          clientDocuments.push({
            type: 'annual_report',
            status: 'pending',
            dueDate: new Date().toISOString().split('T')[0]
          });
        }

        // Map the Supabase client to our Client type
        return {
          id: client.id,
          name: client.name,
          companyName: client.company_name,
          orgNumber: client.org_number,
          phase: client.phase,
          progress: client.progress,
          department: client.department || '',
          contactPerson: client.contact_person || '',
          chair: client.chair || '',
          ceo: client.ceo || '',
          industry: client.industry || '',
          registrationDate: client.registration_date || '',
          address: client.address || '',
          postalCode: client.postal_code || '',
          city: client.city || '',
          email: client.email || '',
          phone: client.phone || '',
          bankAccount: client.bank_account || '',
          notes: client.notes || '',
          riskAreas: clientRiskAreas,
          documents: clientDocuments
        } as Client;
      });
    }
  });
  
  // Set context for Revy assistant
  React.useEffect(() => {
    setContext('client-overview');
  }, [setContext]);
  
  // Fetch announcements in the future if needed
  useEffect(() => {
    // Placeholder for fetching announcements
    // You might want to implement this similarly to how clients are fetched
  }, []);
  
  // Filter clients based on search term and department
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          client.orgNumber.includes(searchTerm);
    const matchesDepartment = departmentFilter === 'all' || client.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });
  
  // Get unique departments for filter dropdown
  const departments = Array.from(new Set(clients.map(client => client.department || ''))).filter(Boolean) as string[];
  
  if (isLoading) {
    return <div>Laster klienter...</div>;
  }

  if (error) {
    return <div>Feil ved lasting av klienter</div>;
  }

  return (
    <div className="w-full px-4 py-6 md:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Mine klienter</h1>
          <p className="text-muted-foreground mt-1">
            Oversikt over klienter og revisjonsstatus
          </p>
        </div>
        
        <ClientFilters 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          departmentFilter={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
          departments={departments}
        />
      </div>
      
      <div className="w-full">
        <ClientStatsGrid clients={clients} announcements={announcements} />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          <div className="col-span-1 lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Klientliste</CardTitle>
              </CardHeader>
              <CardContent>
                <ClientsTable clients={filteredClients} />
              </CardContent>
            </Card>
          </div>
          
          <div className="col-span-1">
            <AnnouncementsList announcements={announcements} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientsOverview;
