
import React, { useState, useEffect } from 'react';
import { useRevyContext } from '@/components/RevyContext/RevyContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Client } from '@/types/revio';
import RecentClientsCard from '@/components/Clients/RecentClientsCard';
import ClientsTable from '@/components/Clients/ClientsTable/ClientsTable';

import ClientsHeader from '@/components/Clients/ClientsHeader/ClientsHeader';
import AddClientDialog from '@/components/Clients/AddClientDialog';
import ClientBulkImporter from '@/components/Clients/ClientBulkImporter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useClientData } from '@/components/Clients/ClientFetcher/useClientData';
import { useClientFilters } from '@/components/Clients/ClientFilters/useClientFilters';
import { useBrregRefresh } from '@/hooks/useBrregRefresh';
import FlexibleGrid from '@/components/Layout/FlexibleGrid';
import ClientFilters from '@/components/Clients/Advanced/ClientFilters';
import ClientColumnsConfig from '@/components/Clients/Advanced/ClientColumnsConfig';

import { ClientFilterField, ClientColumnConfig, DEFAULT_CLIENT_COLUMNS } from '@/types/client-extended';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Settings, Filter } from 'lucide-react';

const ClientsOverview = () => {
  const { setContext } = useRevyContext();
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);
  const [showBulkImportDialog, setShowBulkImportDialog] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showColumnsConfig, setShowColumnsConfig] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ClientFilterField[]>([]);
  const [columnConfig, setColumnConfig] = useState<ClientColumnConfig[]>(DEFAULT_CLIENT_COLUMNS);
  
  // Fetch client data with extended functionality  
  const { data: clientData, isLoading, error, refetch } = useClientData();
  const clients = Array.isArray(clientData) ? clientData : [];
  
  // Handle BRREG API refresh
  const { handleRefreshBrregData, isRefreshing, hasApiError, refreshProgress } = useBrregRefresh({ clients });
  
  // Filter clients based on search and department
  const {
    searchTerm,
    setSearchTerm,
    departmentFilter,
    setDepartmentFilter,
    departments,
    groupFilter,
    setGroupFilter,
    groups,
    filteredClients
  } = useClientFilters(clients);

  // Handle client added
  const handleClientAdded = () => {
    refetch();
  };


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
    <div className="space-y-[var(--content-gap)] w-full">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mine klienter</h1>
          <p className="text-muted-foreground">Oversikt over klienter og revisjonsstatus</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter size={16} />
            Avanserte filtre
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowColumnsConfig(!showColumnsConfig)}
          >
            <Settings size={16} />
            Kolonner
          </Button>
        </div>
      </div>

      <ClientsHeader
        title=""
        subtitle=""
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        departmentFilter={departmentFilter}
        onDepartmentChange={setDepartmentFilter}
        departments={departments}
        groupFilter={groupFilter}
        onGroupChange={setGroupFilter}
        groups={groups}
        onRefresh={handleRefreshBrregData}
        isRefreshing={isRefreshing}
        hasApiError={hasApiError}
        refreshProgress={refreshProgress}
        onAddClient={() => setShowAddClientDialog(true)}
        onBulkImport={() => setShowBulkImportDialog(true)}
      />

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Avanserte filtre</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientFilters 
              activeFilters={activeFilters}
              onFiltersChange={setActiveFilters}
              availableFields={[
                { key: 'name', label: 'Navn', type: 'string' },
                { key: 'org_number', label: 'Organisasjonsnummer', type: 'string' },
                { key: 'phase', label: 'Fase', type: 'select', options: ['engagement', 'planning', 'execution', 'completion', 'reporting'] },
                { key: 'engagement_type', label: 'Oppdragstype', type: 'select', options: ['revisjon', 'regnskap', 'annet'] },
                { key: 'department', label: 'Avdeling', type: 'string' },
                { key: 'municipality_name', label: 'Kommune', type: 'string' },
                { key: 'nace_code', label: 'Bransjekode', type: 'string' }
              ]}
            />
          </CardContent>
        </Card>
      )}

      {/* Column Configuration */}
      {showColumnsConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Kolonnekonfigurasjon</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientColumnsConfig 
              columns={columnConfig}
              onColumnsChange={setColumnConfig}
            />
          </CardContent>
        </Card>
      )}


      {/* Recent Clients */}
      <RecentClientsCard />

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
              />
            </CardContent>
          </Card>
        </div>
      </FlexibleGrid>

      {/* Add Client Dialog */}
      <AddClientDialog
        open={showAddClientDialog}
        onOpenChange={setShowAddClientDialog}
        onClientAdded={handleClientAdded}
      />

      {/* Bulk Import Dialog */}
      <Dialog open={showBulkImportDialog} onOpenChange={setShowBulkImportDialog}>
        <DialogContent draggable resizable className="max-w-none w-[90vw] h-[80vh]">
          <DialogHeader>
            <DialogTitle>Bulk import av klientdata</DialogTitle>
          </DialogHeader>
          <ClientBulkImporter 
            onImportComplete={() => { setShowBulkImportDialog(false); refetch(); }}
            onCancel={() => setShowBulkImportDialog(false)}
          />
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ClientsOverview;
