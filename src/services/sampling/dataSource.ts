import { supabase } from '@/integrations/supabase/client';
import { SamplingParams, SamplingResult, SavedSamplingPlan, SampleItem, RiskMatrix, Transaction } from './types';

/**
 * Load client transactions from database
 */
export async function loadClientTransactions(
  clientId: string,
  fiscalYear: number,
  versionId?: string
): Promise<Transaction[]> {
  let query = supabase
    .from('general_ledger_transactions')
    .select(`
      id,
      transaction_date,
      account_number,
      account_name,
      description,
      debit_amount,
      credit_amount,
      balance_amount,
      voucher_number
    `)
    .eq('client_id', clientId);

  if (versionId) {
    query = query.eq('version_id', versionId);
  }

  // Filter by fiscal year if provided
  if (fiscalYear) {
    const startDate = `${fiscalYear}-01-01`;
    const endDate = `${fiscalYear}-12-31`;
    query = query.gte('transaction_date', startDate).lte('transaction_date', endDate);
  }

  const { data, error } = await query
    .order('transaction_date', { ascending: false })
    .limit(10000); // Reasonable limit

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    transaction_date: row.transaction_date,
    account_no: row.account_number || '',
    account_name: row.account_name || '',
    description: row.description || '',
    amount: Math.abs((row.debit_amount || 0) - (row.credit_amount || 0)) || Math.abs(row.balance_amount || 0),
    voucher_number: row.voucher_number
  }));
}

/**
 * Load client chart of accounts
 */
export async function loadChartOfAccounts(clientId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('client_chart_of_accounts')
    .select('*')
    .eq('client_id', clientId)
    .order('account_number');

  if (error) throw error;
  return data || [];
}

/**
 * Save sampling plan to database
 */
export async function saveSamplingPlan(
  clientId: string,
  params: SamplingParams,
  result: SamplingResult,
  planName: string,
  notes?: string
): Promise<string> {
  const { data: planData, error: planError } = await supabase
    .from('audit_sampling_plans')
    .insert({
      client_id: clientId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
      fiscal_year: params.fiscalYear,
      test_type: result.plan.testType,
      method: result.plan.method,
      population_size: result.samples.total.length,
      population_sum: result.samples.total.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
      materiality: params.materiality,
      performance_materiality: params.performanceMateriality,
      expected_misstatement: params.expectedMisstatement,
      confidence_level: params.confidenceLevel,
      risk_level: params.riskLevel,
      tolerable_deviation_rate: params.tolerableDeviationRate,
      expected_deviation_rate: params.expectedDeviationRate,
      threshold_mode: params.thresholdMode,
      threshold_amount: params.thresholdAmount,
      confidence_factor: params.confidenceFactor,
      strata_bounds: params.strataBounds,
      min_per_stratum: params.minPerStratum,
      risk_matrix: params.riskMatrix as unknown as any,
      risk_weighting: params.riskWeighting,
      recommended_sample_size: result.plan.recommendedSampleSize,
      actual_sample_size: result.plan.actualSampleSize,
      coverage_percentage: result.plan.coveragePercentage,
      plan_name: planName,
      notes: notes,
      param_hash: result.plan.paramHash,
      seed: result.plan.seed,
      metadata: result.metadata as any
    })
    .select('id')
    .single();

  if (planError) throw planError;

  const planId = planData.id;

  // Save samples
  if (result.samples.total.length > 0) {
    const sampleInserts = result.samples.total.map(sample => ({
      plan_id: planId,
      transaction_id: sample.id,
      transaction_date: sample.transaction_date,
      account_no: sample.account_no,
      account_name: sample.account_name,
      description: sample.description,
      amount: sample.amount,
      sample_type: sample.sample_type,
      stratum_id: sample.stratum_id,
      selection_method: sample.selection_method || 'unknown',
      metadata: {
        rank: sample.rank,
        voucher_number: sample.voucher_number,
        risk_score: sample.risk_score
      }
    }));

    const { error: samplesError } = await supabase
      .from('audit_sampling_samples')
      .insert(sampleInserts);

    if (samplesError) throw samplesError;
  }

  // Save strata if applicable 
  if (result.strata && result.strata.length > 0) {
    const strataInserts = result.strata.map(stratum => ({
      plan_id: planId,
      stratum_index: stratum.index,
      lower_bound: stratum.lowerBound,
      upper_bound: stratum.upperBound,
      transaction_count: stratum.transactions.length,
      allocated_sample_size: stratum.allocatedSampleSize,
      min_sample_size: stratum.minSampleSize,
      weight_factor: stratum.weightFactor
    }));

    const { error: strataError } = await supabase
      .from('audit_sampling_strata')
      .insert(strataInserts);

    if (strataError) throw strataError;
  }

  return planId;
}

/**
 * Fetch saved sampling plans
 */
export async function fetchSamplingPlans(
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

  return (data || []).map(plan => ({
    ...plan,
    risk_matrix: plan.risk_matrix as unknown as RiskMatrix
  }));
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
    .order('created_at');

  if (samplesError) throw samplesError;

  // Fetch strata
  const { data: strataData, error: strataError } = await supabase
    .from('audit_sampling_strata')
    .select('*')
    .eq('plan_id', planId)
    .order('stratum_index');

  if (strataError) throw strataError;

  const samples: SampleItem[] = (samplesData || []).map(item => {
    const metadata = (item.metadata as any) || {};
    return {
      id: item.transaction_id,
      transaction_date: item.transaction_date,
      account_no: item.account_no,
      account_name: item.account_name,
      description: item.description,
      amount: item.amount,
      sample_type: item.sample_type as 'TARGETED' | 'RESIDUAL',
      stratum_id: item.stratum_id,
      selection_method: item.selection_method,
      rank: metadata.rank,
      voucher_number: metadata.voucher_number,  
      risk_score: metadata.risk_score
    };
  });

  return {
    plan: {
      ...planData,
      risk_matrix: planData.risk_matrix as unknown as RiskMatrix
    },
    samples,
    strata: strataData
  };
}

/**
 * Delete sampling plan and all related data
 */
export async function deleteSamplingPlan(planId: string): Promise<void> {
  // Delete samples first (foreign key constraint)
  const { error: samplesError } = await supabase
    .from('audit_sampling_samples')
    .delete()
    .eq('plan_id', planId);

  if (samplesError) throw samplesError;

  // Delete strata
  const { error: strataError } = await supabase
    .from('audit_sampling_strata')
    .delete()
    .eq('plan_id', planId);

  if (strataError) throw strataError;

  // Delete plan
  const { error: planError } = await supabase
    .from('audit_sampling_plans')
    .delete()
    .eq('id', planId);

  if (planError) throw planError;
}

/**
 * Update sampling plan metadata
 */
export async function updateSamplingPlan(
  planId: string,
  updates: Partial<Pick<SavedSamplingPlan, 'plan_name' | 'notes'>>
): Promise<void> {
  const { error } = await supabase
    .from('audit_sampling_plans')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', planId);

  if (error) throw error;
}

/**
 * Get sampling statistics for client
 */
export async function getSamplingStatistics(
  clientId: string,
  fiscalYear?: number
): Promise<{
  totalPlans: number;
  totalSamples: number;
  avgSampleSize: number;
  methodDistribution: Record<string, number>;
}> {
  let query = supabase
    .from('audit_sampling_plans')
    .select('id, method, actual_sample_size')
    .eq('client_id', clientId);

  if (fiscalYear) {
    query = query.eq('fiscal_year', fiscalYear);
  }

  const { data: plans, error } = await query;
  
  if (error) throw error;

  const totalPlans = plans?.length || 0;
  const totalSamples = plans?.reduce((sum, plan) => sum + (plan.actual_sample_size || 0), 0) || 0;
  const avgSampleSize = totalPlans > 0 ? totalSamples / totalPlans : 0;

  const methodDistribution: Record<string, number> = {};
  plans?.forEach(plan => {
    methodDistribution[plan.method] = (methodDistribution[plan.method] || 0) + 1;
  });

  return {
    totalPlans,
    totalSamples,
    avgSampleSize,
    methodDistribution
  };
}