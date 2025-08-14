import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OptimizedAnalysisRequest {
  clientId: string;
  versionId: string;
  analysisTypes: string[];
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

    const { clientId, versionId, analysisTypes }: OptimizedAnalysisRequest = await req.json();

    console.log('Optimized analysis request:', { clientId, versionId, analysisTypes });

    const results: Record<string, any> = {};

    // 1. Account Distribution (SQL-optimized)
    if (analysisTypes.includes('account_distribution')) {
      const { data: accountDist, error: accountError } = await supabase.rpc('calculate_account_distribution', {
        p_client_id: clientId,
        p_version_id: versionId
      });
      
      if (accountError) {
        console.error('Account distribution error:', accountError);
      } else {
        results.account_distribution = accountDist || [];
      }
    }

    // 2. Monthly Summary (SQL-optimized)
    if (analysisTypes.includes('monthly_summary')) {
      const { data: monthlySummary, error: monthlyError } = await supabase.rpc('calculate_monthly_summary', {
        p_client_id: clientId,
        p_version_id: versionId
      });
      
      if (monthlyError) {
        console.error('Monthly summary error:', monthlyError);
      } else {
        results.monthly_summary = monthlySummary || [];
      }
    }

    // 3. Amount Statistics (SQL-optimized)
    if (analysisTypes.includes('amount_statistics')) {
      const { data: amountStats, error: amountError } = await supabase.rpc('calculate_amount_statistics', {
        p_client_id: clientId,
        p_version_id: versionId
      });
      
      if (amountError) {
        console.error('Amount statistics error:', amountError);
      } else {
        results.amount_statistics = amountStats || {};
      }
    }

    // 4. Duplicate Detection (SQL-optimized)
    if (analysisTypes.includes('duplicates')) {
      const { data: duplicates, error: dupError } = await supabase.rpc('find_duplicate_transactions', {
        p_client_id: clientId,
        p_version_id: versionId
      });
      
      if (dupError) {
        console.error('Duplicate detection error:', dupError);
      } else {
        results.duplicates = duplicates || [];
      }
    }

    // 5. Time Logic Issues (SQL-optimized)
    if (analysisTypes.includes('time_logic')) {
      const { data: timeIssues, error: timeError } = await supabase.rpc('find_time_logic_issues', {
        p_client_id: clientId,
        p_version_id: versionId
      });
      
      if (timeError) {
        console.error('Time logic error:', timeError);
      } else {
        results.time_logic = timeIssues || [];
      }
    }

    // 6. Basic Transaction Count and Date Range
    if (analysisTypes.includes('basic_info')) {
      const { data: basicInfo, error: basicError } = await supabase.rpc('get_basic_transaction_info', {
        p_client_id: clientId,
        p_version_id: versionId
      });
      
      if (basicError) {
        console.error('Basic info error:', basicError);
      } else {
        results.basic_info = basicInfo || {};
      }
    }

    console.log('Optimized analysis completed:', Object.keys(results));

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Optimized analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Feil ved optimalisert analyse'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});