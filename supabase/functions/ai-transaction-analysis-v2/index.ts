import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  clientId: string;
  dataVersionId?: string;
  sessionType: string;
  analysisConfig: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { clientId, dataVersionId, sessionType, analysisConfig }: AnalysisRequest = await req.json();

    console.log('🧠 Starting AI transaction analysis V2 for:', { clientId, dataVersionId, sessionType });

    // Create analysis session
    const { data: session, error: sessionError } = await supabaseClient
      .from('ai_analysis_sessions')
      .insert({
        client_id: clientId,
        data_version_id: dataVersionId,
        session_type: sessionType,
        status: 'running',
        analysis_config: analysisConfig,
        progress_percentage: 10
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      throw new Error(`Failed to create session: ${sessionError.message}`);
    }

    console.log('📝 Created analysis session:', session.id);

    // Update progress
    await supabaseClient
      .from('ai_analysis_sessions')
      .update({ progress_percentage: 30 })
      .eq('id', session.id);

    // Fetch comprehensive transaction data with accounts
    const { data: transactions, error: transactionError } = await supabaseClient
      .from('general_ledger_transactions')
      .select(`
        id,
        transaction_date,
        debit_amount,
        credit_amount,
        balance_amount,
        description,
        voucher_number,
        client_chart_of_accounts!inner(
          account_number,
          account_name,
          account_type
        )
      `)
      .eq('client_id', clientId)
      .eq('version_id', dataVersionId)
      .order('transaction_date', { ascending: false });

    if (transactionError) {
      console.error('Transaction fetch error:', transactionError);
      await supabaseClient
        .from('ai_analysis_sessions')
        .update({ 
          status: 'failed',
          error_message: `Failed to fetch transactions: ${transactionError.message}`
        })
        .eq('id', session.id);
      throw new Error(`Failed to fetch transactions: ${transactionError.message}`);
    }

    console.log(`📊 Found ${transactions?.length || 0} transactions for AI analysis`);

    // Update progress
    await supabaseClient
      .from('ai_analysis_sessions')
      .update({ progress_percentage: 50 })
      .eq('id', session.id);

    if (!transactions || transactions.length === 0) {
      const errorMsg = 'No transaction data found for analysis';
      await supabaseClient
        .from('ai_analysis_sessions')
        .update({ 
          status: 'failed',
          error_message: errorMsg
        })
        .eq('id', session.id);
      throw new Error(errorMsg);
    }

    // Perform comprehensive validation analysis
    const voucherGroups = new Map<string, number>();
    const voucherCounts = new Map<string, number>();
    let overallBalance = 0;
    const accountSummary = new Map<string, { debit: number; credit: number; count: number; type: string }>();

    transactions.forEach(transaction => {
      const balance = transaction.balance_amount || 0;
      const voucherNumber = transaction.voucher_number || 'NO_VOUCHER';
      const accountInfo = transaction.client_chart_of_accounts;
      
      overallBalance += balance;
      
      // Voucher validation
      const currentBalance = voucherGroups.get(voucherNumber) || 0;
      const currentCount = voucherCounts.get(voucherNumber) || 0;
      voucherGroups.set(voucherNumber, currentBalance + balance);
      voucherCounts.set(voucherNumber, currentCount + 1);

      // Account summary
      if (accountInfo) {
        const key = `${accountInfo.account_number}-${accountInfo.account_name}`;
        const existing = accountSummary.get(key) || { debit: 0, credit: 0, count: 0, type: accountInfo.account_type || 'unknown' };
        accountSummary.set(key, {
          debit: existing.debit + (transaction.debit_amount || 0),
          credit: existing.credit + (transaction.credit_amount || 0),
          count: existing.count + 1,
          type: accountInfo.account_type || 'unknown'
        });
      }
    });

    // Find validation issues
    const vouchersWithImbalance = [];
    voucherGroups.forEach((balance, voucherNumber) => {
      if (Math.abs(balance) > 0.01) {
        vouchersWithImbalance.push({
          voucherNumber,
          balance,
          transactionCount: voucherCounts.get(voucherNumber) || 0
        });
      }
    });

    // Prepare comprehensive analysis data
    const dateRange = transactions.length > 0 ? {
      start: transactions[transactions.length - 1]?.transaction_date,
      end: transactions[0]?.transaction_date
    } : null;

    const totalDebit = transactions.reduce((sum, t) => sum + (t.debit_amount || 0), 0);
    const totalCredit = transactions.reduce((sum, t) => sum + (t.credit_amount || 0), 0);
    
    const analysisData = {
      transactionSample: transactions.slice(0, 100).map(t => ({
        date: t.transaction_date,
        debit: t.debit_amount,
        credit: t.credit_amount,
        balance: t.balance_amount,
        description: t.description,
        voucher: t.voucher_number,
        account: `${t.client_chart_of_accounts?.account_number || 'N/A'} - ${t.client_chart_of_accounts?.account_name || 'Unknown'}`,
        accountType: t.client_chart_of_accounts?.account_type
      })),
      validationIssues: {
        vouchersWithImbalance,
        totalValidationErrors: vouchersWithImbalance.length,
        overallBalance: Math.round(overallBalance * 100) / 100
      },
      statistics: {
        totalTransactions: transactions.length,
        totalDebit,
        totalCredit,
        balanceDifference: totalDebit - totalCredit,
        dateRange,
        uniqueAccounts: accountSummary.size,
        uniqueVouchers: voucherGroups.size
      },
      accountSummary: Array.from(accountSummary.entries()).map(([key, data]) => ({
        account: key,
        ...data
      })).slice(0, 20)
    };

    const prompt = `You are a senior auditor conducting a comprehensive analysis of accounting transactions. 

## Transaction Data Overview:
- Total Transactions: ${transactions.length}
- Period: ${dateRange?.start} to ${dateRange?.end}
- Total Debit: ${totalDebit.toLocaleString('nb-NO', { minimumFractionDigits: 2 })} NOK
- Total Credit: ${totalCredit.toLocaleString('nb-NO', { minimumFractionDigits: 2 })} NOK
- Balance Difference: ${(totalDebit - totalCredit).toLocaleString('nb-NO', { minimumFractionDigits: 2 })} NOK

## Validation Issues Found:
- Vouchers with imbalances: ${vouchersWithImbalance.length}
- Overall balance difference: ${overallBalance.toLocaleString('nb-NO', { minimumFractionDigits: 2 })} NOK

## Sample Transactions (first 20):
${JSON.stringify(analysisData.transactionSample.slice(0, 20), null, 2)}

## Account Summary (top accounts by activity):
${JSON.stringify(analysisData.accountSummary.slice(0, 10), null, 2)}

## Specific Validation Issues:
${vouchersWithImbalance.length > 0 ? JSON.stringify(vouchersWithImbalance.slice(0, 10), null, 2) : 'No major validation issues detected'}

Please provide a professional audit analysis following the structured format. Focus on:
1. Real accounting issues and risks based on the actual data
2. Specific validation problems found (imbalanced vouchers, suspicious patterns)
3. Professional audit recommendations 
4. Risk assessment based on transaction patterns and validation results`;

    // Update progress
    await supabaseClient
      .from('ai_analysis_sessions')
      .update({ progress_percentage: 70 })
      .eq('id', session.id);

    console.log('🤖 Sending request to OpenAI...');

    // Use OpenAI Chat Completions API with structured output
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a senior Norwegian auditor with expertise in financial statement analysis, internal controls, and risk assessment. Provide professional audit insights in English using standard audit terminology.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "audit_analysis",
            schema: {
              type: "object",
              properties: {
                summary: {
                  type: "object",
                  properties: {
                    total_transactions: { type: "integer" },
                    analysis_date: { type: "string" },
                    message: { type: "string", maxLength: 500 },
                    data_version: { type: "string" },
                    key_findings: { type: "array", items: { type: "string" }, maxItems: 5 }
                  },
                  required: ["total_transactions", "analysis_date", "message"]
                },
                insights: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string" },
                      observation: { type: "string" },
                      significance: { type: "string", enum: ["high", "medium", "low"] },
                      details: { type: "string" }
                    },
                    required: ["category", "observation", "significance"]
                  },
                  maxItems: 8
                },
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      area: { type: "string" },
                      recommendation: { type: "string" },
                      priority: { type: "string", enum: ["high", "medium", "low"] },
                      reasoning: { type: "string" }
                    },
                    required: ["area", "recommendation", "priority"]
                  },
                  maxItems: 6
                },
                risk_factors: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      risk: { type: "string" },
                      description: { type: "string" },
                      likelihood: { type: "string", enum: ["high", "medium", "low"] },
                      impact: { type: "string", enum: ["high", "medium", "low"] },
                      mitigation: { type: "string" }
                    },
                    required: ["risk", "description", "likelihood", "impact"]
                  },
                  maxItems: 5
                },
                anomalies: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      description: { type: "string" },
                      severity: { type: "string", enum: ["high", "medium", "low"] },
                      count: { type: "integer" },
                      examples: { type: "array", items: { type: "string" }, maxItems: 3 }
                    },
                    required: ["type", "description", "severity"]
                  },
                  maxItems: 5
                },
                validation_results: {
                  type: "object",
                  properties: {
                    vouchers_with_imbalance: { type: "integer" },
                    overall_balance_difference: { type: "number" },
                    critical_issues: { type: "array", items: { type: "string" }, maxItems: 5 },
                    compliance_status: { type: "string", enum: ["compliant", "issues_found", "major_concerns"] }
                  },
                  required: ["vouchers_with_imbalance", "overall_balance_difference", "compliance_status"]
                },
                confidence_score: { type: "integer", minimum: 1, maximum: 10 }
              },
              required: ["summary", "insights", "recommendations", "risk_factors", "validation_results", "confidence_score"]
            }
          }
        },
        max_tokens: 2000
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      console.error('OpenAI API error:', openAIResponse.status, errorText);
      
      await supabaseClient
        .from('ai_analysis_sessions')
        .update({ 
          status: 'failed',
          error_message: `OpenAI API error: ${openAIResponse.status}`
        })
        .eq('id', session.id);
      
      throw new Error(`OpenAI API error: ${openAIResponse.status} - ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    console.log('✅ OpenAI response received');

    // Update progress
    await supabaseClient
      .from('ai_analysis_sessions')
      .update({ progress_percentage: 90 })
      .eq('id', session.id);

    let analysisResult;
    try {
      // Handle Chat Completions API output format
      const aiOutput = openAIData.choices?.[0]?.message?.content;
      if (!aiOutput) {
        throw new Error('No content in OpenAI Chat Completions API response');
      }

      // Since we use JSON schema, parse the JSON content
      try {
        analysisResult = JSON.parse(aiOutput);
      } catch (parseError) {
          console.warn('Failed to parse Chat Completions API output, creating fallback');
          analysisResult = {
            summary: {
              total_transactions: transactions.length,
              analysis_date: new Date().toISOString(),
              message: 'Analysis completed but response could not be parsed correctly',
              key_findings: ['Data format issue', 'Manual review required']
            },
            insights: [
              {
                category: 'Technical Issue',
                observation: 'AI response parsing failed',
                significance: 'medium',
                details: 'The analysis was performed but the structured response could not be processed correctly'
              }
            ],
            recommendations: [
              {
                area: 'System',
                recommendation: 'Review AI response format and retry analysis',
                priority: 'medium',
                reasoning: 'Technical parsing error prevented proper result formatting'
              }
            ],
            risk_factors: [
              {
                risk: 'Technical Analysis Error',
                description: 'Analysis system encountered a parsing error',
                likelihood: 'low',
                impact: 'medium',
                mitigation: 'Retry analysis or perform manual review'
              }
            ],
            anomalies: [],
            validation_results: {
              vouchers_with_imbalance: vouchersWithImbalance.length,
              overall_balance_difference: overallBalance,
              critical_issues: vouchersWithImbalance.length > 0 ? ['Imbalanced vouchers detected'] : [],
              compliance_status: vouchersWithImbalance.length > 0 ? 'issues_found' : 'compliant'
            },
          confidence_score: 4,
          rawResponse: String(aiOutput).substring(0, 500)
        };
      }

      // Ensure validation results are included even if AI didn't provide them
      if (!analysisResult.validation_results) {
        analysisResult.validation_results = {
          vouchers_with_imbalance: vouchersWithImbalance.length,
          overall_balance_difference: overallBalance,
          critical_issues: vouchersWithImbalance.length > 0 ? 
            [`${vouchersWithImbalance.length} vouchers with imbalances detected`] : [],
          compliance_status: vouchersWithImbalance.length > 0 ? 'issues_found' : 'compliant'
        };
      }

    } catch (error) {
      console.error('Error processing OpenAI Chat Completions API output:', error);
      console.error('Full response:', JSON.stringify(openAIData, null, 2));
      analysisResult = {
        summary: {
          total_transactions: transactions.length,
          analysis_date: new Date().toISOString(),
          message: 'AI analysis failed due to technical error',
          key_findings: ['Technical failure']
        },
        insights: [
          {
            category: 'System Error',
            observation: 'Analysis system encountered an error',
            significance: 'high',
            details: error.message
          }
        ],
        recommendations: [
          {
            area: 'System',
            recommendation: 'Retry analysis later or contact support',
            priority: 'high',
            reasoning: 'Technical error prevented analysis completion'
          }
        ],
        risk_factors: [],
        anomalies: [],
        validation_results: {
          vouchers_with_imbalance: vouchersWithImbalance.length,
          overall_balance_difference: overallBalance,
          critical_issues: ['Analysis system error'],
          compliance_status: 'major_concerns'
        },
        confidence_score: 1,
        error: error.message
      };
    }

    // Save results and complete session
    const finalResult = {
      ...analysisResult,
      metadata: {
        analysisDate: new Date().toISOString(),
        transactionCount: transactions.length,
        sessionId: session.id,
        model: 'gpt-5-mini',
        dataVersionId,
        validationData: {
          vouchersWithImbalance: vouchersWithImbalance.length,
          overallBalance,
          accountSummaryCount: accountSummary.size
        }
      }
    };

    // Save result to analysis_results_v2
    await supabaseClient
      .from('analysis_results_v2')
      .insert({
        session_id: session.id,
        analysis_type: sessionType,
        result_data: finalResult,
        confidence_score: analysisResult.confidence_score || 0
      });

    // Complete session
    await supabaseClient
      .from('ai_analysis_sessions')
      .update({ 
        status: 'completed',
        progress_percentage: 100,
        result_data: finalResult,
        completed_at: new Date().toISOString()
      })
      .eq('id', session.id);

    console.log('🎯 AI analysis V2 completed successfully');

    return new Response(JSON.stringify({
      sessionId: session.id,
      status: 'completed',
      result: finalResult
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ AI transaction analysis V2 failed:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      status: 'failed',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});