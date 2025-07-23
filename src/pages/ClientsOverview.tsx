
import React, { useState, useEffect } from 'react';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Announcement, Client } from '@/types/revio';
import ClientStatsGrid from '@/components/Clients/ClientStats/ClientStatsGrid';
import ClientsTable from '@/components/Clients/ClientsTable/ClientsTable';
import AnnouncementsList from '@/components/Clients/Announcements/AnnouncementsList';
import ClientsHeader from '@/components/Clients/ClientsHeader/ClientsHeader';
import AddClientDialog from '@/components/Clients/AddClientDialog';
import { useClientData } from '@/components/Clients/ClientFetcher/useClientData';
import { useClientFilters } from '@/components/Clients/ClientFilters/useClientFilters';
import { useBrregRefresh } from '@/hooks/useBrregRefresh';
import PageLayout from '@/components/Layout/PageLayout';
import FlexibleGrid from '@/components/Layout/FlexibleGrid';

const ClientsOverview = () => {
  const { setContext } = useRevyContext();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  
  // Fetch client data
  const { data: clients = [], isLoading, error, refetch } = useClientData();
  
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

  // Handle row selection
  const handleRowSelect = (client: Client) => {
    setSelectedClientId(client.id);
  };

  // Handle client added
  const handleClientAdded = () => {
    refetch();
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
    <PageLayout
      width="wide"
      header={
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
          onAddClient={() => setShowAddClientDialog(true)}
        />
      }
    >
      {/* Stats Grid */}
      <div className="mb-6">
        <ClientStatsGrid clients={clients} announcements={announcements} />
      </div>
      
      {/* Main Content Grid - Mer plass til klienttabellen */}
      <FlexibleGrid>
        <div className="col-span-full xl:col-span-8">
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
        <div className="col-span-full xl:col-span-4">
          <AnnouncementsList announcements={announcements} />
        </div>
      </FlexibleGrid>

      {/* Add Client Dialog */}
      <AddClientDialog
        open={showAddClientDialog}
        onOpenChange={setShowAddClientDialog}
        onClientAdded={handleClientAdded}
      />
    </PageLayout>
  );
};

export default ClientsOverview;
