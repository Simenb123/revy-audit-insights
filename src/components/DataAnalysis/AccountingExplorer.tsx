
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
} from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { DocumentVersion } from '@/types/revio';
import { Database, FileCheck, LineChart, Layers } from 'lucide-react';
import ResponsiveTabs from '@/components/ui/responsive-tabs';
import DrillDownTable from './DrillDownTable';
import MaterialityBanner from './MaterialityBanner';
import VersionSelector from './VersionSelector';
import VersionHistory from './VersionHistory';
import GeneralLedgerTable from '@/components/Accounting/GeneralLedgerTable';
import TrialBalanceTable from '@/components/Accounting/TrialBalanceTable';
import ValidationPanel from '@/components/Accounting/ValidationPanel';
import { useAccountingData } from '@/hooks/useAccountingData';
import { useAvailableVersions } from '@/hooks/useAvailableVersions';
import { useAccountingYear } from '@/hooks/useAccountingYear';
import { format } from 'date-fns';

const materialityThresholds = {
  materiality: 2000000,
  workingMateriality: 1500000,
  clearlyTrivial: 150000
};

// Helper function to create version options from available versions
const createVersionOptions = (versions: string[], accountingYear: number): DocumentVersion[] => {
  return versions.map((version, index) => ({
    id: version,
    version_name: `${version} (${accountingYear})`,
    created_at: new Date().toISOString(),
    client_audit_action_id: `action_${index}`,
    content: '',
    change_source: 'upload' as const,
    created_by_user_id: 'user',
    change_description: null as string | null
  }));
};

interface AccountingExplorerProps {
  clientId: string;
}

const AccountingExplorer = ({ clientId }: AccountingExplorerProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { accountingYear } = useAccountingYear(clientId);
  const { data: availableVersions = ['v1'] } = useAvailableVersions(clientId);
  const { data: accountingData, isLoading } = useAccountingData(clientId);
  
  // Create version options from available versions
  const versionOptions = createVersionOptions(availableVersions, accountingYear);
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion>(versionOptions[0]);

  const tabItems = [
    { id: 'overview', label: 'Oversikt', icon: Database },
    { id: 'ledger', label: 'Hovedbok', icon: LineChart },
    { id: 'balances', label: 'Saldobalanse', icon: Layers },
    { id: 'journal', label: 'Bilag', icon: FileCheck },
  ];

  const handleVersionChange = (version: DocumentVersion) => {
    setSelectedVersion(version);
  };
  
  return (
    <div className="space-y-6">
      <MaterialityBanner thresholds={materialityThresholds} />
      
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <VersionSelector 
          versions={versionOptions}
          selectedVersion={selectedVersion}
          onSelectVersion={handleVersionChange}
        />
      </div>
      
      <ResponsiveTabs
        items={tabItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
      />
      
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 min-w-0">
          <div>
            {activeTab === 'overview' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Regnskapsoversikt</CardTitle>
                    <CardDescription>
                      {selectedVersion.version_name} ({format(new Date(selectedVersion.created_at), 'dd.MM.yyyy')})
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DrillDownTable />
                  </CardContent>
                </Card>
            )}
            
            {activeTab === 'ledger' && (
              <div className="space-y-4">
                <GeneralLedgerTable clientId={clientId} />
              </div>
            )}
            
            {activeTab === 'balances' && (
              <TrialBalanceTable 
                clientId={clientId} 
                selectedVersion={selectedVersion.id}
                accountingYear={accountingYear}
              />
            )}
            
            {activeTab === 'journal' && (
              <Card>
                <CardHeader>
                  <CardTitle>Bilagsjournal</CardTitle>
                  <CardDescription>
                    {selectedVersion.version_name} ({format(new Date(selectedVersion.created_at), 'dd.MM.yyyy')})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Innhold for bilagsjournal kommer her...</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        <div className="w-full xl:w-72 xl:flex-shrink-0 space-y-4">
          <ValidationPanel clientId={clientId} />
          <VersionHistory versions={versionOptions} selectedVersion={selectedVersion} />
        </div>
      </div>
    </div>
  );
};

export default AccountingExplorer;
