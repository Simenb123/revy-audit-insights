import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from './useUserProfile';
import type { UserRole, EmployeeStatus } from '@/types/organization';

export interface CreateFirmEmployeeInput {
  firstName: string;
  lastName: string;
  email?: string;
  role: UserRole;
  status: EmployeeStatus;
}

export function useCreateFirmEmployee() {
  const { data: userProfile } = useUserProfile();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFirmEmployeeInput) => {
      if (!userProfile?.auditFirmId) throw new Error('Mangler firmakontekst');
      const { error } = await (supabase as any)
        .from('firm_employees')
        .insert({
          audit_firm_id: userProfile.auditFirmId,
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email ?? null,
          role: input.role,
          status: input.status,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firm-employees', userProfile?.auditFirmId] });
      toast({ title: 'Ansatt lagt til', description: 'Den ansatte er forhåndsregistrert.' });
    },
    onError: (err: any) => {
      toast({ title: 'Kunne ikke legge til', description: err.message, variant: 'destructive' });
    },
  });
}
