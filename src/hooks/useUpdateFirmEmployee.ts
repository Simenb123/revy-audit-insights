import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { UserRole, EmployeeStatus } from '@/types/organization';

export interface UpdateFirmEmployeeInput {
  id: string;
  role?: UserRole;
  status?: EmployeeStatus;
  firstName?: string;
  lastName?: string;
  email?: string | null;
}

export function useUpdateFirmEmployee() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateFirmEmployeeInput) => {
      const { id, ...fields } = input;
      const payload: any = {};
      if (fields.role) payload.role = fields.role;
      if (fields.status) payload.status = fields.status;
      if (fields.firstName) payload.first_name = fields.firstName;
      if (fields.lastName) payload.last_name = fields.lastName;
      if (fields.email !== undefined) payload.email = fields.email;

      const { error } = await (supabase as any)
        .from('firm_employees')
        .update(payload)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firm-employees'] });
      toast({ title: 'Endringer lagret', description: 'Ansattinformasjon er oppdatert.' });
    },
    onError: (err: any) => {
      toast({ title: 'Kunne ikke lagre', description: err.message, variant: 'destructive' });
    },
  });
}
