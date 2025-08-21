import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrainingSession {
  id: string;
  program_id: string;
  session_index: number;
  title: string;
  slug: string;
  summary: string;
  goals: string[];
  open_at: string;
  is_published: boolean;
  ai_mode: string;
  default_params: any;
  created_at: string;
  updated_at: string;
  training_programs?: {
    name: string;
    description: string;
  };
}

export interface SessionProgress {
  id: string;
  session_id: string;
  user_id: string;
  status: 'locked' | 'in_progress' | 'completed';
  time_spent_minutes: number;
  score: any;
  updated_at: string;
}

export const useTrainingSessions = (programId?: string) => {
  return useQuery({
    queryKey: ['training-sessions', programId],
    queryFn: async () => {
      let query = supabase
        .from('training_sessions')
        .select(`
          *,
          training_programs(name, description)
        `)
        .eq('is_published', true)
        .order('session_index', { ascending: true });

      if (programId) {
        query = query.eq('program_id', programId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data as TrainingSession[];
    },
    enabled: !!programId || programId === undefined,
  });
};

export const useSessionProgress = (sessionId: string) => {
  return useQuery({
    queryKey: ['session-progress', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_session_progress')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as SessionProgress | null;
    },
    enabled: !!sessionId,
  });
};

export const useUpdateSessionProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      sessionId, 
      status, 
      timeSpent, 
      score 
    }: { 
      sessionId: string; 
      status?: 'locked' | 'in_progress' | 'completed';
      timeSpent?: number;
      score?: any;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const updateData: any = {};
      if (status) updateData.status = status;
      if (timeSpent !== undefined) updateData.time_spent_minutes = timeSpent;
      if (score) updateData.score = score;

      const { data, error } = await supabase
        .from('training_session_progress')
        .upsert({
          session_id: sessionId,
          user_id: user.user.id,
          ...updateData
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['session-progress', variables.sessionId] });
    },
  });
};