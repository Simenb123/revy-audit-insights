import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SamplingRequest {
  clientId: string;
  versionId?: string;
  method: 'random' | 'stratified' | 'monetary';
  params: {
    sampleSize?: number;
    coverageTarget?: number;
    threshold?: number;
  };
  accountFilter?: string;
}

interface Transaction {
  id: string;
  transaction_date: string;
  debit_amount: number | null;
  credit_amount: number | null;
  description: string;
  voucher_number: string;
  account_number: string;
  account_name: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { clientId, versionId, method, params, accountFilter }: SamplingRequest = await req.json();

    console.log('Transaction sampling request:', { clientId, versionId, method, params, accountFilter });

    // If no versionId provided, try to get the active version
    let finalVersionId = versionId;
    if (!finalVersionId) {
      console.log('No versionId provided, fetching active version...');
      const { data: activeVersion, error: versionError } = await supabase
        .from('accounting_data_versions')
        .select('id, file_name, version_number')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!versionError && activeVersion) {
        finalVersionId = activeVersion.id;
        console.log('Using active version:', finalVersionId);
      } else {
        console.log('No active version found, using latest version...');
        // Fallback to most recent version
        const { data: latestVersion, error: latestError } = await supabase
          .from('accounting_data_versions')
          .select('id')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!latestError && latestVersion) {
          finalVersionId = latestVersion.id;
          console.log('Using latest version:', finalVersionId);
        }
      }
    }

    // Get transaction data
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
      .eq('client_id', clientId);

    // Always filter by version to ensure data consistency
    if (finalVersionId) {
      query = query.eq('version_id', finalVersionId);
      console.log('Filtering transactions by version:', finalVersionId);
    } else {
      console.warn('No version found - this may include all transaction data');
    }

    if (accountFilter) {
      query = query.eq('client_chart_of_accounts.account_number', accountFilter);
    }

    const { data: transactions, error } = await query.order('transaction_date');

    if (error) {
      throw error;
    }

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Ingen transaksjoner funnet for utvalg',
          transactions: [],
          summary: {
            totalCount: 0,
            sampledCount: 0,
            totalAmount: 0,
            sampledAmount: 0,
            coverage: 0
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Transform data for easier processing
    const processedTransactions: Transaction[] = transactions.map(tx => ({
      id: tx.id,
      transaction_date: tx.transaction_date,
      debit_amount: tx.debit_amount,
      credit_amount: tx.credit_amount,
      description: tx.description,
      voucher_number: tx.voucher_number,
      account_number: (tx.client_chart_of_accounts as any).account_number,
      account_name: (tx.client_chart_of_accounts as any).account_name,
    }));

    console.log(`Processing ${processedTransactions.length} transactions`);

    let sampledTransactions: Transaction[] = [];

    switch (method) {
      case 'random':
        sampledTransactions = performRandomSampling(processedTransactions, params.sampleSize || 5);
        break;
      case 'stratified':
        sampledTransactions = performStratifiedSampling(processedTransactions, params.coverageTarget || 30);
        break;
      case 'monetary':
        sampledTransactions = performMonetarySampling(processedTransactions, params.threshold || 10000);
        break;
      default:
        throw new Error(`Ukjent sampling-metode: ${method}`);
    }

    // Calculate summary
    const totalAmount = processedTransactions.reduce((sum, tx) => 
      sum + Math.abs((tx.debit_amount || 0) - (tx.credit_amount || 0)), 0
    );
    const sampledAmount = sampledTransactions.reduce((sum, tx) => 
      sum + Math.abs((tx.debit_amount || 0) - (tx.credit_amount || 0)), 0
    );

    const summary = {
      totalCount: processedTransactions.length,
      sampledCount: sampledTransactions.length,
      totalAmount,
      sampledAmount,
      coverage: totalAmount > 0 ? (sampledAmount / totalAmount) * 100 : 0,
      method
    };

    console.log('Sampling completed:', summary);

    return new Response(
      JSON.stringify({
        transactions: sampledTransactions,
        summary
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Transaction sampling error:', error);
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message || 'Ukjent feil ved transaksjonsutvalg'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function performRandomSampling(transactions: Transaction[], sampleSize: number): Transaction[] {
  const shuffled = [...transactions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(sampleSize, transactions.length));
}

function performStratifiedSampling(transactions: Transaction[], coverageTarget: number): Transaction[] {
  // Sort by amount (absolute value)
  const sorted = [...transactions].sort((a, b) => {
    const amountA = Math.abs((a.debit_amount || 0) - (a.credit_amount || 0));
    const amountB = Math.abs((b.debit_amount || 0) - (b.credit_amount || 0));
    return amountB - amountA;
  });

  const totalAmount = sorted.reduce((sum, tx) => 
    sum + Math.abs((tx.debit_amount || 0) - (tx.credit_amount || 0)), 0
  );
  const targetAmount = totalAmount * (coverageTarget / 100);

  const sampled: Transaction[] = [];
  let currentAmount = 0;

  // Take highest value transactions first
  for (const tx of sorted) {
    if (currentAmount >= targetAmount) break;
    
    sampled.push(tx);
    currentAmount += Math.abs((tx.debit_amount || 0) - (tx.credit_amount || 0));
  }

  // If we haven't reached target coverage, add some random smaller transactions
  if (currentAmount < targetAmount && sampled.length < sorted.length) {
    const remaining = sorted.filter(tx => !sampled.includes(tx));
    const additionalCount = Math.min(5, remaining.length);
    const shuffledRemaining = remaining.sort(() => Math.random() - 0.5);
    sampled.push(...shuffledRemaining.slice(0, additionalCount));
  }

  return sampled;
}

function performMonetarySampling(transactions: Transaction[], threshold: number): Transaction[] {
  const sampled: Transaction[] = [];

  // Add all transactions above threshold
  const aboveThreshold = transactions.filter(tx => {
    const amount = Math.abs((tx.debit_amount || 0) - (tx.credit_amount || 0));
    return amount >= threshold;
  });
  sampled.push(...aboveThreshold);

  // Add random sample from below threshold
  const belowThreshold = transactions.filter(tx => {
    const amount = Math.abs((tx.debit_amount || 0) - (tx.credit_amount || 0));
    return amount < threshold;
  });

  if (belowThreshold.length > 0) {
    const additionalCount = Math.min(5, belowThreshold.length);
    const shuffled = belowThreshold.sort(() => Math.random() - 0.5);
    sampled.push(...shuffled.slice(0, additionalCount));
  }

  return sampled;
}