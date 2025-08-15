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
        client_chart_of_accounts!inner(account_number, account_name)
      `, { count: 'exact' })
      .eq('client_id', clientId);

    if (startDate) query = query.gte('transaction_date', startDate);
    if (endDate) query = query.lte('transaction_date', endDate);
    if (startAccount) query = query.gte('client_chart_of_accounts.account_number', startAccount);
    if (endAccount) query = query.lte('client_chart_of_accounts.account_number', endAccount);

    // Apply server-side sorting
    if (sortBy) {
      let sortColumn = sortBy;
      let ascending = sortOrder === 'asc';
      
      // Handle account_number sorting by joining table
      if (sortBy === 'account_number') {
        sortColumn = 'client_chart_of_accounts.account_number';
      } else if (sortBy === 'account_name') {
        sortColumn = 'client_chart_of_accounts.account_name';
      }
      
      query = query.order(sortColumn, { ascending });
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

    return new Response(JSON.stringify({ data, count }), {
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
