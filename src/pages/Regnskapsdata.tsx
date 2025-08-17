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

const Regnskapsdata = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: client, isLoading, error } = useClientDetails(clientId || '');
  const { setSelectedClientId } = useFiscalYear();
  
  const { data: glVersions, isLoading: glLoading } = useAccountingVersions(clientId || '');
  const { data: tbVersions, isLoading: tbLoading } = useTrialBalanceVersions(clientId || '');
  const { data: payrollImports, isLoading: payrollLoading } = usePayrollImports(clientId || '');

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
              
              <DocumentSection
                title="A07 Lønnsdata"
                icon={FileText}
                versions={payrollImports || []}
                isLoading={payrollLoading}
                uploadPath={`/clients/${clientId}/payroll`}
                emptyText="Ingen lønnsdata lastet opp ennå"
              />
              
              <DocumentSection
                title="SAF-T Import"
                icon={FileText}
                versions={[]}
                isLoading={false}
                uploadPath={`/clients/${clientId}/saft`}
                emptyText="Ingen SAF-T filer lastet opp ennå"
              />
            </div>
          </div>
        </div>
      </div>
    </StickyClientLayout>
  );
};

export default Regnskapsdata;