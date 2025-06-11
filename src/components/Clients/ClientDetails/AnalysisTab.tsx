
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  DollarSign, 
  Percent,
  Calculator,
  FileText,
  Target
} from 'lucide-react';
import { Client } from '@/types/revio';
import FinancialChart from './ClientDashboard/FinancialChart';
import KeyFigures from './ClientDashboard/KeyFigures';

interface AnalysisTabProps {
  client: Client;
}

const AnalysisTab = ({ client }: AnalysisTabProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState('2024');

  // Mock data - replace with real data from your backend
  const financialData = [
    { year: 2022, revenue: 12500000, result: 980000 },
    { year: 2023, revenue: 14200000, result: 1250000 },
    { year: 2024, revenue: 15800000, result: 1420000 },
  ];

  const keyMetrics = {
    liquidityRatio: 2.3,
    equityRatio: 45.2,
    profitMargin: 8.9,
    debtRatio: 0.32,
    returnOnEquity: 12.4,
    currentRatio: 1.8
  };

  const riskIndicators = [
    { 
      type: 'Høy', 
      title: 'Kundekonsentrasjon', 
      description: 'Største kunde utgjør 35% av omsetningen',
      impact: 'critical'
    },
    { 
      type: 'Medium', 
      title: 'Likviditet', 
      description: 'Fallende likviditetsgrad over 3 måneder',
      impact: 'warning'
    },
    { 
      type: 'Lav', 
      title: 'Regnskapsavvik', 
      description: 'Mindre avvik i kontoavstemming',
      impact: 'info'
    }
  ];

  const benchmarkData = [
    { metric: 'Lønnsomhet', clientValue: 8.9, industryAvg: 6.2, status: 'good' },
    { metric: 'Likviditet', clientValue: 2.3, industryAvg: 1.9, status: 'good' },
    { metric: 'Soliditet', clientValue: 45.2, industryAvg: 38.1, status: 'good' },
    { metric: 'Effektivitet', clientValue: 1.2, industryAvg: 1.4, status: 'warning' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Finansiell Analyse</h2>
          <p className="text-muted-foreground">
            Dybdeanalyse og nøkkeltall for {client.companyName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Generer Rapport
          </Button>
          <Button>
            <Target className="h-4 w-4 mr-2" />
            Ny Analyse
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Oversikt</TabsTrigger>
          <TabsTrigger value="financial">Finansielle Tall</TabsTrigger>
          <TabsTrigger value="risk">Risikovurdering</TabsTrigger>
          <TabsTrigger value="benchmark">Benchmark</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Omsetning</p>
                    <p className="text-2xl font-bold">15.8M</p>
                    <div className="flex items-center text-green-600 text-sm">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +11.3%
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Resultat</p>
                    <p className="text-2xl font-bold">1.42M</p>
                    <div className="flex items-center text-green-600 text-sm">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +13.6%
                    </div>
                  </div>
                  <Percent className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Margin</p>
                    <p className="text-2xl font-bold">8.9%</p>
                    <div className="flex items-center text-green-600 text-sm">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +2.1pp
                    </div>
                  </div>
                  <Calculator className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Risikoscore</p>
                    <p className="text-2xl font-bold">7.2</p>
                    <Badge variant="outline" className="text-xs">
                      Moderat
                    </Badge>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FinancialChart financialData={financialData} />
            <KeyFigures 
              liquidityRatio={keyMetrics.liquidityRatio}
              equityRatio={keyMetrics.equityRatio}
              profitMargin={keyMetrics.profitMargin}
            />
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detaljerte Nøkkeltall</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-medium">Lønnsomhet</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Driftsmargin</span>
                      <span className="font-medium">{keyMetrics.profitMargin}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Egenkapitalavkastning</span>
                      <span className="font-medium">{keyMetrics.returnOnEquity}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Likviditet</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Likviditetsgrad 1</span>
                      <span className="font-medium">{keyMetrics.liquidityRatio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Likviditetsgrad 2</span>
                      <span className="font-medium">{keyMetrics.currentRatio}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Soliditet</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm">Egenkapitalandel</span>
                      <span className="font-medium">{keyMetrics.equityRatio}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Gjeldsgrad</span>
                      <span className="font-medium">{keyMetrics.debtRatio}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Identifiserte Risikoområder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {riskIndicators.map((risk, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={
                            risk.impact === 'critical' ? 'destructive' :
                            risk.impact === 'warning' ? 'default' : 'secondary'
                          }
                        >
                          {risk.type} risiko
                        </Badge>
                        <h4 className="font-medium">{risk.title}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{risk.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmark" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bransjesammenligning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {benchmarkData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.metric}</span>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Selskap</div>
                            <div className="font-medium">{item.clientValue}%</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Bransje</div>
                            <div className="font-medium">{item.industryAvg}%</div>
                          </div>
                          <Badge 
                            variant={item.status === 'good' ? 'default' : 'secondary'}
                          >
                            {item.status === 'good' ? 'Over snitt' : 'Under snitt'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisTab;
