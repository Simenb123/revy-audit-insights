import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, TrendingUp, Play } from 'lucide-react';
import { TrainingScenario } from '@/hooks/useTrainingScenarios';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ScenarioSelectorProps {
  scenarios: TrainingScenario[];
  onSelectScenario: (scenarioId: string, runId: string) => void;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'intermediate': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'advanced': return 'bg-red-100 text-red-800 hover:bg-red-200';
    default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const getDifficultyText = (difficulty: string) => {
  switch (difficulty) {
    case 'beginner': return 'Nybegynner';
    case 'intermediate': return 'Øvet';
    case 'advanced': return 'Avansert';
    default: return difficulty;
  }
};

export const ScenarioSelector = ({ scenarios, onSelectScenario }: ScenarioSelectorProps) => {
  const handleStartScenario = async (scenarioId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('training-start-run', {
        body: { scenarioId }
      });

      if (error) {
        throw error;
      }

      if (data.success && data.runId) {
        toast({
          title: "Øving startet",
          description: data.message || "Øvingsscenarioet er klar for deg!",
        });
        onSelectScenario(scenarioId, data.runId);
      } else {
        throw new Error(data.error || 'Ukjent feil');
      }
    } catch (error) {
      console.error('Error starting scenario:', error);
      toast({
        title: "Feil ved oppstart",
        description: "Kunne ikke starte øvingsscenarioet. Prøv igjen.",
        variant: "destructive"
      });
    }
  };

  if (scenarios.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Ingen tilgjengelige scenarioer for øyeblikket.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
      {scenarios.map((scenario) => (
        <Card key={scenario.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-lg">{scenario.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {scenario.description}
                </CardDescription>
              </div>
              <Badge 
                variant="secondary" 
                className={getDifficultyColor(scenario.difficulty_level)}
              >
                {getDifficultyText(scenario.difficulty_level)}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">
              {scenario.company_name}
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{scenario.estimated_duration_minutes} min</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>{scenario.target_actions} handlinger</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>kr {scenario.initial_budget.toLocaleString()}</span>
              </div>
            </div>

            {scenario.learning_objectives && scenario.learning_objectives.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Læringsmål:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {scenario.learning_objectives.slice(0, 2).map((objective, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-xs mt-1">•</span>
                      <span>{objective}</span>
                    </li>
                  ))}
                  {scenario.learning_objectives.length > 2 && (
                    <li className="text-xs italic">
                      +{scenario.learning_objectives.length - 2} flere mål...
                    </li>
                  )}
                </ul>
              </div>
            )}

            <Button 
              onClick={() => handleStartScenario(scenario.id)}
              className="w-full"
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Start øving
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};