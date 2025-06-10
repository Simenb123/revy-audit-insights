
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTrainingProgress = () => {
  return useQuery({
    queryKey: ['user-training-progress'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('training_progress')
        .select('*')
        .eq('user_id', user.user.id);
      
      if (error) throw error;
      return data;
    }
  });
};

export const useUserBadges = () => {
  return useQuery({
    queryKey: ['user-badges'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.user.id)
        .order('earned_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useTestScenarios = () => {
  return useQuery({
    queryKey: ['test-scenarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('test_scenarios')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useQuizQuestions = (moduleId?: string, scenarioId?: string) => {
  return useQuery({
    queryKey: ['quiz-questions', moduleId, scenarioId],
    queryFn: async () => {
      let query = supabase.from('quiz_questions').select('*');
      
      if (moduleId) {
        query = query.eq('module_name', moduleId);
      }
      
      if (scenarioId) {
        query = query.eq('scenario_id', scenarioId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!moduleId
  });
};

export const useUpdateTrainingProgress = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (progressData: {
      scenario_id: string;
      module_name: string;
      score?: number;
      max_score?: number;
      completed_at?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('training_progress')
        .upsert({
          user_id: user.user.id,
          ...progressData,
          attempts: 1
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-training-progress'] });
      toast({
        title: "Progresjon oppdatert!",
        description: "Din progresjon er lagret.",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved lagring",
        description: "Kunne ikke lagre progresjon. Prøv igjen.",
        variant: "destructive",
      });
    }
  });
};

export const useAwardBadge = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (badgeData: {
      badge_type: string;
      badge_name: string;
      description?: string;
      scenario_id?: string;
      points_earned?: number;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Check if badge already exists
      const { data: existingBadge } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', user.user.id)
        .eq('badge_name', badgeData.badge_name)
        .single();

      if (existingBadge) {
        throw new Error('Badge already earned');
      }

      const { data, error } = await supabase
        .from('user_badges')
        .insert({
          user_id: user.user.id,
          ...badgeData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-badges'] });
      toast({
        title: "🏆 Ny utmerkelse!",
        description: `Du har opptjent "${data.badge_name}"`,
      });
    },
    onError: (error) => {
      if (error.message !== 'Badge already earned') {
        toast({
          title: "Feil ved utmerkelse",
          description: "Kunne ikke tildele utmerkelse. Prøv igjen.",
          variant: "destructive",
        });
      }
    }
  });
};
