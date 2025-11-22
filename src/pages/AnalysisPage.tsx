import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useClientLookup } from '@/hooks/useClientLookup';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import StickyClientLayout from '@/components/Layout/StickyClientLayout';
import ClientNavigation from '@/components/Clients/ClientDetails/ClientNavigation';
import AccountingExplorer from '@/components/DataAnalysis/AccountingExplorer';
import AuditSampling from '@/components/DataAnalysis/AuditSampling';
import { AnalysisProvider } from '@/components/DataAnalysis/AnalysisProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Database, Download, Target, Settings, GitCompare } from 'lucide-react';
import ReportBuilder from '@/components/ReportBuilder/ReportBuilder';
import { Button } from '@/components/ui/button';
import { UnifiedAnalysisSummary } from '@/components/DataAnalysis/UnifiedAnalysisSummary';
import { NorwegianCharFixer } from '@/components/Utils/NorwegianCharFixer';
import GeneralLedgerComparison from '@/components/Accounting/GeneralLedgerComparison';

const AnalysisPage = React.memo(() => {
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
            <AnalysisProvider clientId={client.id}>
              <Tabs defaultValue="analysis" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="analysis" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analyse</span>
                  <span className="sm:hidden">Analyse</span>
                </TabsTrigger>
                <TabsTrigger value="comparison" className="flex items-center gap-2">
                  <GitCompare className="h-4 w-4" />
                  <span className="hidden sm:inline">Versjonssammenligning</span>
                  <span className="sm:hidden">Versjon</span>
                </TabsTrigger>
                <TabsTrigger value="sampling" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  <span className="hidden sm:inline">Revisjonsutvalg</span>
                  <span className="sm:hidden">Utvalg</span>
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Rapporter</span>
                  <span className="sm:hidden">Rapporter</span>
                </TabsTrigger>
                <TabsTrigger value="tools" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Verktøy</span>
                  <span className="sm:hidden">Verktøy</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="analysis" className="mt-6">
                <UnifiedAnalysisSummary clientId={client.id} />
              </TabsContent>

              <TabsContent value="comparison" className="mt-6">
                <GeneralLedgerComparison clientId={client.id} />
              </TabsContent>
              
              <TabsContent value="sampling" className="mt-6">
                <AuditSampling clientId={client.id} />
              </TabsContent>
              
              <TabsContent value="reports" className="mt-6">
                <ReportBuilder clientId={client.id} />
              </TabsContent>
              
              <TabsContent value="tools" className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <NorwegianCharFixer />
                </div>
              </TabsContent>
              </Tabs>
            </AnalysisProvider>
          </div>
        </div>
      </div>
    </StickyClientLayout>
  );
});

export default AnalysisPage;