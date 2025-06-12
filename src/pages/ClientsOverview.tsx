
import React, { useState, useEffect } from 'react';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Announcement, Client } from '@/types/revio';
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
    filteredClients,
    showTestData,
    setShowTestData
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
        setAnnouncements([]);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      }
    };
    
    fetchAnnouncements();
  }, []);

  // Set context for Revy assistant
  React.useEffect(() => {
    setContext('client-overview');
  }, [setContext]);

  if (isLoading) {
    return <div className="p-4">Laster klienter...</div>;
  }

  if (error) {
    return <div className="p-4">Feil ved lasting av klienter</div>;
  }

  return (
    <div className="h-full overflow-auto">
      {/* Header */}
      <div className="p-4 border-b bg-background">
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
          showTestData={showTestData}
          onTestDataToggle={setShowTestData}
        />
      </div>
      
      {/* Main Content */}
      <div className="p-4">
        {/* Client Details - shown when a client is selected */}
        {selectedClient && (
          <div className="mb-6">
            <ClientDetails client={selectedClient} />
          </div>
        )}
        
        {/* Stats Grid */}
        <div className="mb-6">
          <ClientStatsGrid clients={clients} announcements={announcements} />
        </div>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
