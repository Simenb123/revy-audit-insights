
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/formatters';
import { ChevronLeft, Upload } from 'lucide-react';
import AppLayout from "@/components/Layout/AppLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Mock data for now - in a real app, this would come from the API
const mockFinancialData = [
  { year: 2021, revenue: 1250000, result: 350000 },
  { year: 2022, revenue: 1500000, result: 450000 },
  { year: 2023, revenue: 1800000, result: 520000 },
];

const KPICard = ({ title, value, description }: { title: string; value: string; description: string }) => (
  <div className="bg-white rounded-lg p-4 shadow">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-gray-500">{description}</p>
  </div>
);

const ClientDetail = () => {
  const { orgNumber } = useParams<{ orgNumber: string }>();
  const navigate = useNavigate();
  const { data: client, isLoading, error } = useClientDetails(orgNumber || '');

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

  const capital = client.equityCapital || client.shareCapital;

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
          <p className="text-muted-foreground">Org.nr: {client.orgNumber}</p>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Left column - 2/3 width */}
          <div className="col-span-2 space-y-6">
            {/* Company details card */}
            <Card>
              <CardHeader>
                <CardTitle>Selskapsdetaljer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Adresse</h3>
                    <p>{client.address || 'Ikke registrert'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Poststed</h3>
                    <p>{client.postalCode} {client.city}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Kommune</h3>
                    <p>{client.municipalityName || 'Ikke registrert'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <Badge variant={client.status === 'Aktiv' ? 'success' : 'destructive'}>
                      {client.status || 'Ukjent'}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Registreringsdato</h3>
                    <p>{client.registrationDate || 'Ikke registrert'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Kapital</h3>
                    <p>{capital ? formatCurrency(Number(capital)) : 'Ikke registrert'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key figures card */}
            <Card>
              <CardHeader>
                <CardTitle>Nøkkeltall</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <KPICard 
                    title="Likviditetsgrad" 
                    value="1.5" 
                    description="Omløpsmidler delt på kortsiktig gjeld"
                  />
                  <KPICard 
                    title="Egenkapitalandel" 
                    value="35%" 
                    description="Egenkapital i % av sum eiendeler"
                  />
                  <KPICard 
                    title="Resultatgrad" 
                    value="12.5%" 
                    description="Driftsresultat i % av driftsinntekter"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Drill-down card */}
            <Card>
              <CardHeader>
                <CardTitle>Drill-down</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={mockFinancialData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => formatCurrency(Number(value))}
                        labelFormatter={(label) => `År ${label}`}
                      />
                      <Bar name="Omsetning" dataKey="revenue" fill="#8884d8" />
                      <Bar name="Resultat" dataKey="result" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - 1/3 width */}
          <div className="mt-6 lg:mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Oversikt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Totale dokumenter</h3>
                  <p className="text-xl font-bold">{client.documents?.length || 0}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Neste revisjonsfrist</h3>
                  <p>31.05.2025</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Sist importerte regnskapsfil</h3>
                  <p>regnskap_2023.xlsx</p>
                  <p className="text-xs text-gray-500">Importert: 15.03.2025</p>
                </div>
                <Button className="w-full">
                  <Upload className="mr-2 h-4 w-4" /> Last opp regnskapsdata
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ClientDetail;
