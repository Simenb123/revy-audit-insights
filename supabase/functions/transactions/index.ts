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
        (COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0)) as net_amount,
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

    // Calculate totals using SQL aggregation (much faster than client-side loops)
    let totalsQuery = supabase
      .from('general_ledger_transactions')
      .select(`
        sum(COALESCE(debit_amount, 0))::numeric as total_debit,
        sum(COALESCE(credit_amount, 0))::numeric as total_credit,
        sum(COALESCE(balance_amount, 0))::numeric as total_balance,
        sum(COALESCE(debit_amount, 0) - COALESCE(credit_amount, 0))::numeric as total_net,
        count(*)::integer as total_count
      `)
      .eq('client_id', clientId);

    // Apply the same filters as the main query
    if (startDate) totalsQuery = totalsQuery.gte('transaction_date', startDate);
    if (endDate) totalsQuery = totalsQuery.lte('transaction_date', endDate);
    if (startAccount) totalsQuery = totalsQuery.gte('account_number', startAccount);
    if (endAccount) totalsQuery = totalsQuery.lte('account_number', endAccount);

    const { data: totalsData, error: totalsError } = await totalsQuery.single();

    if (totalsError) {
      console.error('Error calculating totals:', totalsError);
      return new Response(JSON.stringify({ error: totalsError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Server-calculated totals (no client-side loops)
    const totals = {
      totalDebit: parseFloat((totalsData as any)?.total_debit || '0'),
      totalCredit: parseFloat((totalsData as any)?.total_credit || '0'),
      totalBalance: parseFloat((totalsData as any)?.total_balance || '0'),
      totalNet: parseFloat((totalsData as any)?.total_net || '0'),
      totalCount: parseInt((totalsData as any)?.total_count || '0', 10)
    };

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
