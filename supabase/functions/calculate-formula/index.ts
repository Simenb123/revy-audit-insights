import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { log, error as logError } from '../_shared/log.ts'
import { enforceRateLimit, getRateLimitId } from '../_shared/rateLimiter.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FormulaCalculationRequest {
  clientId: string;
  fiscalYear: number;
  formulaId?: string;
  customFormula?: string;
  selectedVersion?: string;
}

interface FormulaCalculationResult {
  value: number;
  formattedValue: string;
  isValid: boolean;
  error?: string;
  metadata?: any;
}

interface StandardAccountBalance {
  standard_number: string;
  total_balance: number;
}

interface FormulaCalculation {
  name: string;
  formula: string;
  type: 'percentage' | 'ratio' | 'amount';
}

const HARDCODED_FORMULAS: FormulaCalculation[] = [
  {
    name: 'liquidity_ratio',
    formula: '(Current Assets) / (Current Liabilities)',
    type: 'ratio'
  },
  {
    name: 'equity_ratio', 
    formula: '(Total Equity / Total Assets) * 100',
    type: 'percentage'
  },
  {
    name: 'profit_margin',
    formula: '(Operating Result / Revenue) * 100', 
    type: 'percentage'
  },
  {
    name: 'operating_result',
    formula: 'Revenue - Operating Expenses',
    type: 'amount'
  }
];

function getSupabase(req: Request) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
  if (!supabaseUrl || !supabaseAnonKey) {
    logError('Supabase credentials missing: URL or anon key not set');
  } else {
    log('🔐 Initializing Supabase client');
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } }
  });
}

function validateInput(body: any): FormulaCalculationRequest {
  if (!body.clientId || typeof body.clientId !== 'string') {
    throw new Error('clientId is required and must be a string');
  }
  
  if (!body.fiscalYear || typeof body.fiscalYear !== 'number') {
    throw new Error('fiscalYear is required and must be a number');
  }

  if (body.formulaId && typeof body.formulaId !== 'string') {
    throw new Error('formulaId must be a string if provided');
  }

  if (body.customFormula && typeof body.customFormula !== 'string') {
    throw new Error('customFormula must be a string if provided');
  }

  return {
    clientId: body.clientId,
    fiscalYear: body.fiscalYear,
    formulaId: body.formulaId,
    customFormula: body.customFormula,
    selectedVersion: body.selectedVersion
  };
}

async function fetchStandardAccountBalances(
  supabase: any, 
  clientId: string, 
  fiscalYear: number
): Promise<StandardAccountBalance[]> {
  log(`Fetching account balances for client ${clientId}, fiscal year ${fiscalYear}`);
  
  const { data, error } = await supabase
    .from('trial_balance_with_mappings')
    .select('standard_number, total_balance')
    .eq('client_id', clientId)
    .eq('fiscal_year', fiscalYear)
    .not('standard_number', 'is', null);

  if (error) {
    logError('Error fetching account balances:', error);
    throw new Error(`Failed to fetch account balances: ${error.message}`);
  }

  if (!data || data.length === 0) {
    log(`No account balances found for client ${clientId}, fiscal year ${fiscalYear}`);
    return [];
  }

  log(`Found ${data.length} account balances`);
  return data;
}

function calculatePrefixSum(accounts: StandardAccountBalance[], prefix: string): number {
  return accounts
    .filter(account => account.standard_number.startsWith(prefix))
    .reduce((sum, account) => sum + (account.total_balance || 0), 0);
}

function getBaseValues(accounts: StandardAccountBalance[]) {
  return {
    current_assets: calculatePrefixSum(accounts, '1') - calculatePrefixSum(accounts, '10'), // Omløpsmidler (1x - 10x)
    current_liabilities: calculatePrefixSum(accounts, '21') + calculatePrefixSum(accounts, '22'), // Kortsiktig gjeld (21x + 22x)
    total_assets: calculatePrefixSum(accounts, '1'), // Sum eiendeler (1x)
    total_equity: calculatePrefixSum(accounts, '20'), // Egenkapital (20x)
    revenue: Math.abs(calculatePrefixSum(accounts, '3')), // Driftsinntekter (3x)
    operating_result: Math.abs(calculatePrefixSum(accounts, '3')) - Math.abs(calculatePrefixSum(accounts, '4')) - Math.abs(calculatePrefixSum(accounts, '5')) // Driftsresultat
  };
}

function evaluateFormula(formula: FormulaCalculation, accounts: StandardAccountBalance[]): number {
  try {
    const baseValues = getBaseValues(accounts);
    
    switch (formula.name) {
      case 'liquidity_ratio':
        return baseValues.current_liabilities === 0 ? 0 : baseValues.current_assets / baseValues.current_liabilities;
      case 'equity_ratio':
        return baseValues.total_assets === 0 ? 0 : (baseValues.total_equity / baseValues.total_assets) * 100;
      case 'profit_margin':
        return baseValues.revenue === 0 ? 0 : (baseValues.operating_result / baseValues.revenue) * 100;
      case 'operating_result':
        return baseValues.operating_result;
      default:
        return 0;
    }
  } catch (error) {
    logError('Error evaluating formula:', error);
    return 0;
  }
}

function formatValue(value: number, type: string): string {
  const absValue = Math.abs(value);
  
  switch (type) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'ratio':
      return value.toFixed(2);
    case 'amount':
      return `kr ${new Intl.NumberFormat('no-NO').format(absValue)}`;
    default:
      return value.toString();
  }
}

async function calculateFormula(
  accounts: StandardAccountBalance[],
  formulaId?: string,
  customFormula?: string
): Promise<FormulaCalculationResult> {
  try {
    if (!formulaId && !customFormula) {
      return {
        value: 0,
        formattedValue: '0',
        isValid: false,
        error: 'Either formulaId or customFormula is required'
      };
    }

    if (formulaId) {
      const formula = HARDCODED_FORMULAS.find(f => f.name === formulaId);
      if (!formula) {
        return {
          value: 0,
          formattedValue: '0',
          isValid: false,
          error: `Formula '${formulaId}' not found`
        };
      }

      const value = evaluateFormula(formula, accounts);
      
      return {
        value,
        formattedValue: formatValue(value, formula.type),
        isValid: true,
        metadata: {
          formula: formula.formula,
          type: formula.type
        }
      };
    }

    // TODO: Implement custom formula evaluation
    return {
      value: 0,
      formattedValue: '0',
      isValid: false,
      error: 'Custom formula evaluation not yet implemented'
    };
  } catch (error) {
    logError('Error in calculateFormula:', error);
    return {
      value: 0,
      formattedValue: '0',
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const rateLimitId = getRateLimitId(req);
    const rateLimitResponse = await enforceRateLimit(rateLimitId, corsHeaders);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedInput = validateInput(body);

    log(`Processing formula calculation request:`, validatedInput);

    // Initialize Supabase client
    const supabase = getSupabase(req);

    // Fetch account balances
    const accounts = await fetchStandardAccountBalances(
      supabase,
      validatedInput.clientId,
      validatedInput.fiscalYear
    );

    // Calculate formula
    const result = await calculateFormula(
      accounts,
      validatedInput.formulaId,
      validatedInput.customFormula
    );

    log(`Formula calculation completed:`, {
      isValid: result.isValid,
      value: result.value,
      error: result.error
    });

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    logError('Error in calculate-formula function:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return new Response(
      JSON.stringify({ 
        value: 0,
        formattedValue: '0',
        isValid: false,
        error: errorMessage 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});