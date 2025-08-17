import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Budget = Database['public']['Tables']['budgets']['Row'];
type BudgetLine = Database['public']['Tables']['budget_lines']['Row'];
type BudgetActual = Database['public']['Tables']['budget_actuals']['Row'];
type ForecastScenario = Database['public']['Tables']['forecast_scenarios']['Row'];
type BudgetTemplate = Database['public']['Tables']['budget_templates']['Row'];

interface BudgetFormData {
  budget_name: string;
  budget_year: number;
  budget_type: 'operating' | 'capital' | 'cash_flow' | 'master';
  start_date: string;
  end_date: string;
  currency_code?: string;
  notes?: string;
}

interface BudgetLineFormData {
  budget_id: string;
  account_number: string;
  account_name: string;
  account_type: 'revenue' | 'expense' | 'asset' | 'liability' | 'equity';
  budget_category?: string;
  jan_amount?: number;
  feb_amount?: number;
  mar_amount?: number;
  apr_amount?: number;
  may_amount?: number;
  jun_amount?: number;
  jul_amount?: number;
  aug_amount?: number;
  sep_amount?: number;
  oct_amount?: number;
  nov_amount?: number;
  dec_amount?: number;
  notes?: string;
}

interface BudgetSummary {
  total_budgets: number;
  active_budgets: number;
  draft_budgets: number;
  approved_budgets: number;
  total_revenue_budget: number;
  total_expense_budget: number;
  projected_net_income: number;
}

export function useBudgetManagement(clientId: string, budgetYear?: number) {
  const queryClient = useQueryClient();

  // Fetch budgets for client
  const {
    data: budgets,
    isLoading: budgetsLoading,
    error: budgetsError
  } = useQuery({
    queryKey: ['budgets', clientId, budgetYear],
    queryFn: async () => {
      let query = supabase
        .from('budgets')
        .select(`
          *,
          budget_lines (
            *
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (budgetYear) {
        query = query.eq('budget_year', budgetYear);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!clientId
  });

  // Fetch budget templates
  const {
    data: budgetTemplates,
    isLoading: templatesLoading
  } = useQuery({
    queryKey: ['budgetTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_templates')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  // Fetch budget summary
  const {
    data: budgetSummary,
    isLoading: summaryLoading
  } = useQuery<BudgetSummary>({
    queryKey: ['budgetSummary', clientId, budgetYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_budget_summary', { 
          p_client_id: clientId,
          p_budget_year: budgetYear || new Date().getFullYear()
        });

      if (error) throw error;
      return data as unknown as BudgetSummary;
    },
    enabled: !!clientId
  });

  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: async (budgetData: BudgetFormData) => {
      const { data, error } = await supabase
        .from('budgets')
        .insert({
          ...budgetData,
          client_id: clientId,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', clientId] });
      queryClient.invalidateQueries({ queryKey: ['budgetSummary', clientId] });
    }
  });

  // Update budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, ...budgetData }: BudgetFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('budgets')
        .update(budgetData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', clientId] });
      queryClient.invalidateQueries({ queryKey: ['budgetSummary', clientId] });
    }
  });

  // Delete budget mutation
  const deleteBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', clientId] });
      queryClient.invalidateQueries({ queryKey: ['budgetSummary', clientId] });
    }
  });

  // Create budget line mutation
  const createBudgetLineMutation = useMutation({
    mutationFn: async (lineData: BudgetLineFormData) => {
      const { data, error } = await supabase
        .from('budget_lines')
        .insert(lineData)
        .select()
        .single();

      if (error) throw error;

      // Recalculate budget totals
      await supabase.rpc('calculate_budget_totals', { p_budget_id: lineData.budget_id });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', clientId] });
      queryClient.invalidateQueries({ queryKey: ['budgetSummary', clientId] });
    }
  });

  // Update budget line mutation
  const updateBudgetLineMutation = useMutation({
    mutationFn: async ({ id, ...lineData }: BudgetLineFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('budget_lines')
        .update(lineData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Recalculate budget totals
      await supabase.rpc('calculate_budget_totals', { p_budget_id: lineData.budget_id });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', clientId] });
      queryClient.invalidateQueries({ queryKey: ['budgetSummary', clientId] });
    }
  });

  // Delete budget line mutation
  const deleteBudgetLineMutation = useMutation({
    mutationFn: async ({ lineId, budgetId }: { lineId: string; budgetId: string }) => {
      const { error } = await supabase
        .from('budget_lines')
        .delete()
        .eq('id', lineId);

      if (error) throw error;

      // Recalculate budget totals
      await supabase.rpc('calculate_budget_totals', { p_budget_id: budgetId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', clientId] });
      queryClient.invalidateQueries({ queryKey: ['budgetSummary', clientId] });
    }
  });

  // Activate budget mutation
  const activateBudgetMutation = useMutation({
    mutationFn: async (budgetId: string) => {
      // First deactivate all other budgets for this client
      await supabase
        .from('budgets')
        .update({ is_active: false })
        .eq('client_id', clientId);

      // Then activate the selected budget
      const { data, error } = await supabase
        .from('budgets')
        .update({ is_active: true, status: 'active' })
        .eq('id', budgetId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets', clientId] });
      queryClient.invalidateQueries({ queryKey: ['budgetSummary', clientId] });
    }
  });

  return {
    budgets,
    budgetsLoading,
    budgetsError,
    budgetTemplates,
    templatesLoading,
    budgetSummary,
    summaryLoading,
    createBudget: createBudgetMutation.mutate,
    updateBudget: updateBudgetMutation.mutate,
    deleteBudget: deleteBudgetMutation.mutate,
    createBudgetLine: createBudgetLineMutation.mutate,
    updateBudgetLine: updateBudgetLineMutation.mutate,
    deleteBudgetLine: deleteBudgetLineMutation.mutate,
    activateBudget: activateBudgetMutation.mutate,
    isCreating: createBudgetMutation.isPending,
    isUpdating: updateBudgetMutation.isPending,
    isDeleting: deleteBudgetMutation.isPending,
    isCreatingLine: createBudgetLineMutation.isPending,
    isUpdatingLine: updateBudgetLineMutation.isPending,
    isDeletingLine: deleteBudgetLineMutation.isPending,
    isActivating: activateBudgetMutation.isPending
  };
}

export function useBudgetActuals(budgetId?: string) {
  return useQuery({
    queryKey: ['budgetActuals', budgetId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_actuals')
        .select(`
          *,
          budget_lines (
            account_number,
            account_name,
            account_type
          )
        `)
        .eq('budget_line_id', budgetId!)
        .order('period_year', { ascending: true })
        .order('period_month', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!budgetId
  });
}

export function useForecastScenarios(clientId: string) {
  const queryClient = useQueryClient();

  const {
    data: scenarios,
    isLoading: scenariosLoading
  } = useQuery({
    queryKey: ['forecastScenarios', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forecast_scenarios')
        .select(`
          *,
          forecast_lines (*)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId
  });

  const createScenarioMutation = useMutation({
    mutationFn: async (scenarioData: any) => {
      const { data, error } = await supabase
        .from('forecast_scenarios')
        .insert({
          ...scenarioData,
          client_id: clientId,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forecastScenarios', clientId] });
    }
  });

  return {
    scenarios,
    scenariosLoading,
    createScenario: createScenarioMutation.mutate,
    isCreatingScenario: createScenarioMutation.isPending
  };
}