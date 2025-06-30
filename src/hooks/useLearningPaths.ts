
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useLearningPaths = () => {
  return useQuery({
    queryKey: ['learning-paths'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('learning_paths')
        .select(`
          *,
          learning_path_modules (*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useUserEnrollments = () => {
  return useQuery({
    queryKey: ['user-enrollments'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_learning_enrollments')
        .select(`
          *,
          learning_paths (*),
          user_module_completions (*)
        `)
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
};

export const useCreateEnrollment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      learning_path_id: string;
      user_id: string;
      target_completion_date?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const targetDate = data.target_completion_date || 
        new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 4 weeks from now

      const { data: enrollment, error } = await supabase
        .from('user_learning_enrollments')
        .insert({
          user_id: data.user_id,
          learning_path_id: data.learning_path_id,
          enrolled_by: user.user.id,
          target_completion_date: targetDate
        })
        .select()
        .single();

      if (error) throw error;
      return enrollment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['team-enrollments'] });
      toast({
        title: "Påmelding fullført!",
        description: "Bruker er nå registrert i opplæringsprogrammet.",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved påmelding",
        description: "Kunne ikke registrere bruker i programmet. Prøv igjen.",
        variant: "destructive",
      });
    }
  });
};

export const useCompleteModule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      enrollment_id: string;
      module_id: string;
      score?: number;
      time_spent_minutes?: number;
      feedback?: string;
    }) => {
      const { data: completion, error } = await supabase
        .from('user_module_completions')
        .upsert({
          enrollment_id: data.enrollment_id,
          module_id: data.module_id,
          completed_at: new Date().toISOString(),
          score: data.score,
          time_spent_minutes: data.time_spent_minutes,
          feedback: data.feedback
        })
        .select()
        .single();

      if (error) throw error;
      return completion;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
      toast({
        title: "Modul fullført!",
        description: "Din progresjon er lagret.",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved lagring",
        description: "Kunne ikke lagre modulkompletering. Prøv igjen.",
        variant: "destructive",
      });
    }
  });
};

export const useTeamEnrollments = () => {
  return useQuery({
    queryKey: ['team-enrollments'],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Get current user's profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_role, audit_firm_id, department_id')
        .eq('id', user.user.id)
        .single();

      if (!profile || !['admin', 'partner', 'manager', 'employee'].includes(profile.user_role)) {
        return [];
      }

      // First get enrollments, then get profiles separately to avoid relation issues
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('user_learning_enrollments')
        .select(`
          *,
          learning_paths (*),
          user_module_completions (*)
        `)
        .order('created_at', { ascending: false });
      
      if (enrollmentsError) throw enrollmentsError;

      if (!enrollments || enrollments.length === 0) {
        return [];
      }

      // Get user profiles for all enrollments
      const userIds = enrollments.map(e => e.user_id);
      const { data: userProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, department_id, audit_firm_id')
        .in('id', userIds);
      
      if (profilesError) throw profilesError;

      // Combine enrollments with their user profiles
      const enrollmentsWithProfiles = enrollments.map(enrollment => {
        const userProfile = userProfiles?.find(p => p.id === enrollment.user_id);
        return {
          ...enrollment,
          profiles: userProfile || null
        };
      });

      // Filter based on user role and firm
      return enrollmentsWithProfiles.filter(enrollment => {
        const enrollmentProfile = enrollment.profiles;
        if (!enrollmentProfile) return false;
        
        if (
          profile.user_role === 'admin' ||
          profile.user_role === 'partner' ||
          profile.user_role === 'employee'
        ) {
          return enrollmentProfile.audit_firm_id === profile.audit_firm_id;
        } else if (profile.user_role === 'manager') {
          return enrollmentProfile.department_id === profile.department_id;
        }
        return false;
      });
    }
  });
};

export const useIssueCertification = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      enrollment_id: string;
      user_id: string;
      learning_path_id: string;
      final_score: number;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      // Generate certificate number
      const { data: cert, error } = await supabase.rpc('generate_certificate_number');
      if (error) throw error;

      const { data: certification, error: certError } = await supabase
        .from('learning_certifications')
        .insert({
          user_id: data.user_id,
          learning_path_id: data.learning_path_id,
          enrollment_id: data.enrollment_id,
          certificate_number: cert,
          final_score: data.final_score,
          issued_by: user.user.id,
          certificate_data: {
            issued_to: data.user_id,
            program_name: 'Nyansatt Revisjonsprogram',
            completion_date: new Date().toISOString(),
            score: data.final_score
          }
        })
        .select()
        .single();

      if (certError) throw certError;

      // Update enrollment status
      await supabase
        .from('user_learning_enrollments')
        .update({
          certification_earned: true,
          certification_date: new Date().toISOString().split('T')[0],
          status: 'completed',
          actual_completion_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', data.enrollment_id);

      return certification;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
      toast({
        title: "🏆 Sertifikat utstedt!",
        description: "Sertifikatet er nå tilgjengelig for nedlasting.",
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved sertifikatutstedelese",
        description: "Kunne ikke utstede sertifikat. Prøv igjen.",
        variant: "destructive",
      });
    }
  });
};
