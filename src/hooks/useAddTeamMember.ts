
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AddTeamMemberData {
  teamId: string;
  userId: string;
  role: string;
}

export function useAddTeamMember() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: AddTeamMemberData) => {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: data.teamId,
          user_id: data.userId,
          role: data.role,
          assigned_date: new Date().toISOString().split('T')[0],
          is_active: true
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Medlem lagt til!",
        description: "Teammedlemmet er lagt til i teamet.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil ved tillegging av medlem",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
