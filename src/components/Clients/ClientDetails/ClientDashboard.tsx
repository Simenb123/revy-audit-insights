import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, Building, Calendar, Target, TrendingUp } from 'lucide-react';
import { Client, AuditPhase } from '@/types/revio';
import { formatOrgNumber } from '@/utils/formatOrgNumber';

interface ClientDashboardProps {
  client: Client;
  onOverviewClick?: () => void;
}

const ClientDashboard = ({ client, onOverviewClick }: ClientDashboardProps) => {
  const getStatusColor = (phase: AuditPhase) => {
    const phaseOrder = ['overview', 'engagement', 'planning', 'risk_assessment', 'execution', 'completion', 'reporting'];
    const currentIndex = phaseOrder.indexOf(phase);
    
    if (currentIndex <= 1) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (currentIndex <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (currentIndex <= 5) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-purple-100 text-purple-800 border-purple-200';
  };

  const getPhaseLabel = (phase: AuditPhase) => {
    const phaseLabels: Record<AuditPhase, string> = {
      overview: 'Oversikt',
      engagement: 'Oppdragsvurdering',
      planning: 'Planlegging',
      risk_assessment: 'Risikovurdering',
      execution: 'Utførelse',
      completion: 'Avslutning',
      reporting: 'Rapportering'
    };
    return phaseLabels[phase] || phase;
  };

  return (
    <Card className="relative overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-blue-900">Klient Oversikt</CardTitle>
              <p className="text-blue-700 text-sm">Nøkkelinformasjon og status</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={onOverviewClick}
            className="border-blue-300 text-blue-700 hover:bg-blue-100"
          >
            <Target className="w-4 h-4 mr-2" />
            Detaljert oversikt
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Client Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Company Info */}
          <div className="flex items-center gap-3 p-3 bg-white/70 rounded-lg border border-blue-100">
            <Building className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">{client.company_name}</p>
              {client.org_number && (
                <p className="text-xs text-gray-600 font-mono">{formatOrgNumber(client.org_number)}</p>
              )}
            </div>
          </div>

          {/* Current Phase */}
          <div className="flex items-center gap-3 p-3 bg-white/70 rounded-lg border border-blue-100">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Nåværende fase</p>
              <Badge className={`${getStatusColor(client.phase)} text-xs`}>
                {getPhaseLabel(client.phase)}
              </Badge>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3 p-3 bg-white/70 rounded-lg border border-blue-100">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Fremgang</p>
              <div className="flex items-center gap-2">
                <div className="w-12 h-2 bg-gray-200 rounded-full">
                  <div 
                    className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${client.progress || 0}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-blue-700">
                  {client.progress || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-blue-100">
          <div className="text-center">
            <p className="text-lg font-bold text-blue-900">
              {new Date(client.created_at).getFullYear()}
            </p>
            <p className="text-xs text-blue-600">Opprettet år</p>
          </div>
          
          <div className="h-8 w-px bg-blue-200" />
          
          <div className="text-center">
            <Badge variant="outline" className="border-blue-300 text-blue-700">
              {client.status || 'Aktiv'}
            </Badge>
            <p className="text-xs text-blue-600 mt-1">Status</p>
          </div>
          
          <div className="h-8 w-px bg-blue-200" />
          
          <div className="text-center">
            <p className="text-lg font-bold text-blue-900">
              {new Date().getFullYear()}
            </p>
            <p className="text-xs text-blue-600">Regnskapsår</p>
          </div>
        </div>
      </CardContent>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200/20 rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-200/20 rounded-full translate-y-12 -translate-x-12" />
    </Card>
  );
};

export default ClientDashboard;