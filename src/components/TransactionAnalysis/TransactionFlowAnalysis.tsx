import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Network, AlertTriangle, TrendingUp, FileText } from "lucide-react";
import { TransactionFlowData } from "@/services/transactionFlowService";
import { TransactionFlowVisualization } from './TransactionFlowVisualization';

interface TransactionFlowAnalysisProps {
  data: TransactionFlowData | null;
  isLoading?: boolean;
}

export const TransactionFlowAnalysis: React.FC<TransactionFlowAnalysisProps> = ({ data, isLoading }) => {
  const [selectedTab, setSelectedTab] = useState('visualization');

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaksjonsflyt</CardTitle>
          <CardDescription>Analyserer transaksjonsflyt...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-32 bg-muted rounded" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Transaksjonsflyt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Ingen transaksjonsflyt tilgjengelig. Kjør analyse først.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getAuditAreaColor = (auditArea: string) => {
    const colors: Record<string, string> = {
      'sales': 'bg-green-100 text-green-800',
      'receivables': 'bg-blue-100 text-blue-800',
      'purchases': 'bg-orange-100 text-orange-800',
      'payables': 'bg-red-100 text-red-800',
      'inventory': 'bg-purple-100 text-purple-800',
      'cash': 'bg-cyan-100 text-cyan-800',
      'bank': 'bg-blue-200 text-blue-900',
      'payroll': 'bg-lime-100 text-lime-800',
      'expenses': 'bg-orange-200 text-orange-900',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[auditArea] || 'bg-gray-100 text-gray-800';
  };

  const getAuditAreaName = (auditArea: string) => {
    const names: Record<string, string> = {
      'sales': 'Salg',
      'receivables': 'Kundefordringer', 
      'purchases': 'Innkjøp',
      'payables': 'Leverandørgjeld',
      'inventory': 'Varelager',
      'cash': 'Kontanter',
      'bank': 'Bank',
      'payroll': 'Lønn',
      'expenses': 'Kostnader',
      'other': 'Annet'
    };
    return names[auditArea] || auditArea;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Transaksjonsflyt-analyse
        </CardTitle>
        <CardDescription>
          {data.nodes.length} kontoer • {data.edges.length} flyter • 
          {data.unusualFlows.length} uvanlige flyter identifisert
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="visualization">Visualisering</TabsTrigger>
            <TabsTrigger value="flows">Flyter</TabsTrigger>
            <TabsTrigger value="areas">Audit Areas</TabsTrigger>
            <TabsTrigger value="unusual">Uvanlige flyter</TabsTrigger>
          </TabsList>

          <TabsContent value="visualization" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Interaktiv transaksjonsflyt</h4>
                <div className="text-sm text-muted-foreground">
                  Total flyt: {data.totalFlowAmount.toLocaleString('no-NO')} kr
                </div>
              </div>
              
              <TransactionFlowVisualization 
                nodes={data.nodes}
                edges={data.edges}
                width={800}
                height={500}
              />
              
              <Alert>
                <Network className="h-4 w-4" />
                <AlertDescription>
                  Noder representerer kontoer, med størrelse basert på total flyt. 
                  Kanter viser flyt mellom kontoer, med tykkelse basert på beløp.
                  Animerte kanter indikerer uvanlige flyter.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>

          <TabsContent value="flows" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <h4 className="font-medium">Største transaksjonsflyter</h4>
              </div>
              
              <div className="space-y-2">
                {data.edges.slice(0, 10).map((flow, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <div>
                        <div className="font-medium text-sm">
                          {flow.fromAccount} → {flow.toAccount}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {flow.transactionCount} transaksjoner • 
                          Ø {flow.averageAmount.toLocaleString('no-NO')} kr
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-medium">
                          {flow.totalAmount.toLocaleString('no-NO')} kr
                        </div>
                        {flow.isUnusual && (
                          <Badge variant="destructive" className="text-xs">
                            Uvanlig
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="areas" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <h4 className="font-medium">Flyt mellom audit areas</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.auditAreaFlows.slice(0, 8).map((areaFlow, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getAuditAreaColor(areaFlow.fromArea)}>
                          {getAuditAreaName(areaFlow.fromArea)}
                        </Badge>
                        <span className="text-muted-foreground">→</span>
                        <Badge className={getAuditAreaColor(areaFlow.toArea)}>
                          {getAuditAreaName(areaFlow.toArea)}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Beløp:</span>
                        <span className="font-medium">
                          {areaFlow.amount.toLocaleString('no-NO')} kr
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transaksjoner:</span>
                        <span>{areaFlow.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="unusual" className="mt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <h4 className="font-medium">Uvanlige transaksjonsflyter ({data.unusualFlows.length})</h4>
              </div>
              
              {data.unusualFlows.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Ingen uvanlige transaksjonsflyter identifisert. 
                    Dette indikerer normale transaksjonsmønstre.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {data.unusualFlows.map((flow, index) => (
                    <div key={index} className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive">
                            {flow.riskLevel.toUpperCase()}
                          </Badge>
                          <span className="font-medium">
                            {flow.fromAccount} → {flow.toAccount}
                          </span>
                        </div>
                        <div className="font-medium">
                          {flow.totalAmount.toLocaleString('no-NO')} kr
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Transaksjoner:</span> {flow.transactionCount}
                        </div>
                        <div>
                          <span className="font-medium">Gjennomsnitt:</span> 
                          {flow.averageAmount.toLocaleString('no-NO')} kr
                        </div>
                        <div>
                          <span className="font-medium">Status:</span> 
                          <span className="text-orange-600 ml-1">Krever oppmerksomhet</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};