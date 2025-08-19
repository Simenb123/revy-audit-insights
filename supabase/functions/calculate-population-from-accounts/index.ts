import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      clientId, 
      fiscalYear, 
      selectedStandardNumbers = [], 
      excludedAccountNumbers = [],
      version 
    } = await req.json();

    console.log('Calculating population for:', { 
      clientId, 
      fiscalYear, 
      selectedStandardNumbers, 
      excludedAccountNumbers,
      version 
    });

    if (!clientId || !fiscalYear) {
      throw new Error('clientId and fiscalYear are required');
    }

    // Get standard accounts to map by number
    const { data: standardAccounts, error: stdError } = await supabase
      .from('standard_accounts')
      .select('id, standard_number, standard_name, category, account_type, analysis_group')
      .in('standard_number', selectedStandardNumbers);

    if (stdError) {
      console.error('Error fetching standard accounts:', stdError);
      throw stdError;
    }

    if (!standardAccounts || standardAccounts.length === 0) {
      return new Response(
        JSON.stringify({ 
          size: 0, 
          sum: 0, 
          accounts: [],
          message: 'No standard accounts found for selected numbers'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get trial balance mappings for this client
    const { data: mappingsData, error: mappingsError } = await supabase
      .from('trial_balance_mappings')
      .select('account_number, statement_line_number')
      .eq('client_id', clientId);

    if (mappingsError) {
      console.error('Error fetching trial balance mappings:', mappingsError);
      throw mappingsError;
    }

    // Get account classifications as fallback
    const { data: classificationsData, error: classificationsError } = await supabase
      .from('account_classifications')
      .select('account_number, new_category')
      .eq('client_id', clientId)
      .eq('is_active', true);

    if (classificationsError) {
      console.warn('Error fetching account classifications (continuing):', classificationsError);
    }

    // Build lookup maps
    const mappingLookup = new Map<string, string>();
    mappingsData?.forEach((mapping: any) => {
      const standardAccount = standardAccounts.find(sa => sa.standard_number === mapping.statement_line_number);
      if (standardAccount && selectedStandardNumbers.includes(standardAccount.standard_number)) {
        mappingLookup.set(mapping.account_number, standardAccount.id);
      }
    });

    // Classification lookup as fallback
    classificationsData?.forEach((classification: any) => {
      if (mappingLookup.has(classification.account_number)) return;
      
      const standardAccount = standardAccounts.find(sa => sa.standard_name === classification.new_category);
      if (standardAccount && selectedStandardNumbers.includes(standardAccount.standard_number)) {
        mappingLookup.set(classification.account_number, standardAccount.id);
      }
    });

    // Get relevant account numbers
    const relevantAccountNumbers = Array.from(mappingLookup.keys());

    if (relevantAccountNumbers.length === 0) {
      return new Response(
        JSON.stringify({ 
          size: 0, 
          sum: 0, 
          accounts: [],
          message: 'No accounts mapped to selected standard numbers'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build trial balance query
    let trialBalanceQuery = supabase
      .from('trial_balances')
      .select(`
        id,
        client_id,
        closing_balance,
        period_year,
        version,
        client_chart_of_accounts!inner(
          account_number, 
          account_name
        )
      `)
      .eq('client_id', clientId)
      .eq('period_year', fiscalYear);

    if (version) {
      trialBalanceQuery = trialBalanceQuery.eq('version', version);
    }

    const { data: trialBalanceData, error: tbError } = await trialBalanceQuery;

    if (tbError) {
      console.error('Error fetching trial balance:', tbError);
      throw tbError;
    }

    if (!trialBalanceData || trialBalanceData.length === 0) {
      return new Response(
        JSON.stringify({ 
          size: 0, 
          sum: 0, 
          accounts: [],
          message: 'No trial balance data found'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter and calculate population
    const populationAccounts = trialBalanceData
      .filter((tb: any) => {
        const accountNumber = tb.client_chart_of_accounts?.account_number;
        return accountNumber && 
               relevantAccountNumbers.includes(accountNumber) &&
               !excludedAccountNumbers.includes(accountNumber);
      })
      .map((tb: any) => ({
        id: tb.id,
        account_number: tb.client_chart_of_accounts.account_number,
        account_name: tb.client_chart_of_accounts.account_name,
        closing_balance: tb.closing_balance || 0,
        period_year: tb.period_year,
        version: tb.version
      }));

    const totalSum = populationAccounts.reduce((sum, acc) => sum + Math.abs(acc.closing_balance), 0);
    const size = populationAccounts.length;

    console.log('Population calculated:', { size, totalSum, accountsCount: populationAccounts.length });

    return new Response(
      JSON.stringify({
        size,
        sum: totalSum,
        accounts: populationAccounts,
        selectedStandardNumbers,
        excludedAccountNumbers,
        message: `Population calculated from ${selectedStandardNumbers.length} standard accounts`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-population-from-accounts function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        size: 0,
        sum: 0,
        accounts: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});