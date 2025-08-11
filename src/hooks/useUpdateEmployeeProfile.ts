
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UpdateEmployeeInput {
  id: string;
  initials?: string;
  initials_color?: string;
}

export const useUpdateEmployeeProfile = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateEmployeeInput) => {
      // any-cast for å omgå streng typing til profiler-kolonner som ennå ikke finnes i genererte typer
      const { error } = await (supabase as any)
        .from('profiles' as any)
        .update({
          initials: input.initials ?? null,
          initials_color: input.initials_color ?? null,
        } as any)
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees-firm'] });
      toast({
        title: 'Lagret',
        description: 'Initialer og farge er oppdatert.',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Kunne ikke lagre',
        description: err.message,
        variant: 'destructive',
      });
    },
  });
};
