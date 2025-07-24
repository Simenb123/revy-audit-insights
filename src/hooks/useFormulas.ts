import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface FormulaDefinition {
  id: string;
  name: string;
  description?: string;
  formula_expression: any;
  category?: string;
  is_system_formula: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  version: number;
  is_active: boolean;
  metadata: any;
}

export interface FormulaVariable {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  variable_type: 'account_reference' | 'constant' | 'calculated';
  value_expression?: any;
  data_type: 'numeric' | 'percentage' | 'currency';
  category?: string;
  is_system_variable: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  metadata: any;
}

export const useFormulaDefinitions = () => {
  return useQuery({
    queryKey: ['formula-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formula_definitions')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as FormulaDefinition[];
    },
  });
};

export const useFormulaVariables = () => {
  return useQuery({
    queryKey: ['formula-variables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('formula_variables')
        .select('*')
        .eq('is_active', true)
        .order('display_name');
      
      if (error) throw error;
      return data as FormulaVariable[];
    },
  });
};

export const useCreateFormulaDefinition = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (formula: Omit<FormulaDefinition, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('formula_definitions')
        .insert([formula])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formula-definitions'] });
    },
  });
};

export const useUpdateFormulaDefinition = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FormulaDefinition> & { id: string }) => {
      const { data, error } = await supabase
        .from('formula_definitions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formula-definitions'] });
    },
  });
};

export const useDeleteFormulaDefinition = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('formula_definitions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formula-definitions'] });
    },
  });
};

export const useCreateFormulaVariable = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (variable: Omit<FormulaVariable, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('formula_variables')
        .insert([variable])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formula-variables'] });
    },
  });
};

export const useUpdateFormulaVariable = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FormulaVariable> & { id: string }) => {
      const { data, error } = await supabase
        .from('formula_variables')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formula-variables'] });
    },
  });
};

// Hook for logging formula usage for AI/ML analytics
export const useLogFormulaUsage = () => {
  return useMutation({
    mutationFn: async (usage: {
      formula_id?: string;
      account_id?: string;
      client_id?: string;
      usage_context: string;
      execution_time_ms?: number;
      result_value?: number;
      input_values?: any;
      session_id?: string;
      metadata?: any;
    }) => {
      const { data, error } = await supabase
        .from('formula_usage_logs')
        .insert([{
          ...usage,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
  });
};