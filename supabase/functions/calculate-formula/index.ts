import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { log, error as logError } from '../_shared/log.ts'
// Rate limiter removed for Edge runtime compatibility

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

  if (body.formulaId !== undefined && body.formulaId !== null && typeof body.formulaId !== 'string') {
    throw new Error('formulaId must be a string if provided');
  }

  if (body.customFormula !== undefined && body.customFormula !== null && typeof body.customFormula !== 'string') {
    throw new Error('customFormula must be a string if provided');
  }

  const formulaId = body.formulaId ?? undefined;
  const customFormula = body.customFormula ?? undefined;

  return {
    clientId: body.clientId,
    fiscalYear: body.fiscalYear,
    formulaId,
    customFormula,
    selectedVersion: body.selectedVersion
  };
}

async function fetchStandardAccountBalances(
  supabase: any,
  clientId: string,
  fiscalYear: number,
  selectedVersion?: string
): Promise<StandardAccountBalance[]> {
  log(`Fetching account balances for client ${clientId}, fiscal year ${fiscalYear}, version ${selectedVersion || 'auto'}`);

  // 1) Fetch trial balance rows for the client/year (+ optional version)
  let tbQuery = supabase
    .from('trial_balances')
    .select(`
      id,
      client_id,
      opening_balance,
      debit_turnover,
      credit_turnover,
      closing_balance,
      period_end_date,
      period_year,
      version,
      client_chart_of_accounts!inner(account_number, account_name)
    `)
    .eq('client_id', clientId)
    .eq('period_year', fiscalYear);

  if (selectedVersion) {
    tbQuery = tbQuery.eq('version', selectedVersion);
  }

  const { data: tbRows, error: tbError } = await tbQuery;
  if (tbError) {
    logError('Error fetching trial balances:', tbError);
    throw new Error(`Failed to fetch trial balances: ${tbError.message}`);
  }
  if (!tbRows || tbRows.length === 0) {
    log(`No trial balance rows for ${clientId} ${fiscalYear}`);
    return [];
  }

  // 2) Fetch explicit mappings (preferred over classifications)
  const { data: mappings, error: mapError } = await supabase
    .from('trial_balance_mappings')
    .select('account_number, statement_line_number')
    .eq('client_id', clientId);
  if (mapError) {
    logError('Error fetching trial balance mappings:', mapError);
    throw new Error(`Failed to fetch trial balance mappings: ${mapError.message}`);
  }

  // 3) Fetch standard accounts to resolve statement_line_number -> standard_number
  const { data: standardAccounts, error: stdErr } = await supabase
    .from('standard_accounts')
    .select('id, standard_number, standard_name');
  if (stdErr) {
    logError('Error fetching standard accounts:', stdErr);
    throw new Error(`Failed to fetch standard accounts: ${stdErr.message}`);
  }

  const standardByNumber = new Map(standardAccounts?.map((sa: any) => [sa.standard_number, sa]) || []);

  // 4) Build mapping lookup by account_number
  const mappingLookup = new Map<string, { standard_number: string }>();
  mappings?.forEach((m: any) => {
    const target = standardByNumber.get(m.statement_line_number);
    if (target) {
      mappingLookup.set(m.account_number, { standard_number: target.standard_number });
    }
  });

  // 5) Aggregate balances by standard_number
  const grouped = new Map<string, number>();
  for (const row of tbRows) {
    const accountNumber = row.client_chart_of_accounts?.account_number;
    if (!accountNumber) continue;

    const map = mappingLookup.get(accountNumber);
    if (!map) continue; // skip unmapped accounts

    const key = map.standard_number;
    const prev = grouped.get(key) || 0;
    grouped.set(key, prev + (row.closing_balance || 0));
  }

  const result: StandardAccountBalance[] = Array.from(grouped.entries()).map(([standard_number, total_balance]) => ({
    standard_number,
    total_balance,
  }));

  log(`Aggregated ${result.length} standard account balances`);
  return result;
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

// -------- Custom formula evaluation (supports numbers + - * / and parentheses) --------
function getNumericStandardAmount(accounts: StandardAccountBalance[], standardNumber: string): number {
  const found = accounts.find(a => a.standard_number === standardNumber);
  return found?.total_balance ? Number(found.total_balance) : 0;
}

function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let current = '';
  const pushCurrent = () => {
    if (current.trim().length > 0) tokens.push(current.trim());
    current = '';
  };
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if ('+-*/()'.includes(ch)) {
      pushCurrent();
      tokens.push(ch);
    } else {
      current += ch;
    }
  }
  pushCurrent();
  return tokens.filter(t => t.length > 0);
}

function toRPN(tokens: string[]): string[] {
  const output: string[] = [];
  const ops: string[] = [];
  const prec: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };
  for (const t of tokens) {
    if (!isNaN(Number(t))) {
      output.push(t);
    } else if (t in prec) {
      while (ops.length && ops[ops.length - 1] in prec && prec[ops[ops.length - 1]] >= prec[t]) {
        output.push(ops.pop()!);
      }
      ops.push(t);
    } else if (t === '(') {
      ops.push(t);
    } else if (t === ')') {
      while (ops.length && ops[ops.length - 1] !== '(') output.push(ops.pop()!);
      if (ops[ops.length - 1] === '(') ops.pop();
    } else {
      // Allow bare identifiers (e.g., standard numbers like 10 treated above)
      output.push(t);
    }
  }
  while (ops.length) output.push(ops.pop()!);
  return output;
}

function evaluateRPN(rpn: string[], accounts: StandardAccountBalance[]): number {
  const stack: number[] = [];
  for (const t of rpn) {
    if (!isNaN(Number(t))) {
      stack.push(Number(t));
    } else if (t === '+' || t === '-' || t === '*' || t === '/') {
      const b = stack.pop() || 0;
      const a = stack.pop() || 0;
      switch (t) {
        case '+': stack.push(a + b); break;
        case '-': stack.push(a - b); break;
        case '*': stack.push(a * b); break;
        case '/': stack.push(b === 0 ? 0 : a / b); break;
      }
    } else {
      // Treat as a standard number reference
      const val = getNumericStandardAmount(accounts, t);
      stack.push(val);
    }
  }
  return stack.pop() || 0;
}

function evaluateCustomFormula(expr: string, accounts: StandardAccountBalance[]): number {
  const tokens = tokenize(expr.replace(/\s+/g, ''));
  const rpn = toRPN(tokens);
  return evaluateRPN(rpn, accounts);
}

async function calculateFormula(
  supabase: any,
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
      // 1) Try built-in formulas first
      const formula = HARDCODED_FORMULAS.find(f => f.name === formulaId);
      if (formula) {
        const value = evaluateFormula(formula, accounts);
        return {
          value,
          formattedValue: formatValue(value, formula.type),
          isValid: true,
          metadata: { formula: formula.formula, type: formula.type }
        };
      }

      // 2) Try database-backed formulas
      const { data: dbFormula, error: dbErr } = await supabase
        .from('formula_definitions')
        .select('id, name, formula_expression, metadata')
        .eq('id', formulaId)
        .maybeSingle();

      if (dbErr) {
        logError('Error fetching formula from DB:', dbErr);
      }

      if (dbFormula && dbFormula.formula_expression) {
        const expr: string = String(dbFormula.formula_expression);
        const value = evaluateCustomFormula(expr, accounts);
        const fType = dbFormula?.metadata?.type || 'amount';
        return {
          value,
          formattedValue: formatValue(value, fType),
          isValid: true,
          metadata: { formula: expr, type: fType, source: 'db' }
        };
      }

      return {
        value: 0,
        formattedValue: '0',
        isValid: false,
        error: `Formula '${formulaId}' not found`
      };
    }

    // Custom formula evaluation using standard numbers
    const value = evaluateCustomFormula(customFormula!, accounts);
    return {
      value,
      formattedValue: formatValue(value, 'amount'),
      isValid: true,
      metadata: { formula: customFormula }
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
      validatedInput.fiscalYear,
      validatedInput.selectedVersion
    );

    // Calculate formula
    const result = await calculateFormula(
      supabase,
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