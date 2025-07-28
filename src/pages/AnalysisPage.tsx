import React from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import ResponsiveLayout from '@/components/Layout/ResponsiveLayout';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';
import GlobalSubHeader from '@/components/Layout/GlobalSubHeader';
import AccountingExplorer from '@/components/DataAnalysis/AccountingExplorer';
import { Skeleton } from '@/components/ui/skeleton';

const AnalysisPage = () => {
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const { data: client, isLoading, error } = useClientDetails(orgNumber || '');

  if (isLoading) {
    return (
      <ResponsiveLayout>
        <StandardPageLayout>
          <div className="p-6 space-y-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-64 w-full" />
          </div>
        </StandardPageLayout>
      </ResponsiveLayout>
    );
  }

  if (error || !client) {
    return (
      <ResponsiveLayout>
        <StandardPageLayout>
          <div className="p-6 text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Klient ikke funnet</h1>
            <p className="text-muted-foreground">
              Kunne ikke finne klient med organisasjonsnummer {orgNumber}
            </p>
          </div>
        </StandardPageLayout>
      </ResponsiveLayout>
    );
  }

  const moduleIndicator = (
    <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
      Regnskapsanalyse
    </div>
  );

  return (
    <ResponsiveLayout>
      <StandardPageLayout
        header={
          <GlobalSubHeader
            title="Regnskapsanalyse"
            moduleIndicator={moduleIndicator}
          />
        }
      >
        <div className="p-6 space-y-6">
          <div>
            <p className="text-muted-foreground">
              Utforsk hovedbok, saldobalanse og regnskapstransaksjoner for {client.name}
            </p>
          </div>
          
          <AccountingExplorer clientId={client.id} />
        </div>
      </StandardPageLayout>
    </ResponsiveLayout>
  );
};

export default AnalysisPage;