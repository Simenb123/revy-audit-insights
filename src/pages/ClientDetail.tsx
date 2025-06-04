
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
import ClientInfoForm from '@/components/Clients/ClientDetails/ClientInfoForm';
import { AuditPhase } from '@/types/revio';

const ClientDetail = () => {
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const { data: client, isLoading, error } = useClientDetails(orgNumber || '');
  const [selectedPhase, setSelectedPhase] = useState<AuditPhase | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Klient ikke funnet</h1>
        <p className="mb-6">Vi kunne ikke finne en klient med org.nummer {orgNumber}</p>
      </div>
    );
  }

  const currentPhase = selectedPhase || client.phase;

  const handlePhaseClick = (phase: AuditPhase) => {
    setSelectedPhase(phase);
    if (phase === 'overview') {
      setActiveTab('client-info');
    } else {
      setActiveTab('revision');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Revision Workflow Section - Fixed positioning */}
      <div className="bg-white border-b border-gray-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <RevisionWorkflow 
            currentPhase={currentPhase}
            progress={client.progress}
            onPhaseClick={handlePhaseClick}
          />
        </div>
      </div>

      {/* Breadcrumb Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <ClientBreadcrumb client={client} />
        </div>
      </div>

      {/* Client Header Section */}
      <ClientHeader client={client} />

      {/* Main Content with Tabs */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 mb-8">
              <TabsList className="grid w-full max-w-lg grid-cols-4 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                >
                  Dashboard
                </TabsTrigger>
                <TabsTrigger 
                  value="revision" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                >
                  Revisjonsprosess
                </TabsTrigger>
                <TabsTrigger 
                  value="client-info" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                >
                  Klientinformasjon
                </TabsTrigger>
                <TabsTrigger 
                  value="documents" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-medium"
                >
                  Dokumenter
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="overview" className="mt-0">
              <div className="animate-fade-in">
                <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                  <div className="col-span-2 space-y-8">
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
                  <div className="mt-8 lg:mt-0">
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
              </div>
            </TabsContent>
            
            <TabsContent value="revision" className="mt-0">
              <div className="animate-fade-in">
                <PhaseContent phase={currentPhase} client={client} />
              </div>
            </TabsContent>
            
            <TabsContent value="client-info" className="mt-0">
              <div className="animate-fade-in">
                <ClientInfoForm client={client} />
              </div>
            </TabsContent>
            
            <TabsContent value="documents" className="mt-0">
              <div className="animate-fade-in">
                <div className="text-center py-12">
                  <h3 className="text-lg font-semibold mb-4">Dokumenter</h3>
                  <p className="text-gray-600">Dokumenthåndtering kommer snart</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ClientDetail;
