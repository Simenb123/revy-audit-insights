import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import { useAccountingVersions } from '@/hooks/useAccountingVersions';
import { useTrialBalanceVersions } from '@/hooks/useTrialBalanceVersions';
import { usePayrollImports } from '@/hooks/usePayrollImports';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Download, Settings, Calendar } from 'lucide-react';
import StickyClientLayout from '@/components/Layout/StickyClientLayout';
import { formatDate } from '@/lib/utils';
import { exportArrayToXlsx } from '@/utils/exportToXlsx';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { A07ControlStatement } from '@/components/AccountingData/A07ControlStatement';
import { A07DataSection } from '@/components/AccountingData/A07DataSection';

const Regnskapsdata = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: client, isLoading, error } = useClientDetails(clientId || '');
  const { setSelectedClientId } = useFiscalYear();
  
  const { data: glVersions, isLoading: glLoading } = useAccountingVersions(clientId || '');
  const { data: tbVersions, isLoading: tbLoading } = useTrialBalanceVersions(clientId || '');
  const { data: payrollImports, isLoading: payrollLoading } = usePayrollImports(clientId || '');

  const handleExportPayrollData = async () => {
    if (!clientId || !payrollImports?.length) {
      toast({
        variant: 'destructive',
        title: 'Ingen data',
        description: 'Ingen A07-data å eksportere'
      });
      return;
    }

    try {
      // Fetch all payroll variables for all imports
      const allVariables: any[] = [];
      
      for (const payrollImport of payrollImports) {
        const { data: variables, error } = await supabase
          .from('payroll_variables')
          .select('*')
          .eq('import_id', payrollImport.id);
        
        if (error) throw error;
        
        // Convert each variable to a flat row for Excel
        variables?.forEach(variable => {
          allVariables.push({
            'Import ID': payrollImport.id,
            'Filnavn': payrollImport.file_name || 'Ukjent',
            'Periode': payrollImport.period_key || 'Ukjent',
            'Fra måned': payrollImport.fom_kalendermaaned || '',
            'Til måned': payrollImport.tom_kalendermaaned || '',
            'Org.nr': payrollImport.orgnr || '',
            'Virksomhetsnavn': payrollImport.navn || '',
            'Antall personer': payrollImport.antall_personer_innrapportert || 0,
            'Unike personer': payrollImport.antall_personer_unike || 0,
            'Variabel navn': variable.name,
            'Variabel verdi': typeof variable.value === 'object' ? JSON.stringify(variable.value) : variable.value,
            'Variabel type': 'a07_data',
            'Opprettet': formatDate(payrollImport.created_at),
            'Oppdatert': formatDate(payrollImport.updated_at)
          });
        });
      }

      if (allVariables.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Ingen data',
          description: 'Ingen detaljerte A07-data funnet'
        });
        return;
      }

      const fileName = `A07-data-${client.company_name || client.name}-${new Date().toISOString().split('T')[0]}`;
      exportArrayToXlsx(fileName, allVariables);
      
      toast({
        title: 'Eksportert',
        description: `A07-data eksportert til ${fileName}.xlsx`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: 'destructive',
        title: 'Feil ved eksport',
        description: 'Kunne ikke eksportere A07-data'
      });
    }
  };

  useEffect(() => {
    if (client?.id) {
      setSelectedClientId(client.id);
    }
  }, [client?.id, setSelectedClientId]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
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
          <p className="text-muted-foreground">Kunne ikke finne klient med ID {clientId}</p>
        </div>
      </div>
    );
  }

  const DocumentSection = ({ 
    title, 
    icon: Icon, 
    versions, 
    isLoading, 
    uploadPath,
    emptyText 
  }: {
    title: string;
    icon: any;
    versions: any[];
    isLoading: boolean;
    uploadPath: string;
    emptyText: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => window.location.href = uploadPath}>
          <Upload className="h-4 w-4 mr-2" />
          Last opp
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : versions && versions.length > 0 ? (
          <div className="space-y-3">
            {versions.slice(0, 3).map((version, index) => (
              <div key={version.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {version.fom_kalendermaaned && version.tom_kalendermaaned 
                        ? `Periode: ${version.fom_kalendermaaned} - ${version.tom_kalendermaaned}`
                        : version.file_name || version.version || `Import ${index + 1}`
                      }
                    </span>
                    {index === 0 && (
                      <Badge variant="default" className="text-xs">Aktiv</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(version.created_at || version.imported_at)}
                    </span>
                    {version.total_transactions && (
                      <span>{version.total_transactions} transaksjoner</span>
                    )}
                    {version.account_count && (
                      <span>{version.account_count} konti</span>
                    )}
                    {(version.antall_personer_innrapportert || version.employee_count) && (
                      <span>{version.antall_personer_innrapportert || version.employee_count} ansatte</span>
                    )}
                    {version.navn && (
                      <span>{version.navn}</span>
                    )}
                    {version.orgnr && (
                      <span>Org.nr: {version.orgnr}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {versions.length > 3 && (
              <Button variant="outline" className="w-full">
                Vis alle {versions.length} versjoner
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{emptyText}</p>
            <Button size="sm" variant="outline" className="mt-4" onClick={() => window.location.href = uploadPath}>
              <Upload className="h-4 w-4 mr-2" />
              Last opp første fil
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <StickyClientLayout
      clientName={client.company_name || client.name}
      orgNumber={client.org_number}
      pageTitle="Regnskapsdata"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DocumentSection
                title="Saldobalanse"
                icon={FileText}
                versions={tbVersions || []}
                isLoading={tbLoading}
                uploadPath={`/clients/${clientId}/trial-balance`}
                emptyText="Ingen saldobalanse lastet opp ennå"
              />
              
              <DocumentSection
                title="Hovedbok"
                icon={FileText}
                versions={glVersions || []}
                isLoading={glLoading}
                uploadPath={`/clients/${clientId}/general-ledger`}
                emptyText="Ingen hovedbok lastet opp ennå"
              />
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    A07 Lønnsdata
                  </CardTitle>
                  {payrollImports && payrollImports.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleExportPayrollData}
                      className="gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Eksporter Excel
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {payrollLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : payrollImports && payrollImports.length > 0 ? (
                    <div className="space-y-3">
                      {payrollImports.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{item.file_name || 'A07 Import'}</p>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>Periode: {item.fom_kalendermaaned || 'Ukjent'} - {item.tom_kalendermaaned || 'Ukjent'}</p>
                                {item.navn && <p>Virksomhet: {item.navn}</p>}
                                {item.antall_personer_innrapportert && (
                                  <p>Antall ansatte: {item.antall_personer_innrapportert}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">A07</Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(item.created_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Ingen lønnsdata lastet opp ennå</p>
                      <Button size="sm" variant="outline" className="mt-4" onClick={() => window.location.href = `/clients/${clientId}/payroll`}>
                        <Upload className="h-4 w-4 mr-2" />
                        Last opp første fil
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <DocumentSection
                title="SAF-T Import"
                icon={FileText}
                versions={[]}
                isLoading={false}
                uploadPath={`/clients/${clientId}/saft`}
                emptyText="Ingen SAF-T filer lastet opp ennå"
              />
            </div>

            {/* A07 Data Section - Upload and management */}
            <div className="mt-6">
              <A07DataSection
                clientId={clientId || ''}
                clientName={client.company_name || client.name}
              />
            </div>

            {/* A07 Control Statement - Analysis and comparison */}
            <div className="mt-6">
              <A07ControlStatement
                clientId={clientId || ''}
                clientName={client.company_name || client.name}
                fiscalYear={undefined} // Will use current fiscal year from context
              />
            </div>
          </div>
        </div>
      </div>
    </StickyClientLayout>
  );
};

export default Regnskapsdata;