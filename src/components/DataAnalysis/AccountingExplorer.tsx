import React, { useState, useMemo } from 'react';
import { useActiveVersion } from '@/hooks/useAccountingVersions';
import { useTBVersionOptions } from '@/hooks/useTrialBalanceVersions';
import { useAccountingData } from '@/hooks/useAccountingData';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSearchParams } from 'react-router-dom';
import { TrendingUp, Activity, BarChart2, FileText, Layers, LineChart, GitBranch, Filter, X } from 'lucide-react';
import DrillDownTable from './DrillDownTable';
import GeneralLedgerTable from '@/components/Accounting/GeneralLedgerTable';
import TrialBalanceTable from '@/components/Accounting/TrialBalanceTable';

import GLVersionSelector from './GLVersionSelector';
import TBVersionSelector from './TBVersionSelector';
import VersionHistory from './VersionHistory';
import ValidationPanel from '@/components/Accounting/ValidationPanel';
import ClientFinancialStatementGenerator from './ClientFinancialStatementGenerator';
import TrialBalanceMappingTable from '../Accounting/TrialBalanceMappingTable';
import { GLVersionOption, TBVersionOption } from '@/types/accounting';
import ResponsiveTabs from '@/components/ui/responsive-tabs';
import { Button } from '@/components/ui/button';


interface AccountingExplorerProps {
  clientId: string;
}

const AccountingExplorer: React.FC<AccountingExplorerProps> = ({ clientId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get global context
  const { selectedFiscalYear } = useFiscalYear();
  const { data: activeGLVersion, isLoading: isLoadingGL } = useActiveVersion(clientId);
  const { data: tbVersionOptions = [], isLoading: isLoadingTB } = useTBVersionOptions(clientId, selectedFiscalYear);
  const { data: accountingData, isLoading: isLoadingAccounting } = useAccountingData(clientId);

  console.log('[AccountingExplorer] Active GL Version:', activeGLVersion);
  console.log('[AccountingExplorer] TB Version Options:', tbVersionOptions);

  // Use first TB version as selected (since TB doesn't have active versions)
  const selectedTBVersion = useMemo(() => {
    return tbVersionOptions[0] || null;
  }, [tbVersionOptions]);

  const [searchParams, setSearchParams] = useSearchParams();

  console.log('[AccountingExplorer] Current Active GL:', activeGLVersion);
  console.log('[AccountingExplorer] Current Selected TB:', selectedTBVersion);

  // Check if data exists
  const hasGLData = !!activeGLVersion;
  const hasTBData = tbVersionOptions.length > 0;

  const tabItems = [
    { id: 'overview', label: 'Oversikt', icon: Activity },
    { id: 'ledger', label: 'Hovedbok', icon: LineChart },
    { id: 'balances', label: 'Saldobalanse', icon: Layers },
    { id: 'statement', label: 'Regnskapsoppstilling', icon: BarChart2 },
    { id: 'journal', label: 'Bilag', icon: FileText },
  ];

  React.useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && tabParam !== activeTab && tabItems.some(t => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, activeTab]);

  const glAccount = searchParams.get('gl_account') || undefined;
  const clearGLAccountFilter = React.useCallback(() => {
    const p = new URLSearchParams(searchParams);
    p.delete('gl_account');
    setSearchParams(p);
  }, [searchParams, setSearchParams]);

  // Show version info but don't allow changing (using global active version)
  const showVersionInfo = activeTab === 'overview';

  if (isLoadingGL || isLoadingTB || isLoadingAccounting) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Laster regnskapsdata...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!hasGLData && !hasTBData) {
    return (
      <div className="space-y-6">
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
      
      
      {showVersionInfo && (
        <div className="flex flex-col sm:flex-row gap-4">
          {hasGLData && activeGLVersion && (
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                Aktiv Hovedbok Versjon
              </label>
              <div className="px-3 py-2 border rounded-md bg-muted/50">
                <div className="text-sm font-medium">
                  Versjon {activeGLVersion.version_number} - {activeGLVersion.file_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {activeGLVersion.total_transactions} transaksjoner
                </div>
              </div>
            </div>
          )}
          {hasTBData && selectedTBVersion && (
            <div className="flex-1">
              <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Trial Balance ({selectedFiscalYear})
              </label>
              <div className="px-3 py-2 border rounded-md bg-muted/50">
                <div className="text-sm font-medium">
                  {selectedTBVersion.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedTBVersion.account_count} kontoer
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      <ResponsiveTabs
        items={tabItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
      />
      
      <div className="w-full">
        <div className="w-full">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {hasGLData && activeGLVersion && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5" />
                      Hovedbok oversikt
                    </CardTitle>
                    <CardDescription>
                      Versjon {activeGLVersion.version_number} • {activeGLVersion.total_transactions} transaksjoner
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <DrillDownTable clientId={clientId} />
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
                      {selectedTBVersion.label} • {selectedTBVersion.account_count} kontoer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Saldobalanse sammendrag kommer her...</p>
                  </CardContent>
                </Card>
              )}

              <ValidationPanel 
                clientId={clientId} 
                selectedGLVersion={activeGLVersion?.id} 
                selectedTBVersion={selectedTBVersion?.version} 
              />
            </div>
          )}
          
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              {hasGLData && activeGLVersion ? (
                <GeneralLedgerTable clientId={clientId} versionId={activeGLVersion.id} />
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
              {hasTBData && selectedTBVersion ? (
                <TrialBalanceTable 
                  clientId={clientId} 
                  selectedVersion={selectedTBVersion.version}
                  accountingYear={selectedFiscalYear}
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
          
          {activeTab === 'statement' && (
            <div className="space-y-4">
              {hasTBData && selectedTBVersion ? (
                <ClientFinancialStatementGenerator 
                  clientId={clientId} 
                  selectedVersion={selectedTBVersion.version}
                  onNavigateToMapping={() => setActiveTab('balances')}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Ingen saldobalanse data</CardTitle>
                    <CardDescription>
                      Last opp saldobalanse for å generere regnskapsoppstilling
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          )}
          
          {activeTab === 'journal' && (
            <div className="space-y-4">
              {hasGLData && activeGLVersion ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Bilagsjournal</CardTitle>
                    <CardDescription>
                      Versjon {activeGLVersion.version_number} - {activeGLVersion.file_name}
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
    </div>
  );
};

export default AccountingExplorer;