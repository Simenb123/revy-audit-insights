
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MessageSquare, Book, Briefcase, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserProfile } from '@/hooks/useUserProfile';

const EmployeeDashboard = () => {
  const { data: userProfile } = useUserProfile();

  const quickActions = [
    {
      title: 'Mine klienter',
      description: 'Se oversikt over dine tildelte klienter',
      icon: Users,
      to: '/klienter',
      variant: 'default' as const
    },
    {
      title: 'Team-kommunikasjon',
      description: 'Chat med kollegaer og del informasjon',
      icon: MessageSquare,
      to: '/kommunikasjon',
      variant: 'outline' as const
    },
    {
      title: 'Kunnskapsbase',
      description: 'Tilgang til faglige ressurser og veiledninger',
      icon: Book,
      to: '/fag',
      variant: 'outline' as const
    }
  ];

  const recentTasks = [
    { id: 1, title: 'Gjennomgang av regnskap for Klient AS', status: 'Pågår', dueDate: '2025-06-15' },
    { id: 2, title: 'Dokumentasjon av kontroller', status: 'Ferdig', dueDate: '2025-06-10' },
    { id: 3, title: 'Møtereferat fra revisjonskomité', status: 'Venter', dueDate: '2025-06-20' }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Velkommen tilbake, {userProfile?.firstName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="secondary" className="capitalize">{userProfile?.userRole}</Badge>
            <span className="text-sm text-muted-foreground">
              {userProfile?.workplaceCompanyName}
            </span>
          </div>
          <p className="text-muted-foreground">
            Her er oversikten over dine arbeidsoppgaver og tilgjengelige ressurser.
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">2</h3>
              <p className="text-sm text-muted-foreground">Fullførte oppgaver</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Clock className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">1</h3>
              <p className="text-sm text-muted-foreground">Pågående oppgaver</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <div className="text-center">
              <Users className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold">5</h3>
              <p className="text-sm text-muted-foreground">Tildelte klienter</p>
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

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Siste arbeidsoppgaver</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{task.title}</h4>
                  <p className="text-sm text-muted-foreground">Frist: {task.dueDate}</p>
                </div>
                <Badge 
                  variant={
                    task.status === 'Ferdig' ? 'default' : 
                    task.status === 'Pågår' ? 'secondary' : 'outline'
                  }
                >
                  {task.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Trenger du hjelp?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Sjekk ut våre ressurser for å komme i gang eller få svar på spørsmål.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/fag">
                <Book className="h-4 w-4 mr-2" />
                Kunnskapsbase
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/kommunikasjon">
                <MessageSquare className="h-4 w-4 mr-2" />
                Spør kollegaer
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmployeeDashboard;
