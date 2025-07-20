
import React from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import WelcomeDashboard from '@/components/Welcome/WelcomeDashboard';
import PageContainer from '@/components/Layout/PageContainer';
import PageHeader from '@/components/Layout/PageHeader';
import ContentGrid from '@/components/Layout/ContentGrid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Users, FileText, TrendingUp } from 'lucide-react';

const Index = () => {
  const { data: userProfile, isLoading } = useUserProfile();

  // Show loading state
  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Laster...</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Show welcome dashboard for new users
  const showWelcomeDashboard = !userProfile?.firstName || new URLSearchParams(window.location.search).get('welcome') === 'true';

  if (showWelcomeDashboard) {
    return <WelcomeDashboard />;
  }

  // Dashboard-spesifikke widgets - ikke duplikater av sidebar
  const dashboardStats = [
    {
      title: 'Aktive Prosjekter',
      value: '12',
      description: 'Pågående arbeidsoppgaver',
      icon: BarChart3,
      trend: '+2 denne uken'
    },
    {
      title: 'Ventende Oppgaver',
      value: '8',
      description: 'Krever din oppmerksomhet',
      icon: FileText,
      trend: '-3 siden i går'
    },
    {
      title: 'Team Ytelse',
      value: '94%',
      description: 'Gjennomsnittlig fremdrift',
      icon: TrendingUp,
      trend: '+5% denne måneden'
    }
  ];

  return (
    <PageContainer maxWidth="xl" padding="md">
      <PageHeader
        title="Dashboard"
        subtitle={`Velkommen tilbake, ${userProfile?.firstName || 'Bruker'}`}
        size="lg"
      />
      
      {/* High-level metrics - NOT duplicating sidebar content */}
      <ContentGrid columns={3} gap="md" className="mb-8">
        {dashboardStats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </ContentGrid>

      {/* Recent Activity - Dashboard specific content */}
      <ContentGrid columns={2} gap="lg">
        <Card>
          <CardHeader>
            <CardTitle>Nylig Aktivitet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Risikoanalyse fullført</p>
                  <p className="text-xs text-muted-foreground">Acme Corp - 2 timer siden</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Ny klient registrert</p>
                  <p className="text-xs text-muted-foreground">TechStart AS - 4 timer siden</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Rapport klar for gjennomgang</p>
                  <p className="text-xs text-muted-foreground">BuildCo Ltd - 6 timer siden</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kommende Frister</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Årsrapport Acme Corp</p>
                  <p className="text-xs text-muted-foreground">Forfaller i morgen</p>
                </div>
                <div className="text-xs font-medium text-red-600">Høy prioritet</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Kvartalsgjennomgang</p>
                  <p className="text-xs text-muted-foreground">3 dager igjen</p>
                </div>
                <div className="text-xs font-medium text-yellow-600">Medium prioritet</div>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Team-møte</p>
                  <p className="text-xs text-muted-foreground">1 uke igjen</p>
                </div>
                <div className="text-xs font-medium text-blue-600">Lav prioritet</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </ContentGrid>
    </PageContainer>
  );
};

export default Index;
