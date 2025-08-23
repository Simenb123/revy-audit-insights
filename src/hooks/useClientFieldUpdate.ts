import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FinancialFrameworkType } from '@/types/client-extended';

interface UpdateClientFieldParams {
  clientId: string;
  field: string;
  value: any;
}

export function useClientFieldUpdate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ clientId, field, value }: UpdateClientFieldParams) => {
      const updateData: Record<string, any> = {};
      updateData[field] = value;

      const { data, error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', clientId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['client', variables.clientId] });
      
      const fieldLabels: Record<string, string> = {
        financial_framework: 'Finansielt rammeverk',
        is_part_of_group: 'Selskap i konsern',
        group_name: 'Konsernnavn',
        contact_person: 'Kontaktperson',
        contact_email: 'Kontakt e-post',
        contact_phone: 'Kontakt telefon',
      };

      toast({
        title: "Oppdatert",
        description: `${fieldLabels[variables.field] || variables.field} ble oppdatert.`,
      });
    },
    onError: (error) => {
      console.error('Error updating client field:', error);
      toast({
        title: "Feil ved oppdatering",
        description: "Kunne ikke oppdatere klientinformasjon.",
        variant: "destructive",
      });
    },
  });
}

// Helper function to get financial framework display text
export function getFinancialFrameworkDisplayText(framework?: FinancialFrameworkType): string {
  const frameworkLabels: Record<FinancialFrameworkType, string> = {
    ngaap_small: 'NGAAP små foretak',
    ngaap_medium: 'NGAAP mellomstore foretak',
    ngaap_large: 'NGAAP store foretak',
    ifrs: 'IFRS',
    simplified: 'Forenklet regnskap',
    other: 'Annet',
  };

  return framework ? frameworkLabels[framework] : 'Ikke angitt';
}

// Financial framework options for dropdowns
export const FINANCIAL_FRAMEWORK_OPTIONS = [
  { value: 'ngaap_small', label: 'NGAAP små foretak' },
  { value: 'ngaap_medium', label: 'NGAAP mellomstore foretak' },
  { value: 'ngaap_large', label: 'NGAAP store foretak' },
  { value: 'ifrs', label: 'IFRS' },
  { value: 'simplified', label: 'Forenklet regnskap' },
  { value: 'other', label: 'Annet' },
] as const;