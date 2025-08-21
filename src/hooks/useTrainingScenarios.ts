import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrainingScenario {
  id: string;
  title: string;
  description: string;
  company_name: string;
  company_context: any;
  initial_budget: number;
  target_actions: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration_minutes: number;
  learning_objectives: string[];
  risk_objectives: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useTrainingScenarios = () => {
  return useQuery({
    queryKey: ['training-scenarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_scenarios')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      return data as TrainingScenario[];
    },
  });
};