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

    // 7. Use the optimized_analysis RPC as a fallback for comprehensive analysis
    if (analysisTypes.includes('comprehensive') || analysisTypes.length === 0) {
      const { data: comprehensiveAnalysis, error: comprehensiveError } = await supabase.rpc('optimized_analysis', {
        p_client_id: clientId,
        p_dataset_id: versionId
      });
      
      if (comprehensiveError) {
        console.error('Comprehensive analysis error:', comprehensiveError);
      } else {
        // Merge the comprehensive analysis results
        const analysisData = typeof comprehensiveAnalysis === 'string' 
          ? JSON.parse(comprehensiveAnalysis) 
          : comprehensiveAnalysis;
        
        if (analysisData) {
          results.comprehensive = analysisData;
          // Also populate individual analysis types if they weren't requested separately
          if (!results.account_distribution) results.account_distribution = analysisData.account_distribution || [];
          if (!results.monthly_summary) results.monthly_summary = analysisData.monthly_summary || [];
          if (!results.basic_info) results.basic_info = {
            total_transactions: analysisData.total_transactions || 0,
            date_range: analysisData.date_range || { start: null, end: null }
          };
        }
      }
    }

    console.log('Optimized analysis completed:', Object.keys(results));

    // Normalize net values to avoid missing net_amount/net across responses
    const normalizeResults = (r: Record<string, any>) => {
      try {
        if (Array.isArray(r.monthly_summary)) {
          r.monthly_summary = r.monthly_summary.map((m: any) => {
            const debit = m.debit ?? m.total_debit ?? 0;
            const credit = m.credit ?? m.total_credit ?? 0;
            const net = m.net ?? m.net_amount ?? (debit - credit);
            return {
              ...m,
              debit,
              credit,
              net,
              net_amount: m.net_amount ?? net,
            };
          });
        }
        if (Array.isArray(r.top_accounts)) {
          r.top_accounts = r.top_accounts.map((t: any) => {
            const debit = t.debit ?? t.debit_amount ?? 0;
            const credit = t.credit ?? t.credit_amount ?? 0;
            const net = t.net ?? t.net_amount ?? (debit - credit);
            return {
              ...t,
              debit_amount: t.debit_amount ?? debit,
              credit_amount: t.credit_amount ?? credit,
              net,
              net_amount: t.net_amount ?? net,
            };
          });
        }
        if (r.comprehensive) {
          const c = r.comprehensive;
          if (Array.isArray(c.monthly_summary)) {
            c.monthly_summary = c.monthly_summary.map((m: any) => {
              const debit = m.debit ?? m.total_debit ?? 0;
              const credit = m.credit ?? m.total_credit ?? 0;
              const net = m.net ?? m.net_amount ?? (debit - credit);
              return { ...m, debit, credit, net, net_amount: m.net_amount ?? net };
            });
          }
          if (Array.isArray(c.top_accounts)) {
            c.top_accounts = c.top_accounts.map((t: any) => {
              const debit = t.debit ?? t.debit_amount ?? 0;
              const credit = t.credit ?? t.credit_amount ?? 0;
              const net = t.net ?? t.net_amount ?? (debit - credit);
              return { ...t, debit_amount: t.debit_amount ?? debit, credit_amount: t.credit_amount ?? credit, net, net_amount: t.net_amount ?? net };
            });
          }
        }
      } catch (e) {
        console.error('Normalization error:', e);
      }
      return r;
    };

    const normalized = normalizeResults(results);

    return new Response(
      JSON.stringify({ results: normalized }),
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