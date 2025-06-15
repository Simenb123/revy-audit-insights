
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { useClientData } from '@/components/Clients/ClientFetcher/useClientData';
import { Skeleton } from '@/components/ui/skeleton';

interface Kpi {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  description?: string;
}

const RealTimeKPIs = () => {
  const { data: clients, isLoading } = useClientData();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const activeClients = clients?.length || 0;
  const ongoingAudits = clients?.filter(c => c.phase !== 'completion').length || 0;
  const highRiskClients = clients?.filter(client => 
    client.riskAreas.some(area => area.risk === 'high')
  ).length || 0;

  const kpis: Kpi[] = [
    {
      title: 'Aktive Klienter',
      value: activeClients,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Pågående Revisjoner',
      value: ongoingAudits,
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'Fullførte Handlinger',
      value: 'N/A',
      description: 'Data ikke tilgjengelig',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Høyrisiko Klienter',
      value: highRiskClients,
      icon: AlertTriangle,
      color: 'text-red-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        
        return (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {kpi.title}
                  </p>
                  <div className="mt-1">
                    <h3 className="text-xl font-bold">{kpi.value}</h3>
                  </div>
                  <p className="text-xs mt-1 text-muted-foreground">
                    {kpi.description || <>&nbsp;</>}
                  </p>
                </div>
                <Icon className={`h-6 w-6 ${kpi.color}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default RealTimeKPIs;
