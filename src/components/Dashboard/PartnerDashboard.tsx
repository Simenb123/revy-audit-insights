
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Settings, BarChart3, TrendingUp, Building2, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';

const PartnerDashboard = () => {
  const { data: userProfile } = useUserProfile();

  const quickActions = [
    {
      title: 'Organisasjonsinnstillinger',
      description: 'Konfigurer firmaets struktur og policyer',
      icon: Settings,
      to: '/organisasjonsinnstillinger',
      variant: 'default' as const
    },
    {
      title: 'Resultater og analyser',
      description: 'Se firmaets prestasjoner og KPIer',
      icon: BarChart3,
      to: '/analyser',
      variant: 'outline' as const
    },
    {
      title: 'Brukeradministrasjon',
      description: 'Administrer team og tilganger',
      icon: Users,
      to: '/brukeradministrasjon',
      variant: 'outline' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Velkommen, Partner {userProfile?.firstName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">Partner</Badge>
            <span className="text-sm text-muted-foreground">
              Lederskap og strategisk oversikt
            </span>
          </div>
          <p className="text-muted-foreground">
            Som partner har du tilgang til alle strategiske verktøy og kan administrere 
            organisasjonsstruktur og forretningsmål.
          </p>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">+12%</h3>
              <p className="text-sm text-muted-foreground">Vekst i år</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">24</h3>
              <p className="text-sm text-muted-foreground">Ansatte</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Building2 className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">156</h3>
              <p className="text-sm text-muted-foreground">Aktive klienter</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">3</h3>
              <p className="text-sm text-muted-foreground">Oppmerksomheter</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ledelsesverktøy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Button 
                key={action.to}
                asChild 
                variant={action.variant}
                className="h-20 flex-col"
              >
                <Link to={action.to}>
                  <action.icon className="h-5 w-5 mb-2" />
                  <span className="font-medium">{action.title}</span>
                  <span className="text-xs text-muted-foreground">{action.description}</span>
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategic Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Strategiske mål</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Kundetilfredshet</span>
                <Badge variant="default">På sporet</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Inntektsvekst</span>
                <Badge variant="default">Oppnådd</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Medarbeiderutvikling</span>
                <Badge variant="secondary">Pågår</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kommende milepæler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="border-l-4 border-blue-500 pl-3">
                <h4 className="font-medium">Kvartalsgjennomgang</h4>
                <p className="text-sm text-muted-foreground">15. juni 2025</p>
              </div>
              <div className="border-l-4 border-green-500 pl-3">
                <h4 className="font-medium">Strategisk planlegging</h4>
                <p className="text-sm text-muted-foreground">30. juni 2025</p>
              </div>
              <div className="border-l-4 border-orange-500 pl-3">
                <h4 className="font-medium">Kompetanseevaluering</h4>
                <p className="text-sm text-muted-foreground">15. juli 2025</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartnerDashboard;
