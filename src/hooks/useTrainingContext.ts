import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrainingContextData {
  session: any;
  actions: any[];
  progress: any;
  library: any[];
  userChoices: any[];
}

export const useTrainingContext = (sessionId: string | null) => {
  return useQuery({
    queryKey: ['training-context', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      const { data, error } = await supabase.functions.invoke('training-context', {
        body: { sessionId }
      });

      if (error) {
        throw error;
      }

      return data as TrainingContextData;
    },
    enabled: !!sessionId,
  });
};