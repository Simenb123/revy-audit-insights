// Data source adapter for audit sampling - interfaces with Supabase

import { supabase } from '@/integrations/supabase/client';
import { Transaction, SavedSamplingPlan, SamplingResult, SampleItem } from './types';

export interface PopulationOptions {
  clientId: string;
  fiscalYear: number;
  selectedStandardNumbers?: string[];
  excludedAccountNumbers?: string[];
  versionId?: string;
}

/**
 * Fetch transaction population from general ledger
 */
export async function fetchTransactionPopulation(
  options: PopulationOptions
): Promise<Transaction[]> {
  let query = supabase
    .from('general_ledger_transactions')
    .select(`
      id,
      transaction_date,
      debit_amount,
      credit_amount,
      description,
      voucher_number,
      client_chart_of_accounts!inner(
        account_number,
        account_name
      )
    `)
    .eq('client_id', options.clientId)
    .gte('transaction_date', `${options.fiscalYear}-01-01`)
    .lte('transaction_date', `${options.fiscalYear}-12-31`)
    .order('transaction_date');

  // Add version filter if specified
  if (options.versionId) {
    query = query.eq('version_id', options.versionId);
  }

  // Add account filtering if specified
  if (options.excludedAccountNumbers && options.excludedAccountNumbers.length > 0) {
    query = query.not('client_chart_of_accounts.account_number', 'in', `(${options.excludedAccountNumbers.join(',')})`);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(tx => ({
    id: tx.id,
    transaction_date: tx.transaction_date,
    account_no: tx.client_chart_of_accounts.account_number,
    account_name: tx.client_chart_of_accounts.account_name,
    description: tx.description || '',
    amount: tx.debit_amount || -(tx.credit_amount || 0),
    voucher_number: tx.voucher_number,
    risk_score: Math.random() * 0.4 + 0.1 // Placeholder - would come from risk assessment
  }));
}

/**
 * Save sampling plan to database
 */
export async function saveSamplingPlan(
  clientId: string,
  result: SamplingResult,
  planName: string,
  notes?: string
): Promise<string> {
  const { data: planData, error: planError } = await supabase
    .from('audit_sampling_plans')
    .insert({
      client_id: clientId,
      fiscal_year: new Date().getFullYear(), // Should come from parameters
      test_type: result.plan.testType,
      method: result.plan.method,
      population_size: result.samples.total.length,
      population_sum: result.samples.total.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
      recommended_sample_size: result.plan.recommendedSampleSize,
      actual_sample_size: result.plan.actualSampleSize,
      coverage_percentage: result.plan.coveragePercentage,
      plan_name: planName,
      notes: notes,
      param_hash: result.plan.paramHash,
      seed: result.plan.seed,
      metadata: result.metadata
    })
    .select()
    .single();

  if (planError) throw planError;

  const planId = planData.id;

  // Save sample items
  if (result.samples.total.length > 0) {
    const sampleItems = result.samples.total.map(item => ({
      plan_id: planId,
      transaction_id: item.id,
      transaction_date: item.transaction_date,
      account_no: item.account_no,
      account_name: item.account_name,
      description: item.description,
      amount: item.amount,
      sample_type: item.sample_type,
      stratum_id: item.stratum_id,
      selection_method: item.selection_method,
      metadata: {
        rank: item.rank,
        voucher_number: item.voucher_number,
        risk_score: item.risk_score
      }
    }));

    const { error: itemsError } = await supabase
      .from('audit_sampling_samples')
      .insert(sampleItems);

    if (itemsError) throw itemsError;
  }

  // Save strata if applicable
  if (result.strata && result.strata.length > 0) {
    const strataData = result.strata.map(stratum => ({
      plan_id: planId,
      stratum_index: stratum.index,
      lower_bound: stratum.lowerBound,
      upper_bound: stratum.upperBound,
      min_sample_size: stratum.minSampleSize,
      weight_factor: stratum.weightFactor
    }));

    const { error: strataError } = await supabase
      .from('audit_sampling_strata')
      .insert(strataData);

    if (strataError) throw strataError;
  }

  return planId;
}

/**
 * Fetch saved sampling plans for a client
 */
export async function fetchSavedPlans(
  clientId: string,
  fiscalYear?: number
): Promise<SavedSamplingPlan[]> {
  let query = supabase
    .from('audit_sampling_plans')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (fiscalYear) {
    query = query.eq('fiscal_year', fiscalYear);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

/**
 * Fetch sampling plan with samples
 */
export async function fetchSamplingPlanWithSamples(
  planId: string
): Promise<{
  plan: SavedSamplingPlan;
  samples: SampleItem[];
  strata?: any[];
}> {
  // Fetch plan
  const { data: planData, error: planError } = await supabase
    .from('audit_sampling_plans')
    .select('*')
    .eq('id', planId)
    .single();

  if (planError) throw planError;

  // Fetch samples
  const { data: samplesData, error: samplesError } = await supabase
    .from('audit_sampling_samples')
    .select('*')
    .eq('plan_id', planId)
    .order('transaction_date');

  if (samplesError) throw samplesError;

  // Fetch strata if applicable
  const { data: strataData, error: strataError } = await supabase
    .from('audit_sampling_strata')
    .select('*')
    .eq('plan_id', planId)
    .order('stratum_index');

  if (strataError) throw strataError;

  const samples: SampleItem[] = (samplesData || []).map(item => ({
    id: item.transaction_id,
    transaction_date: item.transaction_date,
    account_no: item.account_no,
    account_name: item.account_name,
    description: item.description,
    amount: item.amount,
    sample_type: item.sample_type,
    stratum_id: item.stratum_id,
    selection_method: item.selection_method,
    rank: item.metadata?.rank,
    voucher_number: item.metadata?.voucher_number,  
    risk_score: item.metadata?.risk_score
  }));

  return {
    plan: planData,
    samples,
    strata: strataData
  };
}

/**
 * Delete sampling plan and all related data
 */
export async function deleteSamplingPlan(planId: string): Promise<void> {
  const { error } = await supabase
    .from('audit_sampling_plans')
    .delete()
    .eq('id', planId);

  if (error) throw error;
  
  // Related data (samples, strata) will be deleted automatically via CASCADE
}

/**
 * Export sampling plan data
 */
export async function createSamplingExport(
  planId: string,
  exportType: 'CSV' | 'JSON' | 'PDF',
  metadata: any = {}
): Promise<string> {
  const { data, error } = await supabase
    .from('audit_sampling_exports')
    .insert({
      plan_id: planId,
      export_type: exportType,
      metadata
    })
    .select()
    .single();

  if (error) throw error;

  return data.id;
}

/**
 * Get population summary statistics
 */
export async function getPopulationSummary(
  options: PopulationOptions
): Promise<{
  totalTransactions: number;
  totalAmount: number;
  dateRange: { start: string; end: string };
  uniqueAccounts: number;
}> {
  let query = supabase
    .from('general_ledger_transactions')
    .select(`
      id,
      transaction_date,
      debit_amount,
      credit_amount,
      client_chart_of_accounts!inner(account_number)
    `)
    .eq('client_id', options.clientId)
    .gte('transaction_date', `${options.fiscalYear}-01-01`)
    .lte('transaction_date', `${options.fiscalYear}-12-31`);

  if (options.versionId) {
    query = query.eq('version_id', options.versionId);
  }

  if (options.excludedAccountNumbers && options.excludedAccountNumbers.length > 0) {
    query = query.not('client_chart_of_accounts.account_number', 'in', `(${options.excludedAccountNumbers.join(',')})`);
  }

  const { data, error } = await query;

  if (error) throw error;

  const transactions = data || [];
  const uniqueAccounts = new Set(transactions.map(tx => tx.client_chart_of_accounts.account_number)).size;
  const amounts = transactions.map(tx => tx.debit_amount || -(tx.credit_amount || 0));
  const totalAmount = amounts.reduce((sum, amount) => sum + Math.abs(amount), 0);
  const dates = transactions.map(tx => tx.transaction_date).filter(Boolean);

  return {
    totalTransactions: transactions.length,
    totalAmount,
    dateRange: {
      start: dates.length > 0 ? Math.min(...dates.map(d => new Date(d).getTime())).toString() : '',
      end: dates.length > 0 ? Math.max(...dates.map(d => new Date(d).getTime())).toString() : ''
    },
    uniqueAccounts
  };
}