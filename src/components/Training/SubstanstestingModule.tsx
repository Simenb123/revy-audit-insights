import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, BookOpen } from 'lucide-react';
import { useUpdateTrainingProgress, useAwardBadge } from '@/hooks/useTraining';

interface Question {
  id: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const questions: Question[] = [
  {
    id: 'inventory',
    question: 'Hvilken prosedyre er best for å bekrefte varelagrets eksistens?',
    options: [
      'Innhente bankbekreftelse',
      'Observere lageropptelling',
      'Analysere bruttomargin'
    ],
    correct: 1,
    explanation: 'Observasjon av lageropptellingen gir direkte bevis for at varelageret eksisterer.'
  },
  {
    id: 'receivables',
    question: 'Hva brukes ofte for å teste kundefordringer?',
    options: [
      'Kredittsjekk av leverandører',
      'Sirkularisering til kunder',
      'Sammenligning av lønnslister'
    ],
    correct: 1,
    explanation: 'Sirkularisering bekrefter saldo direkte med kundene og er en effektiv test.'
  },
  {
    id: 'cutoff',
    question: 'Hvilken test sikrer riktig periodisering av inntekter?',
    options: [
      'Sammenligning av signerte kontrakter',
      'Gjennomgang av etterfølgende innbetalinger',
      'Kontroll av bilagsnummerrekkefølge rundt årsskiftet'
    ],
    correct: 2,
    explanation: 'Kontroll av bilagsnummer og dato rundt årsskiftet avdekker om transaksjoner er bokført i riktig periode.'
  }
];

interface SubstanstestingModuleProps {
  scenarioId: string;
  scenarioName: string;
}

const SubstanstestingModule = ({ scenarioId, scenarioName }: SubstanstestingModuleProps) => {
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [showResults, setShowResults] = useState(false);
  const [completed, setCompleted] = useState(false);

  const updateProgress = useUpdateTrainingProgress();
  const awardBadge = useAwardBadge();

  const handleAnswer = (qId: string, index: number) => {
    setAnswers(prev => ({ ...prev, [qId]: index }));
  };

  const submitQuiz = () => {
    setShowResults(true);
    const correctCount = questions.filter(q => answers[q.id] === q.correct).length;
    const score = Math.round((correctCount / questions.length) * 100);

    updateProgress.mutate({
      scenario_id: scenarioId,
      module_name: 'testing',
      score,
      max_score: 100,
      completed_at: new Date().toISOString()
    });

    if (score >= 80) {
      awardBadge.mutate({
        badge_type: 'achievement',
        badge_name: 'Testekspert',
        description: 'Oppnådde 80%+ i substanstesting',
        scenario_id: scenarioId,
        points_earned: 30
      });
    }

    setCompleted(true);
  };

  const canSubmit = Object.keys(answers).length === questions.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Substanstesting - {scenarioName}
          </CardTitle>
          <p className="text-gray-600">Svar på spørsmålene under for å teste kunnskapen din.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.map((q) => (
            <div key={q.id} className="border rounded-lg p-4 space-y-3">
              <p className="font-medium">{q.question}</p>
              <div className="flex flex-col gap-2">
                {q.options.map((opt, idx) => (
                  <Button
                    key={idx}
                    variant={answers[q.id] === idx ? 'default' : 'outline'}
                    onClick={() => handleAnswer(q.id, idx)}
                    disabled={completed}
                  >
                    {opt}
                  </Button>
                ))}
              </div>
              {showResults && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  {answers[q.id] === q.correct ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>{q.explanation}</span>
                </div>
              )}
            </div>
          ))}

          {showResults && (
            <div className="pt-4">
              <Progress value={questions.filter(q => answers[q.id] === q.correct).length / questions.length * 100} className="mb-2" />
            </div>
          )}

          {!completed && (
            <div className="flex justify-center">
              <Button onClick={submitQuiz} disabled={!canSubmit} className="px-8">
                Send inn
              </Button>
            </div>
          )}

          {completed && (
            <div className="text-center">
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

export default SubstanstestingModule;
