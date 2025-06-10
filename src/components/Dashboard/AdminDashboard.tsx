
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, Building2, MessageSquare, BarChart3, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useDepartments } from '@/hooks/useDepartments';
import { useClientTeams } from '@/hooks/useClientTeams';

const AdminDashboard = () => {
  const { data: userProfile } = useUserProfile();
  const { data: departments = [] } = useDepartments();
  const { data: teams = [] } = useClientTeams();

  const quickActions = [
    {
      title: 'Brukeradministrasjon',
      description: 'Administrer brukere og tilganger',
      icon: Users,
      to: '/brukeradministrasjon',
      variant: 'default' as const
    },
    {
      title: 'Organisasjonsinnstillinger',
      description: 'Konfigurer firma og avdelinger',
      icon: Settings,
      to: '/organisasjonsinnstillinger',
      variant: 'outline' as const
    },
    {
      title: 'Kommunikasjon',
      description: 'Overvåk team-kommunikasjon',
      icon: MessageSquare,
      to: '/kommunikasjon',
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
            Velkommen tilbake, {userProfile?.firstName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary">Administrator</Badge>
            <span className="text-sm text-muted-foreground">
              Du har full tilgang til alle systemfunksjoner
            </span>
          </div>
          <p className="text-muted-foreground">
            Som administrator kan du administrere brukere, konfigurere organisasjonsinnstillinger, 
            og overvåke alle aspekter av revisjonsvirksomheten.
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Building2 className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{departments.length}</h3>
              <p className="text-sm text-muted-foreground">Avdelinger</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">{teams.length}</h3>
              <p className="text-sm text-muted-foreground">Aktive team</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">0</h3>
              <p className="text-sm text-muted-foreground">Ventende oppgaver</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Hurtighandlinger</CardTitle>
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

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Systemstatus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Database tilkobling</span>
              <Badge variant="default">Aktiv</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Brukerautentisering</span>
              <Badge variant="default">Aktiv</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Backup status</span>
              <Badge variant="outline">Konfigurasjon nødvendig</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
