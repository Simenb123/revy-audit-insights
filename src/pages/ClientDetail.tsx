
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import AppLayout from "@/components/Layout/AppLayout";
import KeyFigures from '@/components/Clients/ClientDetails/ClientDashboard/KeyFigures';
import FinancialChart from '@/components/Clients/ClientDetails/ClientDashboard/FinancialChart';
import Overview from '@/components/Clients/ClientDetails/ClientDashboard/Overview';

const ClientDetail = () => {
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading, error } = useClientDetails(orgNumber || '');

  // Mock data - replace with real data when available
  const mockFinancialData = [
    { year: 2021, revenue: 1250000, result: 350000 },
    { year: 2022, revenue: 1500000, result: 450000 },
    { year: 2023, revenue: 1800000, result: 520000 },
  ];

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  if (error || !client) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Klient ikke funnet</h1>
            <p className="mb-6">Vi kunne ikke finne en klient med org.nummer {orgNumber}</p>
            <Button onClick={() => navigate('/klienter')}>
              <ChevronLeft className="mr-2 h-4 w-4" /> Tilbake til klientoversikt
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="outline" onClick={() => navigate('/klienter')}>
            <ChevronLeft className="mr-2 h-4 w-4" /> Tilbake
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">{client.companyName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">Org.nr: {client.orgNumber}</p>
            <Badge variant={client.status === 'Aktiv' ? 'success' : 'destructive'}>
              {client.status || 'Ukjent'}
            </Badge>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Left column - 2/3 width */}
          <div className="col-span-2 space-y-6">
            <KeyFigures 
              liquidityRatio={1.5} 
              equityRatio={35} 
              profitMargin={12.5} 
            />
            <FinancialChart financialData={mockFinancialData} />
          </div>

          {/* Right column - 1/3 width */}
          <div className="mt-6 lg:mt-0">
            <Overview
              documentCount={client.documents?.length || 0}
              nextAuditDeadline="31.05.2025"
              lastAccountingFile={{
                name: "regnskap_2023.xlsx",
                importDate: "15.03.2025"
              }}
              onUploadClick={() => {
                // TODO: Implement upload functionality
                console.log('Upload clicked');
              }}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ClientDetail;
