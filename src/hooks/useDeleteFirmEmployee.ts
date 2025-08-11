import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function useDeleteFirmEmployee() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('firm_employees')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firm-employees'] });
      toast({ title: 'Ansatt fjernet', description: 'Den forhåndsregistrerte ansatte er slettet.' });
    },
    onError: (err: any) => {
      toast({ title: 'Kunne ikke slette', description: err.message, variant: 'destructive' });
    },
  });
}
