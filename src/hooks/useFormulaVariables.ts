import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FormulaVariable {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  value_expression?: any; // matches database schema - can be null/Json
  data_type: string;
  variable_type: string;
  category: string;
  is_system_variable: boolean;
}

// Simple interface for hardcoded formulas until client_formula_overrides is available
export interface FormulaCalculation {
  name: string;
  formula: string;
  type: 'ratio' | 'percentage' | 'amount';
}

export function useFormulaVariables() {
  return useQuery({
    queryKey: ['formula-variables'],
    queryFn: async (): Promise<FormulaVariable[]> => {
      const { data, error } = await supabase
        .from('formula_variables')
        .select('*')
        .order('category', { ascending: true })
        .order('display_name', { ascending: true });

      if (error) {
        console.error('Error fetching formula variables:', error);
        throw error;
      }

      return data || [];
    }
  });
}

// Hardcoded formula calculations until database migration is complete
export const HARDCODED_FORMULAS: FormulaCalculation[] = [
  {
    name: 'liquidity_ratio',
    formula: 'current_assets / current_liabilities',
    type: 'ratio'
  },
  {
    name: 'equity_ratio', 
    formula: '(total_equity / total_assets) * 100',
    type: 'percentage'
  },
  {
    name: 'profit_margin',
    formula: '(operating_result / revenue) * 100', 
    type: 'percentage'
  },
  {
    name: 'operating_result',
    formula: 'revenue - expenses',
    type: 'amount'
  }
];

export function getFormulaVariableByName(variables: FormulaVariable[], name: string): FormulaVariable | undefined {
  return variables.find(v => v.name === name);
}