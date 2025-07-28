
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
import { format } from 'date-fns';

const materialityThresholds = {
  materiality: 2000000,
  workingMateriality: 1500000,
  clearlyTrivial: 150000
};

// Mock data for document versions
const documentVersions: DocumentVersion[] = [
  { id: '1', version_name: 'Årsregnskap 2023 (sist importert)', created_at: '2024-03-15T12:00:00.000Z', client_audit_action_id: 'a1', content: '', change_source: 'user', created_by_user_id: 'u1', change_description: null },
  { id: '2', version_name: 'Årsregnskap 2023 (innlevert)', created_at: '2024-03-10T12:00:00.000Z', client_audit_action_id: 'a1', content: '', change_source: 'user', created_by_user_id: 'u1', change_description: null },
  { id: '3', version_name: 'Årsregnskap 2023 (utkast)', created_at: '2024-02-28T12:00:00.000Z', client_audit_action_id: 'a1', content: '', change_source: 'user', created_by_user_id: 'u1', change_description: null },
  { id: '4', version_name: 'Årsregnskap 2022 (endelig)', created_at: '2023-03-20T12:00:00.000Z', client_audit_action_id: 'a1', content: '', change_source: 'user', created_by_user_id: 'u1', change_description: null },
];

interface AccountingExplorerProps {
  clientId: string;
}

const AccountingExplorer = ({ clientId }: AccountingExplorerProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVersion, setSelectedVersion] = useState<DocumentVersion>(documentVersions[0]);
  const { data: accountingData, isLoading } = useAccountingData(clientId);

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
          versions={documentVersions}
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
              <GeneralLedgerTable clientId={clientId} />
            )}
            
            {activeTab === 'balances' && (
              <TrialBalanceTable clientId={clientId} />
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
          <VersionHistory versions={documentVersions} selectedVersion={selectedVersion} />
        </div>
      </div>
    </div>
  );
};

export default AccountingExplorer;
