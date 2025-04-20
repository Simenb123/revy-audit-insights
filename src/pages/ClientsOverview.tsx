import React, { useState, useEffect } from 'react';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client, Announcement } from '@/types/revio';
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
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Feil ved lasting av klienter",
          description: error.message,
          variant: "destructive"
        });
        return [];
      }

      return data as Client[];
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
