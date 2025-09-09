
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import {
  Users, Home, BarChart3, Book, Settings, Building2, MessageSquare,
  UserCog, GraduationCap, FileText, Brain, Database, HelpCircle, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StandardPageLayout from '@/components/Layout/StandardPageLayout';
import { usePageTitle } from '@/components/Layout/PageTitleContext';
import { BetaBadge } from '@/components/ui/BetaBadge';
import { isAdvancedAIEnabled, isAdvancedAIInBeta } from '@/lib/featureFlags';

const NavigationDashboard = () => {
  const { setPageTitle } = usePageTitle();

  useEffect(() => {
    setPageTitle('Hovedmeny');
  }, [setPageTitle]);

  // Filter items based on feature flags
  const getFilteredItems = (items: any[]) => {
    return items.filter(item => {
      if (item.featureFlag) {
        return item.featureFlag();
      }
      return true;
    });
  };

  const navigationSections = [
    {
      title: 'Hovedfunksjoner',
      description: 'Daglige arbeidsoppgaver og kjernevirksomhet',
      items: getFilteredItems([
        { name: 'Dashboard', href: '/', icon: Home, description: 'Oversikt og KPIer', color: 'bg-blue-500' },
        { name: 'Klienter', href: '/clients', icon: Users, description: 'Administrer revisjonsoppdrag', color: 'bg-green-500' },
        { name: 'Fagstoff', href: '/fag', icon: Book, description: 'Kunnskapsbase og artikler', color: 'bg-purple-500' },
        { 
          name: 'AI Revy', 
          href: '/ai-revy-admin', 
          icon: Brain, 
          description: 'AI-assistent for revisjon', 
          color: 'bg-orange-500',
          featureFlag: isAdvancedAIEnabled,
          showBeta: isAdvancedAIInBeta()
        },
        { name: 'Administrasjon', href: '/admin', icon: Shield, description: 'Bruker- og organisasjonsadministrasjon', color: 'bg-purple-500' }
      ])
    },
    {
      title: 'Organisasjon',
      description: 'Administrasjon og teamsamarbeid',
      items: [
        { name: 'Organisasjon', href: '/organization', icon: Building2, description: 'Firmainnstillinger og struktur', color: 'bg-gray-500' },
        { name: 'Teams', href: '/teams', icon: UserCog, description: 'Teamadministrasjon', color: 'bg-indigo-500' },
        { name: 'Kommunikasjon', href: '/communication', icon: MessageSquare, description: 'Chat og meldinger', color: 'bg-teal-500' },
        { name: 'Opplæring', href: '/training', icon: GraduationCap, description: 'Kurs og sertifisering', color: 'bg-amber-500' }
      ]
    },
    {
      title: 'Data og rapporter',
      description: 'Dokumenter, analyser og statistikk',
      items: [
        { name: 'Dokumenter', href: '/documents', icon: FileText, description: 'Dokumenthåndtering', color: 'bg-cyan-500' },
        { name: 'AI-bruk', href: '/ai-usage', icon: BarChart3, description: 'Statistikk og kostnader', color: 'bg-rose-500' },
        { name: 'Kontoplan', href: '/standard-accounts', icon: Database, description: 'Standard kontooppsett', color: 'bg-emerald-500' }
      ]
    },
    {
      title: 'System',
      description: 'Innstillinger og support',
      items: [
        { name: 'Innstillinger', href: '/organization/settings', icon: Settings, description: 'Systemkonfigurasjon', color: 'bg-slate-500' },
        { name: 'Hjelp', href: '/hjelp', icon: HelpCircle, description: 'Brukerstøtte og dokumentasjon', color: 'bg-blue-600' }
      ]
    }
  ];

  return (
    <StandardPageLayout
      className="w-full px-4 py-6 md:px-6 lg:px-8 space-y-8"
    >
      {navigationSections.map((section, sectionIndex) => (
        <Card key={sectionIndex}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {section.title}
              <Badge variant="outline">{section.items.length} funksjoner</Badge>
            </CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="group block"
                >
                  <Card className="h-full transition-all hover:shadow-md hover:scale-105 cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={cn('rounded-lg p-2 text-white', item.color)}>
                          <item.icon className="h-6 w-6" />
                        </div>
                         <div className="space-y-1 flex-1">
                           <div className="flex items-center gap-2">
                             <h3 className="font-semibold text-sm leading-none group-hover:text-primary transition-colors">
                               {item.name}
                             </h3>
                             {item.showBeta && <BetaBadge />}
                           </div>
                           <p className="text-xs text-muted-foreground line-clamp-2">
                             {item.description}
                           </p>
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </StandardPageLayout>
  );
};

export default NavigationDashboard;
