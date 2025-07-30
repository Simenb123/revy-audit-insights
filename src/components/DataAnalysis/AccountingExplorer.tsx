import React, { useState, useMemo } from 'react';
import { useGLVersionOptions } from '@/hooks/useAccountingVersions';
import { useTBVersionOptions } from '@/hooks/useTrialBalanceVersions';
import { useAccountingData } from '@/hooks/useAccountingData';
import { useAccountingYear } from '@/hooks/useAccountingYear';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, BarChart2, FileText, Layers, LineChart } from 'lucide-react';
import DrillDownTable from './DrillDownTable';
import GeneralLedgerTable from '@/components/Accounting/GeneralLedgerTable';
import TrialBalanceTable from '@/components/Accounting/TrialBalanceTable';
import MaterialityBanner from './MaterialityBanner';
import GLVersionSelector from './GLVersionSelector';
import TBVersionSelector from './TBVersionSelector';
import VersionHistory from './VersionHistory';
import ValidationPanel from '@/components/Accounting/ValidationPanel';
import { GLVersionOption, TBVersionOption } from '@/types/accounting';
import ResponsiveTabs from '@/components/ui/responsive-tabs';

const materialityThresholds = {
  materiality: 2000000,
  workingMateriality: 1500000,
  clearlyTrivial: 150000
};

interface AccountingExplorerProps {
  clientId: string;
}

const AccountingExplorer: React.FC<AccountingExplorerProps> = ({ clientId }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch data using new specialized hooks
  const { data: glVersionOptions = [], isLoading: isLoadingGL } = useGLVersionOptions(clientId);
  const { data: tbVersionOptions = [], isLoading: isLoadingTB } = useTBVersionOptions(clientId);
  const { data: accountingData, isLoading: isLoadingAccounting } = useAccountingData(clientId);
  const { accountingYear } = useAccountingYear(clientId);

  console.log('[AccountingExplorer] GL Version Options:', glVersionOptions);
  console.log('[AccountingExplorer] TB Version Options:', tbVersionOptions);

  // Get default selected versions with proper fallbacks
  const defaultGLVersion = useMemo(() => {
    const activeVersion = glVersionOptions.find(v => v.is_active);
    const result = activeVersion || glVersionOptions[0] || null;
    console.log('[AccountingExplorer] Default GL Version:', result);
    return result;
  }, [glVersionOptions]);

  const defaultTBVersion = useMemo(() => {
    const result = tbVersionOptions[0] || null;
    console.log('[AccountingExplorer] Default TB Version:', result);
    return result;
  }, [tbVersionOptions]);

  // State for selected versions with safe initialization
  const [selectedGLVersion, setSelectedGLVersion] = useState<GLVersionOption | null>(null);
  const [selectedTBVersion, setSelectedTBVersion] = useState<TBVersionOption | null>(null);

  // Update state when defaults change - always set to latest active/default version
  React.useEffect(() => {
    if (defaultGLVersion) {
      console.log('[AccountingExplorer] Setting GL version to:', defaultGLVersion);
      setSelectedGLVersion(defaultGLVersion);
    }
  }, [defaultGLVersion]);

  React.useEffect(() => {
    if (defaultTBVersion) {
      console.log('[AccountingExplorer] Setting TB version to:', defaultTBVersion);
      setSelectedTBVersion(defaultTBVersion);
    }
  }, [defaultTBVersion]);

  console.log('[AccountingExplorer] Current Selected GL:', selectedGLVersion);
  console.log('[AccountingExplorer] Current Selected TB:', selectedTBVersion);

  // Check if data exists
  const hasGLData = glVersionOptions.length > 0;
  const hasTBData = tbVersionOptions.length > 0;

  const tabItems = [
    { id: 'overview', label: 'Oversikt', icon: Activity },
    { id: 'ledger', label: 'Hovedbok', icon: LineChart },
    { id: 'balances', label: 'Saldobalanse', icon: Layers },
    { id: 'journal', label: 'Bilag', icon: FileText },
  ];

  // Determine which version selector to show based on active tab
  const showGLVersions = activeTab === 'ledger' || activeTab === 'journal';
  const showTBVersions = activeTab === 'balances';
  const showBothVersions = activeTab === 'overview';

  if (isLoadingGL || isLoadingTB || isLoadingAccounting) {
    return (
      <div className="space-y-6">
        <MaterialityBanner thresholds={materialityThresholds} />
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
            {hasGLData && selectedGLVersion && (
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                  <LineChart className="h-4 w-4" />
                  General Ledger Versjon
                </label>
                <GLVersionSelector 
                  versions={glVersionOptions}
                  selectedVersion={selectedGLVersion}
                  onSelectVersion={setSelectedGLVersion}
                />
              </div>
            )}
            {hasTBData && selectedTBVersion && (
              <div className="flex-1">
                <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Trial Balance Versjon
                </label>
                <TBVersionSelector 
                  versions={tbVersionOptions}
                  selectedVersion={selectedTBVersion}
                  onSelectVersion={setSelectedTBVersion}
                />
              </div>
            )}
          </div>
        )}
        
        {showGLVersions && hasGLData && selectedGLVersion && (
          <GLVersionSelector 
            versions={glVersionOptions}
            selectedVersion={selectedGLVersion}
            onSelectVersion={setSelectedGLVersion}
          />
        )}
        
        {showTBVersions && hasTBData && selectedTBVersion && (
          <TBVersionSelector 
            versions={tbVersionOptions}
            selectedVersion={selectedTBVersion}
            onSelectVersion={setSelectedTBVersion}
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
                      {selectedGLVersion.label} • {selectedGLVersion.total_transactions} transaksjoner
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
                      {selectedTBVersion.label} • {selectedTBVersion.account_count} kontoer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Saldobalanse sammendrag kommer her...</p>
                  </CardContent>
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
              {hasTBData && selectedTBVersion ? (
                <TrialBalanceTable 
                  clientId={clientId} 
                  selectedVersion={selectedTBVersion.version}
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
                      {selectedGLVersion.label}
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
        
        <div className="w-full xl:w-72 xl:flex-shrink-0 space-y-4">
          <ValidationPanel 
            clientId={clientId} 
            selectedGLVersion={selectedGLVersion?.id}
            selectedTBVersion={selectedTBVersion?.version}
          />
        </div>
      </div>
    </div>
  );
};

export default AccountingExplorer;