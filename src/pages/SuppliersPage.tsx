import React from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useSaftSuppliers } from '@/hooks/useSaftSuppliers';
import { useSaftImportSessions } from '@/hooks/useSaftImportSessions';
import StickyClientLayout from '@/components/Layout/StickyClientLayout';
import { SaftSuppliersTable } from '@/components/DataUpload/reports/SaftSuppliersTable';
import { SaftSuppliersAgedAnalysis } from '@/components/DataUpload/reports/SaftSuppliersAgedAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Building, FileText } from 'lucide-react';

const SuppliersPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: client, isLoading: clientLoading } = useClientDetails(clientId || '');
  const { data: saftSessions, isLoading: sessionsLoading } = useSaftImportSessions(clientId);
  const { data: suppliers, isLoading: suppliersLoading } = useSaftSuppliers(clientId);

  const totalSuppliers = suppliers?.length || 0;
  const totalBalance = suppliers?.reduce((sum, supplier) => sum + supplier.closing_balance_netto, 0) || 0;

  if (clientLoading || !client) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <StickyClientLayout
      clientName={client.company_name || client.name}
      orgNumber={client.org_number}
      pageTitle="Leverandøranalyse"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          <div className="space-y-6 p-6">
            {/* Oversikt */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Totalt antall leverandører</CardTitle>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {suppliersLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{totalSuppliers}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total leverandørbalanse</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {suppliersLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <div className="text-2xl font-bold">
                      {new Intl.NumberFormat('no-NO', { 
                        style: 'currency', 
                        currency: 'NOK',
                        minimumFractionDigits: 0
                      }).format(totalBalance)}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">SAF-T importer</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {sessionsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <div className="text-2xl font-bold">{saftSessions?.length || 0}</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Aldersfordeling */}
            <Card>
              <CardHeader>
                <CardTitle>Aldersfordeling leverandørgjeld</CardTitle>
              </CardHeader>
              <CardContent>
                <SaftSuppliersAgedAnalysis clientId={clientId || ''} />
              </CardContent>
            </Card>

            {/* Leverandørtabell */}
            <Card>
              <CardHeader>
                <CardTitle>Alle leverandører</CardTitle>
              </CardHeader>
              <CardContent>
                <SaftSuppliersTable clientId={clientId || ''} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StickyClientLayout>
  );
};

export default SuppliersPage;