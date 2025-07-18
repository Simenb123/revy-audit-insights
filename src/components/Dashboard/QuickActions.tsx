import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  Upload, 
  MessageSquare, 
  FileText, 
  BarChart3, 
  Users,
  Brain,
  Search
} from 'lucide-react';

const QuickActions = () => {
  const quickActions = [
    {
      title: 'Ny klient',
      description: 'Registrer ny revisjonsoppdrag',
      icon: Plus,
      href: '/clients/new',
      variant: 'default' as const
    },
    {
      title: 'Last opp dokumenter',
      description: 'Last opp klientdokumenter',
      icon: Upload,
      href: '/documents/upload',
      variant: 'outline' as const
    },
    {
      title: 'Spør AI Revy',
      description: 'Få hjelp med revisjonsoppgaver',
      icon: Brain,
      href: '/ai-revy',
      variant: 'outline' as const
    },
    {
      title: 'Fagstoff søk',
      description: 'Søk i kunnskapsbasen',
      icon: Search,
      href: '/fag',
      variant: 'outline' as const
    }
  ];

  const secondaryActions = [
    { title: 'Klientoversikt', icon: Users, href: '/clients' },
    { title: 'Rapporter', icon: BarChart3, href: '/reports' },
    { title: 'Kommunikasjon', icon: MessageSquare, href: '/communication' },
    { title: 'Dokumenter', icon: FileText, href: '/documents' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hurtighandlinger</CardTitle>
        <CardDescription>
          Ofte brukte funksjoner for rask tilgang
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Primary Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link key={action.href} to={action.href}>
              <Button
                variant={action.variant}
                className="w-full h-20 flex-col gap-2"
                size="lg"
              >
                <action.icon className="h-6 w-6" />
                <div className="text-center">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs opacity-70">{action.description}</div>
                </div>
              </Button>
            </Link>
          ))}
        </div>

        {/* Secondary Actions */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Navigasjon</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {secondaryActions.map((action) => (
              <Link key={action.href} to={action.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex-col gap-1 h-16"
                >
                  <action.icon className="h-4 w-4" />
                  <span className="text-xs">{action.title}</span>
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;