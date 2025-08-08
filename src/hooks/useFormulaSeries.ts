import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FormulaSeriesParams {
  clientId?: string;
  startYear: number; // inclusive
  endYear: number;   // inclusive
  formulaId?: string;
  customFormula?: unknown;
  selectedVersion?: string;
  enabled?: boolean;
}

interface FormulaPoint {
  year: number;
  value: number;
  formattedValue: string;
  isValid: boolean;
  type?: 'amount' | 'percentage' | 'ratio';
  error?: string;
}

export function useFormulaSeries({
  clientId,
  startYear,
  endYear,
  formulaId,
  customFormula,
  selectedVersion,
  enabled = true,
}: FormulaSeriesParams) {
  const years: number[] = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

  return useQuery({
    queryKey: [
      'formula-series',
      clientId,
      startYear,
      endYear,
      formulaId,
      typeof customFormula === 'object' ? JSON.stringify(customFormula) : customFormula,
      selectedVersion,
    ],
    enabled: enabled && !!clientId && years.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    queryFn: async (): Promise<FormulaPoint[]> => {
      if (!clientId) throw new Error('Client ID is required');
      const results = await Promise.all(
        years.map(async (year) => {
          const { data, error } = await supabase.functions.invoke('calculate-formula', {
            body: {
              clientId,
              fiscalYear: year,
              formulaId,
              customFormula,
              selectedVersion,
            },
          });
          if (error) {
            return { year, value: 0, formattedValue: '0', isValid: false, error: error.message } as FormulaPoint;
          }
          const res = data as { value: number; formattedValue: string; isValid: boolean; error?: string; metadata?: any };
          return { year, value: res.value, formattedValue: res.formattedValue, isValid: res.isValid, error: res.error, type: res.metadata?.type } as FormulaPoint;
        })
      );

      return results.sort((a, b) => a.year - b.year);
    },
  });
}
