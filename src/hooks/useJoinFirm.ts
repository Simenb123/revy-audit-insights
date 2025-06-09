
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/Auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export function useJoinFirm() {
  const { session } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ firmId, departmentId }: { firmId: string; departmentId?: string }) => {
      if (!session?.user?.id) throw new Error('Not authenticated');

      // Update user profile to link to firm
      const { error } = await supabase
        .from('profiles')
        .update({
          audit_firm_id: firmId,
          department_id: departmentId,
          user_role: 'employee' // Default role when joining existing firm
        })
        .eq('id', session.user.id);

      if (error) throw error;

      return { firmId, departmentId };
    },
    onSuccess: () => {
      toast({
        title: "Tilkoblet firma!",
        description: "Du er nå koblet til revisjonsfirmaet.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Feil ved tilkobling",
        description: error.message,
        variant: "destructive"
      });
    }
  });
}
