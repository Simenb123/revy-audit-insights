
import React, { useState, useEffect } from 'react';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Announcement, Client, RevyContext } from '@/types/revio';
import ClientStatsGrid from '@/components/Clients/ClientStats/ClientStatsGrid';
import ClientsTable from '@/components/Clients/ClientsTable/ClientsTable';
import AnnouncementsList from '@/components/Clients/Announcements/AnnouncementsList';
import ClientsHeader from '@/components/Clients/ClientsHeader/ClientsHeader';
import ClientDetails from '@/components/Clients/ClientDetails/ClientDetails';
import { useClientData } from '@/components/Clients/ClientFetcher/useClientData';
import { useClientFilters } from '@/components/Clients/ClientFilters/useClientFilters';
import { useBrregRefresh } from '@/hooks/useBrregRefresh';

const ClientsOverview = () => {
  const { setContext } = useRevyContext();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  
  // Fetch client data
  const { data: clients = [], isLoading, error } = useClientData();
  
  // Handle BRREG API refresh
  const { handleRefreshBrregData, isRefreshing, hasApiError, refreshProgress } = useBrregRefresh({ clients });
  
  // Filter clients based on search and department
  const { 
    searchTerm, 
    setSearchTerm, 
    departmentFilter, 
    setDepartmentFilter, 
    departments, 
    filteredClients 
  } = useClientFilters(clients);

  // Get the selected client
  const selectedClient = selectedClientId 
    ? clients.find(client => client.id === selectedClientId) 
    : clients.length > 0 ? clients[0] : null;

  // Handle row selection
  const handleRowSelect = (client: Client) => {
    setSelectedClientId(client.id);
  };

  // Fetch announcements when component mounts
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        // In a real implementation, we would fetch from Supabase here
        // For now, we'll use an empty array until the announcements table is created
        setAnnouncements([]);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };
    
    fetchAnnouncements();
  }, []);

  // Set context for Revy assistant
  React.useEffect(() => {
    setContext('client-overview' as RevyContext);
  }, [setContext]);

  if (isLoading) {
    return <div>Laster klienter...</div>;
  }

  if (error) {
    return <div>Feil ved lasting av klienter</div>;
  }

  return (
    <div className="w-full px-4 py-6 md:px-6 lg:px-8">
      <ClientsHeader 
        title="Mine klienter"
        subtitle="Oversikt over klienter og revisjonsstatus"
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        departmentFilter={departmentFilter}
        onDepartmentChange={setDepartmentFilter}
        departments={departments}
        onRefresh={handleRefreshBrregData}
        isRefreshing={isRefreshing}
        hasApiError={hasApiError}
        refreshProgress={refreshProgress}
      />
      
      {/* Client Details - shown when a client is selected */}
      {selectedClient && (
        <ClientDetails client={selectedClient} />
      )}
      
      <div className="w-full">
        <ClientStatsGrid clients={clients} announcements={announcements} />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          <div className="col-span-1 lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Klientliste</CardTitle>
              </CardHeader>
              <CardContent>
                <ClientsTable 
                  clients={filteredClients} 
                  onRowSelect={handleRowSelect}
                  selectedClientId={selectedClientId}
                />
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
