
import React from 'react';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import ClientStatsGrid from '@/components/Clients/ClientStats/ClientStatsGrid';
import ClientsTable from '@/components/Clients/ClientsTable/ClientsTable';
import AnnouncementsList from '@/components/Clients/Announcements/AnnouncementsList';
import ClientFilters from '@/components/Clients/ClientFilters/ClientFilters';
import { useClientFilter } from '@/hooks/use-client-filter';
import { mockClients, mockAnnouncements } from '@/data/mockClients';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

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
    <div className="container mx-auto h-full w-full p-4 md:p-6 lg:p-8 overflow-y-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
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
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6 pb-20">
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
