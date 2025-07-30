
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
import { Database, FileCheck, LineChart, Layers, BookOpen } from 'lucide-react';
import ResponsiveTabs from '@/components/ui/responsive-tabs';
import DrillDownTable from './DrillDownTable';
import MaterialityBanner from './MaterialityBanner';
import VersionSelector from './VersionSelector';
import VersionHistory from './VersionHistory';
import GeneralLedgerTable from '@/components/Accounting/GeneralLedgerTable';
import TrialBalanceTable from '@/components/Accounting/TrialBalanceTable';
import ValidationPanel from '@/components/Accounting/ValidationPanel';
import { useAccountingData } from '@/hooks/useAccountingData';
import { useAccountingVersions, useActiveVersion } from '@/hooks/useAccountingVersions';
import { useTrialBalanceVersions, useActiveTrialBalanceVersion } from '@/hooks/useTrialBalanceVersions';
import { useAccountingYear } from '@/hooks/useAccountingYear';
import { format } from 'date-fns';

const materialityThresholds = {
  materiality: 2000000,
  workingMateriality: 1500000,
  clearlyTrivial: 150000
};

interface AccountingExplorerProps {
  clientId: string;
}

const AccountingExplorer = ({ clientId }: AccountingExplorerProps) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { accountingYear } = useAccountingYear(clientId);
  
  // General Ledger data
  const { data: glVersions = [] } = useAccountingVersions(clientId);
  const { data: activeGLVersion } = useActiveVersion(clientId);
  const { data: accountingData, isLoading } = useAccountingData(clientId);
  
  // Trial Balance data
  const { data: tbVersions = [] } = useTrialBalanceVersions(clientId);
  const { data: activeTBVersion } = useActiveTrialBalanceVersion(clientId);
  
  // Convert GL versions to DocumentVersion format
  const glVersionOptions: DocumentVersion[] = glVersions.map(version => ({
    id: version.id,
    version_name: `${version.file_name} (v${version.version_number})`,
    created_at: version.uploaded_at,
    client_audit_action_id: version.id,
    content: JSON.stringify({
      totalTransactions: version.total_transactions,
      totalDebitAmount: version.total_debit_amount,
      totalCreditAmount: version.total_credit_amount,
      balanceDifference: version.balance_difference
    }),
    change_source: 'upload' as const,
    created_by_user_id: version.uploaded_by || 'system',
    change_description: `Uploaded ${version.file_name} with ${version.total_transactions} transactions`
  }));

  // Convert TB versions to DocumentVersion format
  const tbVersionOptions: DocumentVersion[] = tbVersions.map(version => ({
    id: version.id,
    version_name: `${version.version} (${version.period_year})`,
    created_at: version.created_at,
    client_audit_action_id: version.id,
    content: JSON.stringify({
      accountCount: version.account_count,
      periodYear: version.period_year,
      periodStart: version.period_start_date,
      periodEnd: version.period_end_date
    }),
    change_source: 'upload' as const,
    created_by_user_id: 'system',
    change_description: `Saldobalanse ${version.version} for ${version.period_year} med ${version.account_count} kontoer`
  }));

  // Use active versions as defaults
  const defaultGLVersion = activeGLVersion 
    ? glVersionOptions.find(v => v.id === activeGLVersion.id) || glVersionOptions[0]
    : glVersionOptions[0];
    
  const defaultTBVersion = activeTBVersion 
    ? tbVersionOptions.find(v => v.version_name.includes(activeTBVersion.version)) || tbVersionOptions[0]
    : tbVersionOptions[0];
  
  const [selectedGLVersion, setSelectedGLVersion] = useState<DocumentVersion | undefined>(defaultGLVersion);
  const [selectedTBVersion, setSelectedTBVersion] = useState<DocumentVersion | undefined>(defaultTBVersion);

  const tabItems = [
    { id: 'overview', label: 'Oversikt', icon: Database },
    { id: 'ledger', label: 'Hovedbok', icon: LineChart },
    { id: 'balances', label: 'Saldobalanse', icon: Layers },
    { id: 'journal', label: 'Bilag', icon: FileCheck },
  ];

  const handleGLVersionChange = (version: DocumentVersion) => {
    setSelectedGLVersion(version);
  };

  const handleTBVersionChange = (version: DocumentVersion) => {
    setSelectedTBVersion(version);
  };

  // Determine which version selector to show based on active tab
  const showGLVersions = activeTab === 'ledger' || activeTab === 'journal';
  const showTBVersions = activeTab === 'balances';
  const showBothVersions = activeTab === 'overview';

  // Check what data is available
  const hasGLData = glVersions.length > 0;
  const hasTBData = tbVersions.length > 0;
  const hasAnyData = hasGLData || hasTBData;

  if (!hasAnyData) {
    return (
      <div className="space-y-6">
        <MaterialityBanner thresholds={materialityThresholds} />
        <Card>
          <CardHeader>
            <CardTitle>Ingen regnskapsdata funnet</CardTitle>
            <CardDescription>
              Last opp hovedbok eller saldobalanse for å se regnskapsanalyse
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <MaterialityBanner thresholds={materialityThresholds} />
      
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        {showBothVersions && (
          <div className="flex flex-col sm:flex-row gap-4">
            {hasGLData && (
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  Hovedbok versjon
                </label>
                <VersionSelector 
                  versions={glVersionOptions}
                  selectedVersion={selectedGLVersion}
                  onSelectVersion={handleGLVersionChange}
                />
              </div>
            )}
            {hasTBData && (
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Saldobalanse versjon
                </label>
                <VersionSelector 
                  versions={tbVersionOptions}
                  selectedVersion={selectedTBVersion}
                  onSelectVersion={handleTBVersionChange}
                />
              </div>
            )}
          </div>
        )}
        
        {showGLVersions && hasGLData && (
          <VersionSelector 
            versions={glVersionOptions}
            selectedVersion={selectedGLVersion}
            onSelectVersion={handleGLVersionChange}
          />
        )}
        
        {showTBVersions && hasTBData && (
          <VersionSelector 
            versions={tbVersionOptions}
            selectedVersion={selectedTBVersion}
            onSelectVersion={handleTBVersionChange}
          />
        )}
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
                <div className="space-y-6">
                  {hasGLData && selectedGLVersion && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <LineChart className="h-5 w-5" />
                          Hovedbok oversikt
                        </CardTitle>
                        <CardDescription>
                          {selectedGLVersion.version_name} ({format(new Date(selectedGLVersion.created_at), 'dd.MM.yyyy')})
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <DrillDownTable />
                      </CardContent>
                    </Card>
                  )}
                  
                  {hasTBData && selectedTBVersion && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Layers className="h-5 w-5" />
                          Saldobalanse oversikt
                        </CardTitle>
                        <CardDescription>
                          {selectedTBVersion.version_name} ({format(new Date(selectedTBVersion.created_at), 'dd.MM.yyyy')})
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Saldobalanse sammendrag kommer her...</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {!hasGLData && !hasTBData && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Ingen data tilgjengelig</CardTitle>
                        <CardDescription>
                          Last opp hovedbok eller saldobalanse for å se oversikt
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                </div>
            )}
            
            {activeTab === 'ledger' && (
              <div className="space-y-4">
                {hasGLData && selectedGLVersion ? (
                  <GeneralLedgerTable clientId={clientId} versionId={selectedGLVersion.id} />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Ingen hovedbok data</CardTitle>
                      <CardDescription>
                        Last opp hovedbok for å se transaksjoner
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}
              </div>
            )}
            
            {activeTab === 'balances' && (
              <div className="space-y-4">
                {hasTBData ? (
                  <TrialBalanceTable 
                    clientId={clientId} 
                    selectedVersion={selectedTBVersion?.version_name.split(' ')[0]}
                    accountingYear={accountingYear}
                  />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Ingen saldobalanse data</CardTitle>
                      <CardDescription>
                        Last opp saldobalanse for å se kontosaldoer
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}
              </div>
            )}
            
            {activeTab === 'journal' && (
              <div className="space-y-4">
                {hasGLData && selectedGLVersion ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Bilagsjournal</CardTitle>
                      <CardDescription>
                        {selectedGLVersion.version_name} ({format(new Date(selectedGLVersion.created_at), 'dd.MM.yyyy')})
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Innhold for bilagsjournal kommer her...</p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Ingen bilagsdata</CardTitle>
                      <CardDescription>
                        Last opp hovedbok for å se bilag
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="w-full xl:w-72 xl:flex-shrink-0 space-y-4">
          <ValidationPanel 
            clientId={clientId} 
            selectedGLVersion={selectedGLVersion?.id}
            selectedTBVersion={selectedTBVersion?.version_name.split(' ')[0]}
          />
          {activeTab === 'ledger' && hasGLData && (
            <VersionHistory versions={glVersionOptions} selectedVersion={selectedGLVersion} />
          )}
          {activeTab === 'balances' && hasTBData && (
            <VersionHistory versions={tbVersionOptions} selectedVersion={selectedTBVersion} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountingExplorer;
