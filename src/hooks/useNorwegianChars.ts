import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fixNorwegianChars, sanitizeDisplayText } from '@/utils/norwegianChars';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to fix Norwegian character encoding issues in the database
 */
export function useFixNorwegianEncoding() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('fix_norwegian_encoding_safe');
      
      if (error) {
        throw error;
      }
      
      return data as {
        clients_updated: number;
        transactions_updated: number;
        accounts_updated: number;
        total_updated: number;
        timestamp: string;
      };
    },
    onSuccess: (result) => {
      const totalUpdated = result?.total_updated || 0;
      
      if (totalUpdated > 0) {
        toast({
          title: 'Norske tegn reparert',
          description: `${totalUpdated} poster ble oppdatert med riktige norske tegn.`,
        });
        
        // Invalidate relevant queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['clients'] });
        queryClient.invalidateQueries({ queryKey: ['general_ledger_transactions'] });
        queryClient.invalidateQueries({ queryKey: ['client_chart_of_accounts'] });
      } else {
        toast({
          title: 'Ingen endringer nødvendig',
          description: 'Alle norske tegn er allerede korrekte.',
        });
      }
    },
    onError: (error) => {
      console.error('Failed to fix Norwegian encoding:', error);
      toast({
        title: 'Feil ved reparasjon',
        description: 'Kunne ikke reparere norske tegn. Prøv igjen senere.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to sanitize text for display with proper Norwegian characters
 */
export function useSanitizeText() {
  return {
    sanitize: sanitizeDisplayText,
    fix: fixNorwegianChars,
  };
}

/**
 * Custom hook that automatically fixes Norwegian characters in text data
 */
export function useNorwegianCharText(text: string | null | undefined) {
  return sanitizeDisplayText(text);
}