
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useRemoveTeamMember() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: false })
        .eq('id', memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Medlem fjernet",
        description: "Teammedlemmet er fjernet fra teamet.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil ved fjerning av medlem",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
