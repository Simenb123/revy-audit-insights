
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Brain, Lightbulb, AlertTriangle, TrendingUp } from 'lucide-react';
import { Client } from '@/types/revio';
import RiskScoreCalculator from '@/components/AI/RiskScoreCalculator';
import PredictiveAnalytics from '@/components/AI/PredictiveAnalytics';
import IntelligentRecommendations from '@/components/AI/IntelligentRecommendations';
import RiskAssessment from '@/components/Dashboard/Widgets/RiskAssessment';

interface AnalysisTabProps {
  client: Client;
}

const AnalysisTab = ({ client }: AnalysisTabProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">AI-Drevet Analyse</h2>
          <p className="text-muted-foreground">
            Avansert analyse og intelligente innsikter for {client.companyName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Eksporter rapport
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Oversikt
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Risikoscore
          </TabsTrigger>
          <TabsTrigger value="predictive" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Prediktiv Analyse
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Anbefalinger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RiskAssessment />
            
            <Card>
              <CardHeader>
                <CardTitle>Analyse-sammendrag</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">AI Innsikter</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Finansiell stabilitet vurderes som god</li>
                    <li>• Anbefaler økt fokus på kundefordringer</li>
                    <li>• Predikert vekst på 10% neste kvartal</li>
                    <li>• 5 aktive optimeringsforslag</li>
                  </ul>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">85</div>
                    <div className="text-xs text-muted-foreground">Risikoscore</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">92%</div>
                    <div className="text-xs text-muted-foreground">AI Confidence</div>
                  </div>
                </div>

                <Button className="w-full" onClick={() => setActiveTab('risk')}>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Se detaljert risikoanalyse
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <RiskScoreCalculator client={client} />
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <PredictiveAnalytics client={client} />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <IntelligentRecommendations client={client} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisTab;
