
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentVersion } from '@/types/revio';
import { Database, FileCheck, LineChart, Layers } from 'lucide-react';
import DrillDownTable from './DrillDownTable';
import MaterialityBanner from './MaterialityBanner';
import VersionSelector from './VersionSelector';
import VersionHistory from './VersionHistory';
import GeneralLedgerTable from '@/components/Accounting/GeneralLedgerTable';
import TrialBalanceTable from '@/components/Accounting/TrialBalanceTable';
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

  const handleVersionChange = (version: DocumentVersion) => {
    setSelectedVersion(version);
  };
  
  return (
    <div className="space-y-6">
      <MaterialityBanner thresholds={materialityThresholds} />
      
      <div className="flex justify-between items-center">
        <VersionSelector 
          versions={documentVersions}
          selectedVersion={selectedVersion}
          onSelectVersion={handleVersionChange}
        />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <Database size={14} />
              <span>Oversikt</span>
            </TabsTrigger>
            <TabsTrigger value="ledger" className="flex items-center gap-1">
              <LineChart size={14} />
              <span>Hovedbok</span>
            </TabsTrigger>
            <TabsTrigger value="balances" className="flex items-center gap-1">
              <Layers size={14} />
              <span>Saldobalanse</span>
            </TabsTrigger>
            <TabsTrigger value="journal" className="flex items-center gap-1">
              <FileCheck size={14} />
              <span>Bilag</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="overview" className="mt-0">
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
            </TabsContent>
            
            <TabsContent value="ledger" className="mt-0">
              <GeneralLedgerTable clientId={clientId} />
            </TabsContent>
            
            <TabsContent value="balances" className="mt-0">
              <TrialBalanceTable clientId={clientId} />
            </TabsContent>
            
            <TabsContent value="journal" className="mt-0">
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
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="xl:col-span-1">
          <VersionHistory versions={documentVersions} selectedVersion={selectedVersion} />
        </div>
      </div>
    </div>
  );
};

export default AccountingExplorer;
