import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FormulaCalculationParams {
  clientId?: string;
  fiscalYear?: number;
  formulaId?: string;
  customFormula?: string;
  selectedVersion?: string;
  enabled?: boolean;
}

interface FormulaCalculationResult {
  value: number;
  formattedValue: string;
  isValid: boolean;
  error?: string;
  metadata?: any;
}

export function useFormulaCalculation({
  clientId,
  fiscalYear,
  formulaId,
  customFormula,
  selectedVersion,
  enabled = true
}: FormulaCalculationParams) {
  return useQuery({
    queryKey: ['formula-calculation', clientId, fiscalYear, formulaId, customFormula, selectedVersion],
    queryFn: async (): Promise<FormulaCalculationResult> => {
      if (!clientId || !fiscalYear) {
        throw new Error('Client ID and fiscal year are required');
      }

      const payload = {
        clientId,
        fiscalYear,
        formulaId,
        customFormula,
        selectedVersion
      };

      const { data, error } = await supabase.functions.invoke('calculate-formula', {
        body: payload
      });

      if (error) {
        throw new Error(error.message || 'Formula calculation failed');
      }

      return data as FormulaCalculationResult;
    },
    enabled: enabled && !!clientId && !!fiscalYear,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
}