// Enhanced formula calculation hook with validation and caching
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFormulaCache } from './useFormulaCache';
import { useFormulaValidator } from './useFormulaValidator';

interface FormulaCalculationParams {
  clientId?: string;
  fiscalYear?: number;
  formulaId?: string;
  customFormula?: unknown; // allow string or structured JSON
  selectedVersion?: string;
  enabled?: boolean;
  cacheEnabled?: boolean;
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
  enabled = true,
  cacheEnabled = true
}: FormulaCalculationParams) {
  const cache = useFormulaCache({
    maxSize: 200,
    ttl: 10 * 60 * 1000, // 10 minutes for calculation cache
    enablePersistence: true
  });

  const validator = useFormulaValidator();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['formula-calculation', clientId, fiscalYear, formulaId, typeof customFormula === 'object' ? JSON.stringify(customFormula) : customFormula, selectedVersion],
    queryFn: async (): Promise<FormulaCalculationResult> => {
      if (!clientId || !fiscalYear) {
        throw new Error('Client ID and fiscal year are required');
      }

      const formulaExpression = typeof customFormula === 'string' ? customFormula : undefined;
      
      // Validate formula before calculation if we have a formula expression
      if (formulaExpression && cacheEnabled) {
        const validation = validator.validate(formulaExpression);
        if (!validation.isValid) {
          throw new Error(`Formula validation failed: ${validation.errors[0]?.message}`);
        }

        // Check cache first
        const cacheKey = cache.generateCacheKey(
          formulaExpression,
          clientId.toString(),
          fiscalYear.toString(),
          { formulaId, selectedVersion }
        );
        
        const cachedResult = cache.get(cacheKey);
        if (cachedResult) {
          return cachedResult;
        }
      }

      const payload: any = {
        clientId,
        fiscalYear,
        selectedVersion
      };

      if (typeof formulaId === 'string') payload.formulaId = formulaId;
      if (customFormula !== undefined) payload.customFormula = customFormula;

      const { data, error } = await supabase.functions.invoke('calculate-formula', {
        body: payload
      });

      if (error) {
        throw new Error(error.message || 'Formula calculation failed');
      }

      // Cache the result if enabled
      if (cacheEnabled && data && formulaExpression) {
        const cacheKey = cache.generateCacheKey(
          formulaExpression,
          clientId.toString(),
          fiscalYear.toString(),
          { formulaId, selectedVersion }
        );
        cache.set(cacheKey, data);
      }

      return data as FormulaCalculationResult;
    },
    enabled: enabled && !!clientId && !!fiscalYear,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });

  // Function to clear cache for specific calculation
  const clearCache = () => {
    if (clientId && fiscalYear) {
      queryClient.invalidateQueries({ 
        queryKey: ['formula-calculation', clientId, fiscalYear, formulaId, typeof customFormula === 'object' ? JSON.stringify(customFormula) : customFormula, selectedVersion] 
      });
    }
  };

  return {
    ...query,
    clearCache,
    cacheStats: cache.getStats(),
    validation: typeof customFormula === 'string' ? validator.validate(customFormula) : null
  };
}