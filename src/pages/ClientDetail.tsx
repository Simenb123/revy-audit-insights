
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ClientHeader from '@/components/Clients/ClientDetails/ClientHeader';
import ClientBreadcrumb from '@/components/Clients/ClientDetails/ClientBreadcrumb';
import RevisionWorkflow from '@/components/Clients/ClientDetails/RevisionWorkflow';
import PhaseContent from '@/components/Clients/ClientDetails/PhaseContent';
import KeyFigures from '@/components/Clients/ClientDetails/ClientDashboard/KeyFigures';
import FinancialChart from '@/components/Clients/ClientDetails/ClientDashboard/FinancialChart';
import Overview from '@/components/Clients/ClientDetails/ClientDashboard/Overview';
import { AuditPhase } from '@/types/revio';

const ClientDetail = () => {
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const { data: client, isLoading, error } = useClientDetails(orgNumber || '');
  const [selectedPhase, setSelectedPhase] = useState<AuditPhase | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Klient ikke funnet</h1>
        <p className="mb-6">Vi kunne ikke finne en klient med org.nummer {orgNumber}</p>
      </div>
    );
  }

  const currentPhase = selectedPhase || client.phase;

  return (
    <div className="min-h-screen p-6">
      <ClientBreadcrumb client={client} />
      <ClientHeader client={client} />
      
      <RevisionWorkflow 
        currentPhase={currentPhase}
        progress={client.progress}
        onPhaseClick={setSelectedPhase}
      />

      <Tabs defaultValue="revision" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="revision">Revisjonsprosess</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
        </TabsList>
        
        <TabsContent value="revision" className="mt-6">
          <PhaseContent phase={currentPhase} client={client} />
        </TabsContent>
        
        <TabsContent value="dashboard" className="mt-6">
          <div className="lg:grid lg:grid-cols-3 lg:gap-6">
            <div className="col-span-2 space-y-6">
              <KeyFigures 
                liquidityRatio={1.5} 
                equityRatio={35} 
                profitMargin={12.5} 
              />
              <FinancialChart financialData={[
                { year: 2021, revenue: 1250000, result: 350000 },
                { year: 2022, revenue: 1500000, result: 450000 },
                { year: 2023, revenue: 1800000, result: 520000 },
              ]} />
            </div>
            <div className="mt-6 lg:mt-0">
              <Overview
                documentCount={client.documents?.length || 0}
                nextAuditDeadline="31.05.2025"
                lastAccountingFile={{
                  name: "regnskap_2023.xlsx",
                  importDate: "15.03.2025"
                }}
                onUploadClick={() => {
                  console.log('Upload clicked');
                }}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="overview" className="mt-6">
          <div className="mt-6 lg:mt-0">
            <Overview
              documentCount={client.documents?.length || 0}
              nextAuditDeadline="31.05.2025"
              lastAccountingFile={{
                name: "regnskap_2023.xlsx",
                importDate: "15.03.2025"
              }}
              onUploadClick={() => {
                console.log('Upload clicked');
              }}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientDetail;
