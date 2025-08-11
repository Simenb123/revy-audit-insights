
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/utils/logger';

export function useClaimFirm() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ orgNumber, firmName }: { orgNumber: string; firmName?: string }) => {
      if (!orgNumber || orgNumber.length < 9) throw new Error('Ugyldig organisasjonsnummer');
      const { data, error } = await supabase.rpc('claim_audit_firm_by_org', {
        p_org_number: orgNumber,
        p_firm_name: firmName ?? null
      });
      if (error) {
        logger.error('Claim firm failed', error);
        throw error;
      }
      return data as string | null; // returns firm_id
    },
    onSuccess: () => {
      toast({
        title: 'Firma claimet',
        description: 'Du er nå administrator for dette firmaet.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Kunne ikke claime firma',
        description: error?.message ?? 'Ukjent feil',
        variant: 'destructive',
      });
    },
  });
}
