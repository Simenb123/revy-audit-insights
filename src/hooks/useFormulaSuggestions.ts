import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FormulaSuggestion {
  id: string;
  name: string;
  description: string;
  formula: string;
  category: 'profitability' | 'liquidity' | 'efficiency' | 'leverage' | 'growth';
  confidence: number;
  reasoning: string;
  accounts_needed: string[];
}

interface SuggestionRequest {
  clientId: string;
  industry?: string;
  companySize?: 'small' | 'medium' | 'large';
  analysisType?: 'basic' | 'comprehensive';
}

export function useFormulaSuggestions() {
  const [suggestions, setSuggestions] = useState<FormulaSuggestion[]>([]);

  const generateSuggestions = useMutation({
    mutationFn: async (request: SuggestionRequest) => {
      const { data, error } = await supabase.functions.invoke('suggest-formulas', {
        body: request,
      });

      if (error) throw error;
      return data.suggestions as FormulaSuggestion[];
    },
    onSuccess: (data) => {
      setSuggestions(data);
    },
  });

  const clearSuggestions = () => {
    setSuggestions([]);
  };

  return {
    suggestions,
    generateSuggestions: generateSuggestions.mutate,
    isGenerating: generateSuggestions.isPending,
    error: generateSuggestions.error,
    clearSuggestions,
  };
}