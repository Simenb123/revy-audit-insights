import { getSupabase } from '../_shared/supabaseClient.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabase(req);
    const body = await req.json();
    const {
      clientId,
      startDate,
      endDate,
      startAccount,
      endAccount,
      page = 1,
      pageSize = 100,
      sortBy,
      sortOrder = 'asc'
    } = body;

    const offset = (page - 1) * pageSize;

    let query = supabase
      .from('general_ledger_transactions')
      .select(`
        id,
        transaction_date,
        description,
        debit_amount,
        credit_amount,
        balance_amount,
        voucher_number,
        account_number,
        account_name
      `, { count: 'exact' })
      .eq('client_id', clientId);

    if (startDate) query = query.gte('transaction_date', startDate);
    if (endDate) query = query.lte('transaction_date', endDate);
    if (startAccount) query = query.gte('account_number', startAccount);
    if (endAccount) query = query.lte('account_number', endAccount);

    // Apply server-side sorting - now all fields are directly sortable
    if (sortBy) {
      let ascending = sortOrder === 'asc';
      query = query.order(sortBy, { ascending });
    } else {
      // Default sort by transaction_date
      query = query.order('transaction_date', { ascending: true });
    }

    const { data, error, count } = await query
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error('Error fetching transactions:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate totals for all transactions matching the filters (not just the page)
    let totalsQuery = supabase
      .from('general_ledger_transactions')
      .select('debit_amount, credit_amount, balance_amount')
      .eq('client_id', clientId);

    // Apply the same filters as the main query
    if (startDate) totalsQuery = totalsQuery.gte('transaction_date', startDate);
    if (endDate) totalsQuery = totalsQuery.lte('transaction_date', endDate);
    if (startAccount) totalsQuery = totalsQuery.gte('account_number', startAccount);
    if (endAccount) totalsQuery = totalsQuery.lte('account_number', endAccount);

    const { data: totalsData, error: totalsError } = await totalsQuery;

    if (totalsError) {
      console.error('Error calculating totals:', totalsError);
      return new Response(JSON.stringify({ error: totalsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate the sums
    const totals = totalsData.reduce((acc, transaction) => {
      acc.totalDebit += transaction.debit_amount || 0;
      acc.totalCredit += transaction.credit_amount || 0;
      acc.totalBalance += transaction.balance_amount || 0;
      return acc;
    }, { totalDebit: 0, totalCredit: 0, totalBalance: 0 });

    return new Response(JSON.stringify({ data, count, totals }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('transactions function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
