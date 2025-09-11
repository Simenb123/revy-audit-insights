import React, { useState } from 'react';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useTBVersionOptions } from '@/hooks/useTrialBalanceVersions';
import TrialBalanceTable from './TrialBalanceTable';
import TBVersionSelector from '@/components/DataAnalysis/TBVersionSelector';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers } from 'lucide-react';
import { TBVersionOption } from '@/types/accounting';

interface TrialBalanceViewProps {
  clientId: string;
}

const TrialBalanceView = ({ clientId }: TrialBalanceViewProps) => {
  const { selectedFiscalYear } = useFiscalYear();
  const { data: versionOptions, isLoading: versionLoading } = useTBVersionOptions(clientId, selectedFiscalYear);
  const [selectedTBVersion, setSelectedTBVersion] = useState<TBVersionOption | null>(null);

  React.useEffect(() => {
    if (versionOptions && versionOptions.length > 0 && !selectedTBVersion) {
      // Select the first (most recent) version by default
      setSelectedTBVersion(versionOptions[0]);
    }
  }, [versionOptions, selectedTBVersion]);

  if (versionLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Laster saldobalanse...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!versionOptions || versionOptions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ingen saldobalanse data</CardTitle>
          <CardDescription>
            Ingen saldobalanse funnet for {selectedFiscalYear}. Last opp data for å komme i gang.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Version selector */}
      <div className="flex items-center gap-4">
        <TBVersionSelector
          versions={versionOptions}
          selectedVersion={selectedTBVersion}
          onSelectVersion={setSelectedTBVersion}
          clientId={clientId}
        />
      </div>

      {/* Trial balance table */}
      {selectedTBVersion && (
        <TrialBalanceTable
          clientId={clientId}
          selectedVersion={selectedTBVersion.version}
          accountingYear={selectedFiscalYear}
        />
      )}
    </div>
  );
};

export default TrialBalanceView;