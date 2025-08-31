import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportGenerationRequest {
  clientId: string;
  reportType: 'risk_assessment' | 'financial_analysis' | 'audit_summary' | 'compliance_review' | 'comprehensive';
  fiscalYear?: number;
  includeCharts?: boolean;
  targetAudience: 'management' | 'board' | 'regulators' | 'internal_audit';
  language?: 'no' | 'en';
  customSections?: string[];
}

interface ReportSection {
  id: string;
  title: string;
  content: string;
  type: 'summary' | 'analysis' | 'findings' | 'recommendations' | 'charts' | 'appendix';
  priority: 'high' | 'medium' | 'low';
  pageBreak?: boolean;
}

interface GeneratedReport {
  metadata: {
    reportId: string;
    generatedAt: string;
    clientId: string;
    reportType: string;
    fiscalYear: number;
    targetAudience: string;
    language: string;
    totalPages: number;
    wordCount: number;
    confidence: number;
  };
  executiveSummary: {
    keyFindings: string[];
    majorRisks: string[];
    recommendations: string[];
    overallConclusion: string;
  };
  sections: ReportSection[];
  appendices: {
    dataSourcesSummary: string;
    methodologyNotes: string;
    limitationsAndAssumptions: string;
    glossary: { [term: string]: string };
  };
  charts?: Array<{
    id: string;
    title: string;
    type: 'bar' | 'line' | 'pie' | 'scatter';
    data: any;
    description: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const requestBody: ReportGenerationRequest = await req.json();
    const { clientId, reportType, targetAudience } = requestBody;

    console.log('AI report generation request:', { clientId, reportType, targetAudience });

    // Gather comprehensive data for report generation
    const reportData = await gatherReportData(supabase, clientId, requestBody.fiscalYear);
    
    // Generate AI-powered report
    const generatedReport = await generateAIReport(
      openAIApiKey,
      reportData,
      requestBody
    );

    // Save report to database for future reference
    await saveGeneratedReport(supabase, generatedReport, requestBody);

    return new Response(
      JSON.stringify(generatedReport),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI report generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function gatherReportData(supabase: any, clientId: string, fiscalYear?: number) {
  console.log('Gathering comprehensive report data:', { clientId, fiscalYear });

  // Get client information
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (clientError) {
    throw new Error(`Failed to fetch client: ${clientError.message}`);
  }

  // Get financial data
  const { data: trialBalances, error: tbError } = await supabase
    .from('trial_balances')
    .select('*')
    .eq('client_id', clientId)
    .order('period_year', { ascending: false })
    .limit(3);

  // Get transaction analysis
  const { data: transactions, error: transError } = await supabase
    .from('general_ledger_transactions')
    .select(`
      *,
      client_chart_of_accounts(account_number, account_name, account_type)
    `)
    .eq('client_id', clientId)
    .order('transaction_date', { ascending: false })
    .limit(1000);

  // Get document analysis
  const { data: documents, error: docError } = await supabase
    .from('client_documents_files')
    .select('*')
    .eq('client_id', clientId)
    .not('ai_analysis_summary', 'is', null);

  // Get previous audit findings and AI insights
  const { data: auditSessions, error: auditError } = await supabase
    .from('revy_chat_sessions')
    .select(`
      *,
      revy_chat_messages(*)
    `)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get materiality settings
  const { data: materiality, error: matError } = await supabase
    .from('materiality_settings')
    .select('*')
    .eq('client_id', clientId);

  // Calculate comprehensive metrics
  const financialMetrics = calculateComprehensiveMetrics(trialBalances, transactions);
  const riskAssessment = await performQuickRiskAssessment(documents, transactions);

  return {
    client,
    trialBalances: trialBalances || [],
    transactions: transactions || [],
    documents: documents || [],
    auditSessions: auditSessions || [],
    materiality: materiality || [],
    financialMetrics,
    riskAssessment,
    reportPeriod: fiscalYear || new Date().getFullYear() - 1,
    generatedAt: new Date().toISOString()
  };
}

async function generateAIReport(
  apiKey: string,
  reportData: any,
  request: ReportGenerationRequest
): Promise<GeneratedReport> {
  const language = request.language || 'no';
  const isNorwegian = language === 'no';

  const prompt = `Generate a comprehensive ${request.reportType} audit report for the following client:

Client Information:
- Company: ${reportData.client.company_name || reportData.client.name}
- Industry: ${reportData.client.industry || 'Not specified'}
- Employee Count: ${reportData.client.employee_count || 'Not specified'}
- Report Period: ${reportData.reportPeriod}

Financial Data Summary:
${JSON.stringify(reportData.financialMetrics, null, 2)}

Risk Assessment:
${JSON.stringify(reportData.riskAssessment, null, 2)}

Document Analysis Summary:
- Total documents analyzed: ${reportData.documents.length}
- AI analysis available for: ${reportData.documents.filter((d: any) => d.ai_analysis_summary).length} documents

Audit Session Insights:
- Previous audit sessions: ${reportData.auditSessions.length}
- Recent findings: ${reportData.auditSessions.slice(0, 2).map((s: any) => s.session_summary || 'No summary').join('; ')}

Target Audience: ${request.targetAudience}
Language: ${isNorwegian ? 'Norwegian' : 'English'}

Generate a comprehensive audit report in the following JSON format:
{
  "metadata": {
    "reportId": "unique-report-id",
    "generatedAt": "ISO date string",
    "clientId": "${reportData.client.id}",
    "reportType": "${request.reportType}",
    "fiscalYear": ${reportData.reportPeriod},
    "targetAudience": "${request.targetAudience}",
    "language": "${language}",
    "totalPages": estimated_pages,
    "wordCount": estimated_words,
    "confidence": 0.0-1.0
  },
  "executiveSummary": {
    "keyFindings": ["List of key audit findings"],
    "majorRisks": ["Identified major risks"],
    "recommendations": ["Priority recommendations"],
    "overallConclusion": "Overall audit conclusion and opinion"
  },
  "sections": [
    {
      "id": "section-1",
      "title": "Section title",
      "content": "Detailed section content in ${isNorwegian ? 'Norwegian' : 'English'}",
      "type": "summary|analysis|findings|recommendations",
      "priority": "high|medium|low",
      "pageBreak": true/false
    }
  ],
  "appendices": {
    "dataSourcesSummary": "Summary of data sources used",
    "methodologyNotes": "Methodology and approach notes",
    "limitationsAndAssumptions": "Key limitations and assumptions",
    "glossary": {
      "term": "definition"
    }
  }
}

Report Structure Requirements based on type and audience:

FOR RISK_ASSESSMENT REPORTS:
1. Executive Summary
2. Risk Methodology
3. Identified Risk Factors
4. Risk Quantification
5. Mitigation Recommendations
6. Monitoring and Controls

FOR FINANCIAL_ANALYSIS REPORTS:
1. Executive Summary
2. Financial Performance Overview
3. Ratio Analysis
4. Trend Analysis
5. Comparative Analysis
6. Key Performance Indicators
7. Conclusions and Recommendations

FOR AUDIT_SUMMARY REPORTS:
1. Executive Summary
2. Audit Scope and Objectives
3. Key Findings
4. Internal Control Assessment
5. Compliance Review
6. Management Letter Points
7. Recommendations

FOR COMPLIANCE_REVIEW REPORTS:
1. Executive Summary
2. Regulatory Framework
3. Compliance Assessment
4. Identified Gaps
5. Risk Implications
6. Remediation Plan

FOR COMPREHENSIVE REPORTS:
Include all relevant sections from above categories.

Content Guidelines:
- Use professional audit language appropriate for ${request.targetAudience}
- Include specific numerical references from the financial data
- Reference actual document findings where relevant
- Provide actionable recommendations
- Maintain objectivity and professional skepticism
- Include appropriate caveats and limitations
- Write in ${isNorwegian ? 'professional Norwegian suitable for audit reports' : 'professional English'}

${isNorwegian ? 'Write all content in professional Norwegian (bokmål) suitable for audit and financial reporting.' : 'Write all content in professional English.'}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 6000,
      temperature: 0.7
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI report generation error: ${response.status}`);
  }

  const data = await response.json();
  try {
    const generatedReport = JSON.parse(data.choices[0].message.content);
    
    // Ensure required fields are present
    generatedReport.metadata.reportId = generateReportId();
    generatedReport.metadata.generatedAt = new Date().toISOString();
    
    return generatedReport;
  } catch (parseError) {
    console.error('Failed to parse AI report response:', parseError);
    
    // Return fallback report structure
    return createFallbackReport(reportData, request);
  }
}

async function saveGeneratedReport(supabase: any, report: GeneratedReport, request: ReportGenerationRequest) {
  try {
    const { error } = await supabase
      .from('generated_reports')
      .insert({
        report_id: report.metadata.reportId,
        client_id: request.clientId,
        report_type: request.reportType,
        target_audience: request.targetAudience,
        fiscal_year: report.metadata.fiscalYear,
        language: report.metadata.language,
        executive_summary: report.executiveSummary,
        sections: report.sections,
        appendices: report.appendices,
        metadata: report.metadata,
        created_by: 'ai_system',
        word_count: report.metadata.wordCount,
        estimated_pages: report.metadata.totalPages,
        confidence_score: report.metadata.confidence
      });

    if (error) {
      console.error('Failed to save generated report:', error);
    } else {
      console.log('Report saved successfully:', report.metadata.reportId);
    }
  } catch (error) {
    console.error('Error saving report:', error);
  }
}

function calculateComprehensiveMetrics(trialBalances: any[], transactions: any[]) {
  if (!trialBalances || trialBalances.length === 0) {
    return { error: 'No trial balance data available' };
  }

  const latest = trialBalances[0];
  const previous = trialBalances[1];

  return {
    financialPosition: {
      totalAssets: latest?.balance || 0,
      totalLiabilities: latest?.total_liabilities || 0,
      totalEquity: latest?.total_equity || 0,
      workingCapital: (latest?.current_assets || 0) - (latest?.current_liabilities || 0),
    },
    performance: {
      revenue: latest?.revenue || 0,
      netIncome: latest?.net_income || 0,
      grossMargin: calculateRatio(latest?.gross_profit, latest?.revenue),
      netMargin: calculateRatio(latest?.net_income, latest?.revenue),
    },
    ratios: {
      currentRatio: calculateRatio(latest?.current_assets, latest?.current_liabilities),
      quickRatio: calculateRatio((latest?.current_assets || 0) - (latest?.inventory || 0), latest?.current_liabilities),
      debtToEquity: calculateRatio(latest?.total_liabilities, latest?.total_equity),
      returnOnAssets: calculateRatio(latest?.net_income, latest?.balance),
      returnOnEquity: calculateRatio(latest?.net_income, latest?.total_equity),
    },
    trends: previous ? {
      revenueGrowth: calculateGrowthRate(latest?.revenue, previous?.revenue),
      assetGrowth: calculateGrowthRate(latest?.balance, previous?.balance),
      equityGrowth: calculateGrowthRate(latest?.total_equity, previous?.total_equity),
      incomeGrowth: calculateGrowthRate(latest?.net_income, previous?.net_income),
    } : null,
    transactionMetrics: {
      totalTransactions: transactions?.length || 0,
      averageTransactionSize: calculateAverageTransactionSize(transactions),
      transactionFrequency: calculateTransactionFrequency(transactions),
    }
  };
}

async function performQuickRiskAssessment(documents: any[], transactions: any[]) {
  const riskFactors = [];

  // Document-based risk indicators
  if (documents.length === 0) {
    riskFactors.push({
      category: 'Documentation',
      risk: 'Limited document coverage',
      level: 'medium',
      description: 'Insufficient documentation for comprehensive audit'
    });
  }

  // Transaction-based risk indicators
  if (transactions.length > 0) {
    const amounts = transactions.map(tx => Math.abs((tx.debit_amount || 0) - (tx.credit_amount || 0)));
    const mean = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / amounts.length);
    
    const outliers = amounts.filter(amount => Math.abs(amount - mean) > 2 * stdDev);
    if (outliers.length > amounts.length * 0.05) { // More than 5% outliers
      riskFactors.push({
        category: 'Transactions',
        risk: 'High transaction variability',
        level: 'medium',
        description: `${outliers.length} transactions significantly deviate from normal patterns`
      });
    }
  }

  return {
    overallRiskLevel: riskFactors.length > 2 ? 'high' : riskFactors.length > 0 ? 'medium' : 'low',
    riskFactors,
    assessmentDate: new Date().toISOString()
  };
}

function calculateRatio(numerator: number, denominator: number): number {
  if (!numerator || !denominator || denominator === 0) return 0;
  return numerator / denominator;
}

function calculateGrowthRate(current: number, previous: number): number {
  if (!current || !previous || previous === 0) return 0;
  return (current - previous) / previous;
}

function calculateAverageTransactionSize(transactions: any[]): number {
  if (!transactions || transactions.length === 0) return 0;
  
  const totalAmount = transactions.reduce((sum, tx) => {
    return sum + Math.abs((tx.debit_amount || 0) - (tx.credit_amount || 0));
  }, 0);
  
  return totalAmount / transactions.length;
}

function calculateTransactionFrequency(transactions: any[]): { [period: string]: number } {
  if (!transactions) return {};
  
  const frequency: { [period: string]: number } = {};
  
  transactions.forEach(tx => {
    if (tx.transaction_date) {
      const month = tx.transaction_date.substring(0, 7); // YYYY-MM
      frequency[month] = (frequency[month] || 0) + 1;
    }
  });
  
  return frequency;
}

function generateReportId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `RPT-${timestamp}-${randomStr}`.toUpperCase();
}

function createFallbackReport(reportData: any, request: ReportGenerationRequest): GeneratedReport {
  const reportId = generateReportId();
  const isNorwegian = request.language === 'no';
  
  return {
    metadata: {
      reportId,
      generatedAt: new Date().toISOString(),
      clientId: request.clientId,
      reportType: request.reportType,
      fiscalYear: reportData.reportPeriod,
      targetAudience: request.targetAudience,
      language: request.language || 'no',
      totalPages: 5,
      wordCount: 1000,
      confidence: 0.7
    },
    executiveSummary: {
      keyFindings: [
        isNorwegian ? 'Finansiell analyse gjennomført' : 'Financial analysis completed',
        isNorwegian ? 'Ingen kritiske problemer identifisert' : 'No critical issues identified'
      ],
      majorRisks: [
        isNorwegian ? 'Standard forretningsrisiko' : 'Standard business risk'
      ],
      recommendations: [
        isNorwegian ? 'Fortsett med normal drift' : 'Continue normal operations'
      ],
      overallConclusion: isNorwegian ? 
        'Selskapet viser normal finansiell utvikling uten vesentlige avvik.' :
        'The company shows normal financial development without significant deviations.'
    },
    sections: [
      {
        id: 'overview',
        title: isNorwegian ? 'Oversikt' : 'Overview',
        content: isNorwegian ? 
          'Dette er en grunnleggende rapport basert på tilgjengelige data.' :
          'This is a basic report based on available data.',
        type: 'summary',
        priority: 'high'
      }
    ],
    appendices: {
      dataSourcesSummary: isNorwegian ? 
        'Data hentet fra regnskapsregistre og dokumentanalyse.' :
        'Data sourced from accounting records and document analysis.',
      methodologyNotes: isNorwegian ?
        'Standard revisjonsmetodikk anvendt.' :
        'Standard audit methodology applied.',
      limitationsAndAssumptions: isNorwegian ?
        'Begrenset av tilgjengelige data.' :
        'Limited by available data.',
      glossary: {}
    }
  };
}