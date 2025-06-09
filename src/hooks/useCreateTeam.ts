
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useUserProfile } from './useUserProfile';
import { useToast } from '@/hooks/use-toast';

interface CreateTeamData {
  name: string;
  description?: string;
  clientId: string;
  startDate?: string;
  endDate?: string;
}

export function useCreateTeam() {
  const { session } = useAuth();
  const { data: userProfile } = useUserProfile();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateTeamData) => {
      if (!session?.user?.id || !userProfile?.departmentId) {
        throw new Error('Not authenticated or missing department');
      }

      const { error } = await supabase
        .from('client_teams')
        .insert({
          name: data.name,
          description: data.description,
          client_id: data.clientId,
          department_id: userProfile.departmentId,
          team_lead_id: session.user.id,
          start_date: data.startDate,
          end_date: data.endDate,
          is_active: true
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Team opprettet!",
        description: "Det nye teamet er opprettet og du er satt som teamleder.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil ved oppretting av team",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
