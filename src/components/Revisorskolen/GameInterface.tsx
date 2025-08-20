import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  Target, 
  Trophy, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  RotateCcw,
  Home
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TrainingScenario } from '@/hooks/useTrainingScenarios';
import { ActionsList } from './ActionsList';
import { RevealModal } from './RevealModal';

interface GameInterfaceProps {
  runId: string;
  scenarioId: string;
  onComplete: () => void;
}

interface TrainingRun {
  id: string;
  scenario_id: string;
  current_budget: number;
  actions_taken: number;
  current_step: number;
  total_score: number;
  status: 'active' | 'completed' | 'abandoned';
}

interface TrainingAction {
  id: string;
  step_number: number;
  action_type: string;
  title: string;
  description: string;
  cost: number;
  reveal_text: string;
  score_impact: number;
  risk_impact: 'positive' | 'neutral' | 'negative';
  sort_order: number;
}

export const GameInterface = ({ runId, scenarioId, onComplete }: GameInterfaceProps) => {
  const [scenario, setScenario] = useState<TrainingScenario | null>(null);
  const [run, setRun] = useState<TrainingRun | null>(null);
  const [actions, setActions] = useState<TrainingAction[]>([]);
  const [appliedActionIds, setAppliedActionIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [revealData, setRevealData] = useState<{
    text: string;
    scoreImpact: number;
    actionTitle: string;
  } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load scenario
      const { data: scenarioData, error: scenarioError } = await supabase
        .from('training_scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();

      if (scenarioError) throw scenarioError;
      setScenario(scenarioData as TrainingScenario);

      // Load run
      const { data: runData, error: runError } = await supabase
        .from('training_runs')
        .select('*')
        .eq('id', runId)
        .single();

      if (runError) throw runError;
      setRun(runData as TrainingRun);

      // Load actions for this scenario
      const { data: actionsData, error: actionsError } = await supabase
        .from('training_actions')
        .select('*')
        .eq('scenario_id', scenarioId)
        .order('sort_order');

      if (actionsError) throw actionsError;
      setActions(actionsData as TrainingAction[]);

      // Load applied actions
      const { data: appliedActions, error: appliedError } = await supabase
        .from('training_run_states')
        .select('action_id')
        .eq('run_id', runId);

      if (appliedError) throw appliedError;
      
      const appliedIds = new Set(appliedActions.map(state => state.action_id));
      setAppliedActionIds(appliedIds);

    } catch (error) {
      console.error('Error loading game data:', error);
      toast({
        title: "Feil ved lasting",
        description: "Kunne ikke laste øvingsdata. Prøv igjen.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [runId, scenarioId]);

  const handleApplyAction = async (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (!action || !run) return;

    try {
      const { data, error } = await supabase.functions.invoke('training-apply-action', {
        body: { 
          runId, 
          actionId,
          notes: '' 
        }
      });

      if (error) throw error;

      if (data.success) {
        // Update local state
        setRun(prev => prev ? {
          ...prev,
          current_budget: data.newBudget,
          actions_taken: prev.actions_taken + 1,
          total_score: (prev.total_score || 0) + (data.scoreImpact || 0)
        } : null);

        setAppliedActionIds(prev => new Set([...prev, actionId]));

        // Show reveal modal if there's reveal text
        if (data.revealText) {
          setRevealData({
            text: data.revealText,
            scoreImpact: data.scoreImpact || 0,
            actionTitle: action.title
          });
        }

        toast({
          title: "Handling utført",
          description: `${action.title} ble utført for kr ${action.cost.toLocaleString()}`,
        });
      } else {
        throw new Error(data.error || 'Ukjent feil');
      }
    } catch (error) {
      console.error('Error applying action:', error);
      toast({
        title: "Feil ved utførelse",
        description: "Kunne ikke utføre handlingen. Prøv igjen.",
        variant: "destructive"
      });
    }
  };

  const handleResetRun = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('training-reset-run', {
        body: { runId }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Øving tilbakestilt",
          description: "Øvingen er tilbakestilt til start."
        });
        await loadData(); // Reload all data
      } else {
        throw new Error(data.error || 'Ukjent feil');
      }
    } catch (error) {
      console.error('Error resetting run:', error);
      toast({
        title: "Feil ved tilbakestilling",
        description: "Kunne ikke tilbakestille øvingen. Prøv igjen.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!scenario || !run) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Kunne ikke laste øvingsdata. Prøv å gå tilbake og start øvingen på nytt.
        </AlertDescription>
      </Alert>
    );
  }

  const budgetPercentage = (run.current_budget / scenario.initial_budget) * 100;
  const progressPercentage = (run.actions_taken / scenario.target_actions) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{scenario.title}</CardTitle>
              <CardDescription>{scenario.company_name}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleResetRun}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Start på nytt
              </Button>
              <Button variant="outline" size="sm" onClick={onComplete}>
                <Home className="h-4 w-4 mr-2" />
                Tilbake
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status Dashboard */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Budsjett</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                kr {run.current_budget.toLocaleString()}
              </div>
              <Progress value={budgetPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {budgetPercentage.toFixed(0)}% gjenstående
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Fremgang</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {run.actions_taken}/{scenario.target_actions}
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">
                handlinger utført
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Poengsum</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">
                {run.total_score || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                akkumulerte poeng
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <ActionsList 
        actions={actions}
        appliedActionIds={appliedActionIds}
        currentBudget={run.current_budget}
        onApplyAction={handleApplyAction}
      />

      {/* Reveal Modal */}
      {revealData && (
        <RevealModal
          isOpen={true}
          onClose={() => setRevealData(null)}
          title={revealData.actionTitle}
          content={revealData.text}
          scoreImpact={revealData.scoreImpact}
        />
      )}
    </div>
  );
};