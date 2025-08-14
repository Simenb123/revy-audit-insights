import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  BarChart3, 
  AlertTriangle, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Clock,
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface AnalysisGuideCardProps {
  className?: string;
  onAnalysisSelect?: (analysisType: string) => void;
  isDataReady: boolean;
  currentAnalysisCount?: number;
}

const AnalysisGuideCard: React.FC<AnalysisGuideCardProps> = ({
  className = "",
  onAnalysisSelect,
  isDataReady,
  currentAnalysisCount = 0
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const analysisTypes = [
    {
      id: 'basic_transaction',
      name: 'Grunnleggende transaksjonsanalyse',
      description: 'Start her! Grunnleggende oversikt over transaksjonsdata',
      icon: BarChart3,
      complexity: 'Enkel',
      estimatedTime: '< 1 min',
      benefits: ['Rask oversikt', 'Enkelt å forstå', 'Ingen eksterne tjenester'],
      prerequisites: ['Data må være ferdig lastet'],
      variant: 'default' as const,
      recommended: true
    },
    {
      id: 'transaction_patterns',
      name: 'AI-baserte transaksjonsmønstre',
      description: 'Avansert AI-analyse for å finne anomalier og mønstre',
      icon: Brain,
      complexity: 'Avansert',
      estimatedTime: '2-5 min',
      benefits: ['Finner skjulte mønstre', 'AI-drevet innsikt', 'Anomalideteksjon'],
      prerequisites: ['Grunnleggende analyse anbefales først', 'AI-tjeneste må være tilgjengelig'],
      variant: 'secondary' as const
    },
    {
      id: 'risk_analysis',
      name: 'Risikoanalyse',
      description: 'Identifiserer potensielle risikoområder i regnskapet',
      icon: AlertTriangle,
      complexity: 'Avansert',
      estimatedTime: '3-7 min',
      benefits: ['Risikoidentifikasjon', 'Compliance-sjekk', 'Prioriterte anbefalinger'],
      prerequisites: ['Transaksjonsdata', 'Saldobalanse'],
      variant: 'outline' as const
    },
    {
      id: 'financial_ratios',
      name: 'Finansielle nøkkeltall',
      description: 'Beregner og analyserer viktige økonomiske indikatorer',
      icon: TrendingUp,
      complexity: 'Middels',
      estimatedTime: '1-3 min',
      benefits: ['KPI-beregning', 'Benchmarking', 'Trendanalyse'],
      prerequisites: ['Balanse- og resultatdata'],
      variant: 'outline' as const
    }
  ];

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Enkel': return 'text-green-600';
      case 'Middels': return 'text-yellow-600';
      case 'Avansert': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className={`border-blue-200 bg-blue-50/30 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-blue-900">Analyseguide</CardTitle>
          </div>
          <Badge variant="secondary">
            {currentAnalysisCount} analyser kjørt
          </Badge>
        </div>
        <CardDescription className="text-blue-700">
          Velg riktig analyse basert på dine behov
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!isDataReady && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <Clock className="w-4 h-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Venter på at data skal ferdiglastes. Analyser blir tilgjengelige når all data er klar.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {analysisTypes.map((analysis) => {
            const Icon = analysis.icon;
            const canRun = isDataReady && analysis.id === 'basic_transaction' || 
                          (isDataReady && currentAnalysisCount > 0);
            
            return (
              <div
                key={analysis.id}
                className={`p-4 border rounded-lg transition-all duration-200 ${
                  analysis.recommended ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                } ${canRun ? 'hover:shadow-md cursor-pointer' : 'opacity-60'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <Icon className={`w-5 h-5 mt-1 ${
                      analysis.recommended ? 'text-blue-600' : 'text-gray-600'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-sm">{analysis.name}</h3>
                        {analysis.recommended && (
                          <Badge variant="default" className="text-xs">Anbefalt start</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {analysis.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs">
                        <span className={getComplexityColor(analysis.complexity)}>
                          {analysis.complexity}
                        </span>
                        <span className="text-muted-foreground">
                          {analysis.estimatedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {onAnalysisSelect && (
                    <Button
                      size="sm"
                      variant={analysis.variant}
                      disabled={!canRun}
                      onClick={() => canRun && onAnalysisSelect(analysis.id)}
                      className="ml-3"
                    >
                      {canRun ? 'Kjør' : 'Ikke tilgjengelig'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full">
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Skjul detaljer
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Vis detaljert guide
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <h4 className="font-medium">Anbefalt arbeidsflyt:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Start med <strong>Grunnleggende transaksjonsanalyse</strong> for oversikt</li>
                    <li>Kjør <strong>Finansielle nøkkeltall</strong> for økonomisk status</li>
                    <li>Hvis nødvendig, bruk <strong>Risikoanalyse</strong> for compliance</li>
                    <li>Til slutt, bruk <strong>AI-analyse</strong> for dype innsikter</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-3">
              {analysisTypes.map((analysis) => (
                <div key={analysis.id} className="border rounded p-3 bg-white">
                  <h4 className="font-medium text-sm mb-2">{analysis.name}</h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium">Fordeler:</span>
                      <ul className="list-disc list-inside mt-1 text-muted-foreground">
                        {analysis.benefits.map((benefit, idx) => (
                          <li key={idx}>{benefit}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-medium">Forutsetninger:</span>
                      <ul className="list-disc list-inside mt-1 text-muted-foreground">
                        {analysis.prerequisites.map((prereq, idx) => (
                          <li key={idx}>{prereq}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default AnalysisGuideCard;