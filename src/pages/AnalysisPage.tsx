import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useClientLookup } from '@/hooks/useClientLookup';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import StickyClientLayout from '@/components/Layout/StickyClientLayout';
import ClientNavigation from '@/components/Clients/ClientDetails/ClientNavigation';
import AccountingExplorer from '@/components/DataAnalysis/AccountingExplorer';
import AuditSampling from '@/components/DataAnalysis/AuditSampling';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Database, Download, Brain, Target, Settings } from 'lucide-react';
import ReportBuilder from '@/components/ReportBuilder/ReportBuilder';
import { Button } from '@/components/ui/button';
import { RegnskapsDashboard } from '@/components/Accounting/RegnskapsDashboard';
import { NorwegianCharFixer } from '@/components/Utils/NorwegianCharFixer';

const AnalysisPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: lookupResult, isLoading: lookupLoading } = useClientLookup(clientId);
  const actualClientId = lookupResult?.id || clientId;
  const { data: client, isLoading: clientLoading, error } = useClientDetails(actualClientId || '');
  const { setSelectedClientId } = useFiscalYear();
  
  const isLoading = lookupLoading || clientLoading;

  // Set the selected client ID when client data is loaded
  useEffect(() => {
    if (client?.id) {
      setSelectedClientId(client.id);
    }
  }, [client?.id, setSelectedClientId]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Klient ikke funnet</h1>
          <p className="text-muted-foreground">
            Kunne ikke finne klient med ID {clientId}
          </p>
        </div>
      </div>
    );
  }

  return (
    <StickyClientLayout
      clientName={client.company_name || client.name}
      orgNumber={client.org_number}
      pageTitle="Dataanalyse"
    >
      <div className="flex flex-col h-full">
        {/* Navigation handled by layout */}
        
        <div className="flex-1 overflow-auto">
          <div className="space-y-6 p-6">
            <Tabs defaultValue="data" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="data" className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Dataanalyse
                </TabsTrigger>
                <TabsTrigger value="analysis" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Avansert analyse
                </TabsTrigger>
                <TabsTrigger value="sampling" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Revisjonsutvalg
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Rapportbygger
                </TabsTrigger>
                <TabsTrigger value="utils" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Verktøy
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="data" className="mt-6">
                <AccountingExplorer clientId={client.id} />
              </TabsContent>
              
              <TabsContent value="analysis" className="mt-6">
                <RegnskapsDashboard clientId={client.id} />
              </TabsContent>
              
              <TabsContent value="sampling" className="mt-6">
                <AuditSampling clientId={client.id} />
              </TabsContent>
              
              <TabsContent value="reports" className="mt-6">
                <ReportBuilder clientId={client.id} />
              </TabsContent>
              
              <TabsContent value="utils" className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <NorwegianCharFixer />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </StickyClientLayout>
  );
};

export default AnalysisPage;