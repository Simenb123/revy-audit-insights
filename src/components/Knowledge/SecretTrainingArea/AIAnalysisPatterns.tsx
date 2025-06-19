
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  Zap,
  Settings
} from 'lucide-react';

interface AnalysisPattern {
  id: string;
  name: string;
  type: 'column_detection' | 'format_recognition' | 'data_validation' | 'categorization';
  confidence: number;
  successRate: number;
  usageCount: number;
  lastUsed: string;
  description: string;
  examples: string[];
  improvements: string[];
}

const AIAnalysisPatterns = () => {
  const [activeTab, setActiveTab] = useState('patterns');

  // Mock data for AI patterns
  const patterns: AnalysisPattern[] = [
    {
      id: '1',
      name: 'Visma Business kolonnegjenkjenning',
      type: 'column_detection',
      confidence: 94,
      successRate: 92,
      usageCount: 156,
      lastUsed: '2024-01-15',
      description: 'Gjenkjenner standard Visma Business kolonner som Konto, Kontonavn, Debet, Kredit',
      examples: ['Kto', 'Kontonavn', 'Deb', 'Kred', 'Tekst', 'Bilagsnr'],
      improvements: ['Bedre håndtering av tilleggskatoloner', 'Støtte for gamle Visma-formater']
    },
    {
      id: '2',
      name: 'Saldobalanse struktur-gjenkjenning',
      type: 'format_recognition',
      confidence: 89,
      successRate: 87,
      usageCount: 98,
      lastUsed: '2024-01-14',
      description: 'Identifiserer saldobalanse-formater på tvers av systemer',
      examples: ['Kontaktbalaase IB', 'Debet bevegelser', 'Kredit bevegelser', 'UB'],
      improvements: ['Støtte for kvartalsvise saldobalanse', 'Bedre håndtering av sammendrag']
    },
    {
      id: '3',
      name: 'Intelligent kategorisering',
      type: 'categorization',
      confidence: 85,
      successRate: 81,
      usageCount: 203,
      lastUsed: '2024-01-15',
      description: 'Kategoriserer dokumenter basert på innhold og struktur',
      examples: ['Automatisk skille mellom HB og SB', 'Gjenkjenning av rapporttyper'],
      improvements: ['Flere dokumenttyper', 'Bedre håndtering av hybridformater']
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'column_detection': return <Target className="h-4 w-4" />;
      case 'format_recognition': return <BarChart3 className="h-4 w-4" />;
      case 'data_validation': return <CheckCircle className="h-4 w-4" />;
      case 'categorization': return <Brain className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'column_detection': return 'bg-blue-100 text-blue-800';
      case 'format_recognition': return 'bg-green-100 text-green-800';
      case 'data_validation': return 'bg-yellow-100 text-yellow-800';
      case 'categorization': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="patterns">AI-mønstre</TabsTrigger>
          <TabsTrigger value="performance">Ytelsesanalyse</TabsTrigger>
          <TabsTrigger value="training">Treningsstatus</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns">
          <div className="space-y-4">
            {patterns.map((pattern) => (
              <Card key={pattern.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(pattern.type)}
                      <CardTitle className="text-lg">{pattern.name}</CardTitle>
                      <Badge className={`${getTypeColor(pattern.type)}`}>
                        {pattern.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${getConfidenceColor(pattern.confidence)}`}>
                        {pattern.confidence}% konfidens
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{pattern.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Suksessrate</p>
                      <div className="flex items-center gap-2">
                        <Progress value={pattern.successRate} className="flex-1" />
                        <span className="text-sm font-medium">{pattern.successRate}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Antall bruk</p>
                      <p className="text-lg font-semibold">{pattern.usageCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Sist brukt</p>
                      <p className="text-sm">{new Date(pattern.lastUsed).toLocaleDateString('nb-NO')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Eksempler</h5>
                      <div className="space-y-1">
                        {pattern.examples.map((example, index) => (
                          <Badge key={index} variant="outline" className="mr-2 mb-1">
                            {example}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-2">Forbedringsområder</h5>
                      <ul className="space-y-1">
                        {pattern.improvements.map((improvement, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <AlertTriangle className="h-3 w-3 mt-1 text-yellow-500" />
                            {improvement}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>AI-ytelsesmetrikker</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Gjennomsnittlig nøyaktighet</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">87.3%</p>
                  <p className="text-sm text-gray-600">+2.1% fra forrige måned</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Forbedring over tid</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">+12.4%</p>
                  <p className="text-sm text-gray-600">Siste 3 måneder</p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Aktive mønstre</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">23</p>
                  <p className="text-sm text-gray-600">+3 nye denne måneden</p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-orange-600" />
                    <span className="font-medium">Behandlingstid</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">2.3s</p>
                  <p className="text-sm text-gray-600">Gjennomsnitt per dokument</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training">
          <Card>
            <CardHeader>
              <CardTitle>AI-treningsstatus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Pågående trening</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    AI-modellen trenes automatisk basert på nye treningsdokumenter og brukerfeedback.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Siste treningssesjon</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Startet:</span>
                        <span>15. jan 2024, 14:30</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Varighet:</span>
                        <span>2t 45min</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dokumenter prosessert:</span>
                        <span>47</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Forbedring:</span>
                        <span className="text-green-600">+1.8%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Neste planlagte trening</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Planlagt tid:</span>
                        <span>22. jan 2024, 02:00</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nye dokumenter:</span>
                        <span>12</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estimert varighet:</span>
                        <span>1t 20min</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge variant="outline" className="text-xs">Venter</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIAnalysisPatterns;
