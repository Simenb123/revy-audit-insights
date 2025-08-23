import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ClientAnnualData {
  id: string;
  client_id: string;
  fiscal_year: number;
  employee_count: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useClientAnnualData = (clientId: string, fiscalYear: number) => {
  return useQuery({
    queryKey: ['client-annual-data', clientId, fiscalYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_annual_data')
        .select('*')
        .eq('client_id', clientId)
        .eq('fiscal_year', fiscalYear)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateClientAnnualData = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      clientId,
      fiscalYear,
      employeeCount,
      notes,
    }: {
      clientId: string;
      fiscalYear: number;
      employeeCount: number | null;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('client_annual_data')
        .upsert({
          client_id: clientId,
          fiscal_year: fiscalYear,
          employee_count: employeeCount,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['client-annual-data', data.client_id, data.fiscal_year],
      });
      toast({
        title: "Suksess",
        description: "Årlige data oppdatert",
      });
    },
    onError: (error) => {
      console.error('Error updating client annual data:', error);
      toast({
        title: "Feil",
        description: "Kunne ikke oppdatere årlige data",
        variant: "destructive",
      });
    },
  });
};