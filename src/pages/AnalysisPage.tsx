import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useClientLookup } from '@/hooks/useClientLookup';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import StickyClientLayout from '@/components/Layout/StickyClientLayout';
import AccountingExplorer from '@/components/DataAnalysis/AccountingExplorer';
import AuditSampling from '@/components/DataAnalysis/AuditSampling';
import { AnalysisProvider } from '@/components/DataAnalysis/AnalysisProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { BarChart3, Download, Target, GitCompare } from 'lucide-react';
import ReportBuilder from '@/components/ReportBuilder/ReportBuilder';
import { UnifiedAnalysisSummary } from '@/components/DataAnalysis/UnifiedAnalysisSummary';
import GeneralLedgerComparison from '@/components/Accounting/GeneralLedgerComparison';
import ResponsiveTabs from '@/components/ui/responsive-tabs';

const AnalysisPage = React.memo(() => {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: lookupResult, isLoading: lookupLoading } = useClientLookup(clientId);
  const actualClientId = lookupResult?.id || clientId;
  const { data: client, isLoading: clientLoading, error } = useClientDetails(actualClientId || '');
  const { setSelectedClientId } = useFiscalYear();
  const [activeTab, setActiveTab] = useState('analysis');
  
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
        <div className="space-y-[var(--content-gap)]">
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
          <AnalysisProvider clientId={client.id}>
            <ResponsiveTabs
              items={[
                { id: 'analysis', label: 'Analyse', icon: BarChart3 },
                { id: 'comparison', label: 'Versjonssammenligning', icon: GitCompare },
                { id: 'sampling', label: 'Revisjonsutvalg', icon: Target },
                { id: 'reports', label: 'Rapporter', icon: Download }
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="underline"
              sticky={false}
            />
            
            <div className="p-6">
              {activeTab === 'analysis' && <UnifiedAnalysisSummary clientId={client.id} />}
              {activeTab === 'comparison' && <GeneralLedgerComparison clientId={client.id} />}
              {activeTab === 'sampling' && <AuditSampling clientId={client.id} />}
              {activeTab === 'reports' && <ReportBuilder clientId={client.id} />}
            </div>
          </AnalysisProvider>
        </div>
      </div>
    </StickyClientLayout>
  );
});

export default AnalysisPage;