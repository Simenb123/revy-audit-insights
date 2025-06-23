
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { PlanningModuleStatus } from './PlanningModuleStatus';

interface PlanningContainerProps {
  clientId: string;
}

const PlanningContainer: React.FC<PlanningContainerProps> = ({ clientId }) => {
  // Mock data with proper created_at field
  const mockStatuses: PlanningModuleStatus[] = [
    {
      id: '1',
      client_id: clientId,
      module_key: 'MATERIALITY',
      status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2', 
      client_id: clientId,
      module_key: 'FRAUD_RISK',
      status: 'in_progress',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Revisjonsplanlegging</h2>
        <Badge variant="outline">
          {mockStatuses.filter(s => s.status === 'completed').length} av {mockStatuses.length} fullført
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="materiality">Vesentlighet</TabsTrigger>
          <TabsTrigger value="fraud">Mislighetsrisiko</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockStatuses.map((status) => (
              <Card key={status.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {status.module_key.replace('_', ' ')}
                  </CardTitle>
                  {status.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                  {status.status === 'in_progress' && <Clock className="h-4 w-4 text-yellow-500" />}
                  {status.status === 'not_started' && <AlertCircle className="h-4 w-4 text-gray-400" />}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{status.status}</div>
                  <p className="text-xs text-muted-foreground">
                    Sist oppdatert: {new Date(status.updated_at).toLocaleDateString('no-NO')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="materiality">
          <Card>
            <CardHeader>
              <CardTitle>Vesentlighetsberegning</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Vesentlighetsmodul kommer her...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fraud">
          <Card>
            <CardHeader>
              <CardTitle>Mislighetsrisikovurdering</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Mislighetsrisikomodul kommer her...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PlanningContainer;
