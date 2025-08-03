import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Copy, Plus, Settings } from 'lucide-react';
import { useFirmStandardAccounts, useCopyGlobalStandards, useCopyGlobalMappingRules } from '@/hooks/useFirmStandardAccounts';
import { useUserProfile } from '@/hooks/useUserProfile';
import FirmStandardAccountTable from './FirmStandardAccountTable';
import FirmFinancialStatementPreview from './FirmFinancialStatementPreview';

const FirmStandardAccountsManager = () => {
  const { data: profile } = useUserProfile();
  const { data: firmAccounts, isLoading } = useFirmStandardAccounts();
  const copyGlobalStandards = useCopyGlobalStandards();
  const copyGlobalMappingRules = useCopyGlobalMappingRules();
  
  const [activeTab, setActiveTab] = useState("accounts");

  const handleCopyGlobalStandards = () => {
    if (profile?.auditFirmId) {
      copyGlobalStandards.mutate(profile.auditFirmId);
    }
  };

  const handleCopyGlobalMappingRules = () => {
    if (profile?.auditFirmId) {
      copyGlobalMappingRules.mutate(profile.auditFirmId);
    }
  };

  const hasCustomizations = firmAccounts?.some((account: any) => account.is_custom) || false;
      const totalAccounts = firmAccounts?.length || 0;
      const customAccounts = firmAccounts?.filter((account: any) => account.is_custom).length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Laster firmaspesifikke standardkontoer...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Firmaspesifikke Standardkontoer</h2>
          <p className="text-muted-foreground">
            Tilpass standardkontoplan og regnskapsoppstilling for ditt revisjonsfirma
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-sm">
            <Building2 className="w-3 h-3 mr-1" />
            {totalAccounts} kontoer
          </Badge>
          {hasCustomizations && (
            <Badge variant="secondary" className="text-sm">
              <Settings className="w-3 h-3 mr-1" />
              {customAccounts} tilpasset
            </Badge>
          )}
        </div>
      </div>

      {/* Setup Cards */}
      {totalAccounts === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Copy className="w-5 h-5" />
                <span>Kopier Global Standard</span>
              </CardTitle>
              <CardDescription>
                Start med å kopiere den globale standardkontoplanen som grunnlag for ditt firma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleCopyGlobalStandards}
                disabled={copyGlobalStandards.isPending}
                className="w-full"
              >
                {copyGlobalStandards.isPending ? 'Kopierer...' : 'Kopier Standardkontoer'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Kopier Mapping-regler</span>
              </CardTitle>
              <CardDescription>
                Kopier globale mapping-regler for automatisk kontotilordning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleCopyGlobalMappingRules}
                disabled={copyGlobalMappingRules.isPending || totalAccounts === 0}
                variant="outline"
                className="w-full"
              >
                {copyGlobalMappingRules.isPending ? 'Kopierer...' : 'Kopier Mapping-regler'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {totalAccounts > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="accounts">Standardkontoer</TabsTrigger>
            <TabsTrigger value="preview">Regnskapsoppstilling</TabsTrigger>
            <TabsTrigger value="settings">Innstillinger</TabsTrigger>
          </TabsList>
          
          <TabsContent value="accounts">
            <FirmStandardAccountTable />
          </TabsContent>
          
          <TabsContent value="preview">
            <FirmFinancialStatementPreview />
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Firma Innstillinger</CardTitle>
                <CardDescription>
                  Administrer firmaspesifikke innstillinger for standardkontoer og regnskapsoppstilling
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={handleCopyGlobalStandards}
                    disabled={copyGlobalStandards.isPending}
                    variant="outline"
                  >
                    {copyGlobalStandards.isPending ? 'Kopierer...' : 'Synkroniser med Global Standard'}
                  </Button>
                  
                  <Button 
                    onClick={handleCopyGlobalMappingRules}
                    disabled={copyGlobalMappingRules.isPending}
                    variant="outline"
                  >
                    {copyGlobalMappingRules.isPending ? 'Kopierer...' : 'Oppdater Mapping-regler'}
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Statistikk:</p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{totalAccounts}</div>
                      <div className="text-sm text-muted-foreground">Totalt kontoer</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{customAccounts}</div>
                      <div className="text-sm text-muted-foreground">Tilpassede</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{totalAccounts - customAccounts}</div>
                      <div className="text-sm text-muted-foreground">Standard</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default FirmStandardAccountsManager;