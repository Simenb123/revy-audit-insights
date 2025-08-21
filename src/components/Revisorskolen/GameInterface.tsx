import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActionsList } from './ActionsList';
import { RevealFeed, RevealItem } from './RevealFeed';
import { RiskObjectives } from './RiskObjectives';
import { ScenarioHeader } from './ScenarioHeader';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TrainingScenario } from '@/hooks/useTrainingScenarios';
import { Play, Eye, Target } from 'lucide-react';

interface TrainingAction {
  id: string;
  step_number: number;
  action_type: string;
  title: string;
  description: string;
  cost: number;
  reveal_text: string;
  reveal_key?: string | null;
  score_impact: number;
  risk_impact: string;
  sort_order: number;
}

interface GameInterfaceProps {
  runId: string;
  scenarioId: string;
  onComplete: () => void;
}

export const GameInterface = ({ runId, scenarioId, onComplete }: GameInterfaceProps) => {
  const [scenario, setScenario] = useState<TrainingScenario | null>(null);
  const [actions, setActions] = useState<TrainingAction[]>([]);
  const [appliedActionIds, setAppliedActionIds] = useState<Set<string>>(new Set());
  const [currentBudget, setCurrentBudget] = useState(0);
  const [totalBudget, setTotalBudget] = useState(0);
  const [revealedItems, setRevealedItems] = useState<RevealItem[]>([]);
  const [achievedKeys, setAchievedKeys] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadGameData();
  }, [runId, scenarioId]);

  const loadGameData = async () => {
    try {
      setIsLoading(true);
      
      // Load scenario
      const { data: scenarioData, error: scenarioError } = await supabase
        .from('training_scenarios')
        .select('*')
        .eq('id', scenarioId)
        .single();

      if (scenarioError) throw scenarioError;
      setScenario(scenarioData as TrainingScenario);

      // Load training actions
      const { data: actionsData, error: actionsError } = await supabase
        .from('training_actions')
        .select('*')
        .eq('scenario_id', scenarioId)
        .order('sort_order');

      if (actionsError) throw actionsError;
      setActions((actionsData || []) as TrainingAction[]);

      // Load run data
      const { data: runData, error: runError } = await supabase
        .from('training_runs')
        .select('*')
        .eq('id', runId)
        .single();

      if (runError) throw runError;
      setCurrentBudget(runData.current_budget || 0);
      setTotalBudget(scenarioData.initial_budget || 10000);

    const { data: appliedData, error: appliedError } = await supabase
      .from('training_run_states')
      .select('action_id, created_at')
      .eq('run_id', runId)
      .order('created_at');

      if (appliedError) throw appliedError;
      
      const appliedIds = new Set(appliedData?.map(item => item.action_id) || []);
      setAppliedActionIds(appliedIds);

      // Build reveal feed from applied actions
      const revealItems: RevealItem[] = [];
      const keys = new Set<string>();
      
      for (const applied of appliedData || []) {
        const action = actionsData?.find(a => a.id === applied.action_id);
        if (action && action.reveal_text) {
          revealItems.push({
            id: action.id,
            title: action.title,
            text: action.reveal_text,
            reveal_key: action.reveal_key,
            action_type: action.action_type,
            cost: action.cost,
            timestamp: new Date(applied.created_at)
          });
          
          if (action.reveal_key) {
            keys.add(action.reveal_key);
          }
        }
      }
      
      setRevealedItems(revealItems);
      setAchievedKeys(keys);

    } catch (error) {
      console.error('Error loading game data:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke laste spilldata",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyAction = async (actionId: string) => {
    try {
      const response = await supabase.functions.invoke('training-apply-action', {
        body: { 
          runId,
          actionId 
        }
      });

      if (response.error) throw response.error;

      const result = response.data;
      const action = actions.find(a => a.id === actionId);
      
      if (action && result) {
        // Update budget
        setCurrentBudget(prev => prev - action.cost);
        
        // Mark action as applied
        setAppliedActionIds(prev => new Set([...prev, actionId]));
        
        // Add to reveal feed
        const newRevealItem: RevealItem = {
          id: action.id,
          title: action.title,
          text: result.revealText || action.reveal_text,
          reveal_key: action.reveal_key,
          action_type: action.action_type,
          cost: action.cost,
          timestamp: new Date()
        };
        
        setRevealedItems(prev => [...prev, newRevealItem]);
        
        // Update achieved keys
        if (action.reveal_key) {
          setAchievedKeys(prev => new Set([...prev, action.reveal_key!]));
        }

        toast({
          title: "Handling utført",
          description: `${action.title} er gjennomført`,
        });
      }
    } catch (error) {
      console.error('Error applying action:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke utføre handlingen",
        variant: "destructive",
      });
    }
  };

  const handleRestart = async () => {
    try {
      await supabase.functions.invoke('training-reset-run', {
        body: { runId }
      });
      
      toast({
        title: "Scenario startet på nytt",
        description: "Budsjettet og fremdriften er tilbakestilt",
      });
      
      // Reload game data
      loadGameData();
    } catch (error) {
      console.error('Error restarting:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke starte på nytt",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!scenario) {
    return <div>Scenario ikke funnet</div>;
  }

  return (
    <div className="space-y-6">
      <ScenarioHeader
        title={scenario.title}
        totalBudget={totalBudget}
        usedBudget={totalBudget - currentBudget}
        currency="NOK"
        onRestart={handleRestart}
        achievedObjectives={achievedKeys.size}
        totalObjectives={scenario.risk_objectives?.length || 0}
      />

      <Card className="p-6">
        <Tabs defaultValue="actions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="actions" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Handlinger
            </TabsTrigger>
            <TabsTrigger value="revealed" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Avslørt info
            </TabsTrigger>
            <TabsTrigger value="objectives" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Mål & risiko
            </TabsTrigger>
          </TabsList>

          <TabsContent value="actions" className="mt-6">
            <ActionsList
              actions={actions}
              appliedActionIds={appliedActionIds}
              currentBudget={currentBudget}
              onApplyAction={handleApplyAction}
            />
          </TabsContent>

          <TabsContent value="revealed" className="mt-6">
            <RevealFeed items={revealedItems} />
          </TabsContent>

          <TabsContent value="objectives" className="mt-6">
            <RiskObjectives
              objectives={scenario.risk_objectives || []}
              achievedKeys={achievedKeys}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};