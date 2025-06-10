
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Target,
  TrendingUp
} from 'lucide-react';
import { useUpdateTrainingProgress, useAwardBadge } from '@/hooks/useTraining';

interface RiskFactor {
  id: string;
  title: string;
  description: string;
  correctRisk: 'high' | 'medium' | 'low';
  explanation: string;
}

interface RiskAssessmentModuleProps {
  scenarioId: string;
  scenarioName: string;
}

const riskFactors: RiskFactor[] = [
  {
    id: 'inventory',
    title: 'Lagervurdering',
    description: 'Varehandelsselskap med stort lager av sesongtilpassede produkter',
    correctRisk: 'high',
    explanation: 'Sesongtilpassede produkter har høy risiko for verdifall og krev nøye oppfølging av lagerverdier.'
  },
  {
    id: 'revenue',
    title: 'Inntektsføring',
    description: 'Standard salg av varer til forbrukere med umiddelbar betaling',
    correctRisk: 'low',
    explanation: 'Kontantsalg til forbrukere har lav risiko da transaksjonene er enkle og umiddelbare.'
  },
  {
    id: 'accounts_receivable',
    title: 'Kundefordringer',
    description: 'Bedrift-til-bedrift salg med 30 dagers betalingsfrist',
    correctRisk: 'medium',
    explanation: 'B2B kundefordringer har moderat risiko på grunn av kredittrisiko og potensielle betalingsproblemer.'
  },
  {
    id: 'fixed_assets',
    title: 'Anleggsmidler',
    description: 'Standard kontorutstyr og IT-systemer',
    correctRisk: 'low',
    explanation: 'Vanlig kontorutstyr har relativt lav risiko og standardiserte avskrivningsmetoder.'
  }
];

const RiskAssessmentModule = ({ scenarioId, scenarioName }: RiskAssessmentModuleProps) => {
  const [userAssessments, setUserAssessments] = useState<Record<string, 'high' | 'medium' | 'low'>>({});
  const [showResults, setShowResults] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const updateProgress = useUpdateTrainingProgress();
  const awardBadge = useAwardBadge();

  const handleRiskAssessment = (factorId: string, risk: 'high' | 'medium' | 'low') => {
    setUserAssessments(prev => ({
      ...prev,
      [factorId]: risk
    }));
  };

  const submitAssessment = () => {
    setShowResults(true);
    
    // Calculate score
    const correctAnswers = riskFactors.filter(factor => 
      userAssessments[factor.id] === factor.correctRisk
    ).length;
    
    const score = Math.round((correctAnswers / riskFactors.length) * 100);
    const maxScore = 100;

    // Update progress
    updateProgress.mutate({
      scenario_id: scenarioId,
      module_name: 'risikovurdering',
      score,
      max_score: maxScore,
      completed_at: new Date().toISOString()
    });

    // Award badges based on performance
    if (score >= 90) {
      awardBadge.mutate({
        badge_type: 'excellence',
        badge_name: 'Risikovurdering Ekspert',
        description: 'Oppnådde 90%+ i risikovurdering',
        scenario_id: scenarioId,
        points_earned: 50
      });
    } else if (score >= 75) {
      awardBadge.mutate({
        badge_type: 'achievement',
        badge_name: 'Risikovurdering Mester',
        description: 'Oppnådde 75%+ i risikovurdering',
        scenario_id: scenarioId,
        points_earned: 25
      });
    }

    setIsCompleted(true);
  };

  const canSubmit = Object.keys(userAssessments).length === riskFactors.length;
  const score = showResults ? Math.round((riskFactors.filter(factor => 
    userAssessments[factor.id] === factor.correctRisk
  ).length / riskFactors.length) * 100) : 0;

  const getRiskColor = (risk: 'high' | 'medium' | 'low') => {
    switch (risk) {
      case 'high': return 'bg-red-500 hover:bg-red-600';
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'low': return 'bg-green-500 hover:bg-green-600';
    }
  };

  const getRiskIcon = (factorId: string) => {
    if (!showResults) return null;
    
    const isCorrect = userAssessments[factorId] === riskFactors.find(f => f.id === factorId)?.correctRisk;
    return isCorrect ? 
      <CheckCircle className="h-5 w-5 text-green-600" /> : 
      <XCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-600" />
            Risikovurdering - {scenarioName}
          </CardTitle>
          <p className="text-gray-600">
            Vurder risikonivået for hver av følgende områder. Klikk på det risikonivået du mener er mest passende.
          </p>
        </CardHeader>
        <CardContent>
          {showResults && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Ditt resultat: {score}%</span>
              </div>
              <Progress value={score} className="mb-2" />
              <p className="text-sm text-gray-600">
                {score >= 90 ? 'Utmerket!' : score >= 75 ? 'Bra jobbet!' : score >= 50 ? 'Greit, men du kan forbedre deg!' : 'Du bør øve mer på risikovurdering.'}
              </p>
            </div>
          )}
          
          <div className="space-y-6">
            {riskFactors.map((factor) => (
              <div key={factor.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">{factor.title}</h4>
                    <p className="text-gray-600 mt-1">{factor.description}</p>
                  </div>
                  {getRiskIcon(factor.id)}
                </div>
                
                <div className="flex gap-2 mb-3">
                  {(['high', 'medium', 'low'] as const).map((risk) => (
                    <Button
                      key={risk}
                      variant={userAssessments[factor.id] === risk ? "default" : "outline"}
                      size="sm"
                      className={userAssessments[factor.id] === risk ? getRiskColor(risk) : ''}
                      onClick={() => handleRiskAssessment(factor.id, risk)}
                      disabled={isCompleted}
                    >
                      {risk === 'high' ? 'Høy risiko' : risk === 'medium' ? 'Middels risiko' : 'Lav risiko'}
                    </Button>
                  ))}
                </div>

                {showResults && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">
                        Riktig svar: {factor.correctRisk === 'high' ? 'Høy risiko' : 
                                     factor.correctRisk === 'medium' ? 'Middels risiko' : 'Lav risiko'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{factor.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!isCompleted && (
            <div className="flex justify-center mt-6">
              <Button 
                onClick={submitAssessment}
                disabled={!canSubmit}
                className="px-8"
              >
                Send inn vurdering
              </Button>
            </div>
          )}

          {isCompleted && (
            <div className="mt-6 text-center">
              <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">
                Modul fullført!
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RiskAssessmentModule;
