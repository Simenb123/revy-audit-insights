import React from 'react';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import ClientStatsGrid from '@/components/Clients/ClientStats/ClientStatsGrid';
import ClientsTable from '@/components/Clients/ClientsTable/ClientsTable';
import AnnouncementsList from '@/components/Clients/Announcements/AnnouncementsList';
import ClientFilters from '@/components/Clients/ClientFilters/ClientFilters';
import { useClientFilter } from '@/hooks/use-client-filter';
import { mockClients, mockAnnouncements } from '@/data/mockClients';

const ClientsOverview = () => {
  const { setContext } = useRevyContext();
  const {
    searchTerm,
    setSearchTerm,
    departmentFilter,
    setDepartmentFilter,
    filteredClients,
    departments
  } = useClientFilter(mockClients);
  
  // Set context for Revy assistant
  React.useEffect(() => {
    setContext('client-overview');
  }, [setContext]);
  
  return (
    <div className="w-full h-full max-w-[2000px] mx-auto px-6 py-6">
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
      
      <ClientStatsGrid clients={mockClients} announcements={mockAnnouncements} />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
          <AnnouncementsList announcements={mockAnnouncements} />
        </div>
      </div>
    </div>
  );
};

export default ClientsOverview;
