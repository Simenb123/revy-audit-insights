
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';
import type { UserRole } from '@/types/organization';

export function useRequestFirmAccess() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      firmId,
      roleRequested = 'employee',
      message,
      email,
    }: {
      firmId: string;
      roleRequested?: UserRole;
      message?: string;
      email?: string;
    }) => {
      const { data, error } = await supabase.rpc('request_firm_access', {
        p_audit_firm_id: firmId,
        p_role_requested: roleRequested,
        p_message: message ?? null,
        p_email: email ?? null,
      });
      if (error) {
        logger.error('Request firm access failed', error);
        throw error;
      }
      return data as string; // request_id
    },
    onSuccess: () => {
      toast({
        title: 'Forespørsel sendt',
        description: 'Din forespørsel om tilgang er sendt til firmaets administrator.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Kunne ikke sende forespørsel',
        description: error?.message ?? 'Ukjent feil',
        variant: 'destructive',
      });
    },
  });
}
