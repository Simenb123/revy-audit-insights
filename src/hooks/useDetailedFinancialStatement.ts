import { useMemo } from 'react';
import { useFirmStandardAccounts, type FirmStandardAccount } from '@/hooks/useFirmStandardAccounts';
import { useTrialBalanceData } from '@/hooks/useTrialBalanceData';
import { useTrialBalanceMappings, type TrialBalanceMapping } from '@/hooks/useTrialBalanceMappings';

export interface DetailedStatementLine {
  id: string;
  standard_number: string;
  standard_name: string;
  account_type: string;
  display_order: number;
  line_type: string;
  parent_line_id?: string;
  calculation_formula?: any;
  is_total_line: boolean;
  sign_multiplier: number;
  children?: DetailedStatementLine[];
  amount?: number;
  previous_amount?: number;
}

export interface DetailedFinancialStatementResult {
  incomeStatement: DetailedStatementLine[];
  balanceStatement: DetailedStatementLine[];
  periodInfo: {
    clientId: string;
    currentYear?: number;
    previousYear?: number;
    periodStart?: string;
    periodEnd?: string;
  } | null;
  isLoading: boolean;
}

export function useDetailedFinancialStatement(clientId: string, selectedVersion?: string): DetailedFinancialStatementResult {
  const { data: firmAccounts = [] } = useFirmStandardAccounts();
  const { data: trialBalance } = useTrialBalanceData(clientId, selectedVersion);
  const { data: mappings = [] } = useTrialBalanceMappings(clientId);

  // Derive current year from TB and fetch previous year TB
  const currentYear = trialBalance?.[0]?.period_year as number | undefined;
  const { data: previousTrialBalance } = useTrialBalanceData(
    clientId,
    undefined,
    currentYear ? currentYear - 1 : undefined
  );

  const buildLines = (accounts: FirmStandardAccount[]): DetailedStatementLine[] => {
    const lines: DetailedStatementLine[] = accounts
      .map((account) => ({
        id: account.id,
        standard_number: String(account.standard_number),
        standard_name: account.standard_name,
        account_type: account.account_type,
        display_order: account.display_order || 0,
        line_type: account.line_type,
        parent_line_id: account.parent_line_id || undefined,
        calculation_formula: account.calculation_formula,
        is_total_line: account.is_total_line,
        sign_multiplier: account.sign_multiplier,
        children: [] as DetailedStatementLine[],
      }))
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

    const map = new Map(lines.map((l) => [l.id, l] as const));
    const roots: DetailedStatementLine[] = [];
    lines.forEach((l) => {
      if (l.parent_line_id && map.has(l.parent_line_id)) {
        map.get(l.parent_line_id)!.children!.push(l);
      } else {
        roots.push(l);
      }
    });
    return roots;
  };

  const computeAmount = (
    line: DetailedStatementLine,
    opts: { isPrevious?: boolean; tbNow?: any[] | null; tbPrev?: any[] | null; mappings: TrialBalanceMapping[] }
  ): number => {
    const source = opts.isPrevious ? opts.tbPrev : opts.tbNow;
    if (!source) return 0;

    // Calculation/subtotal via simple terms support, else sum children, else detail via mappings
    if ((line.line_type === 'calculation' || line.line_type === 'subtotal') && line.calculation_formula) {
      const formula = line.calculation_formula;
      if (typeof formula === 'object' && Array.isArray(formula.terms)) {
        let res = 0;
        for (const term of formula.terms) {
          const refNum = String(term.account_number);
          const relevant = opts.mappings.filter((m) => m.statement_line_number === refNum);
          const sum = relevant.reduce((acc, m) => {
            const tbRow = source.find((tb: any) => tb.account_number === m.account_number);
            return acc + (tbRow ? tbRow.closing_balance || 0 : 0);
          }, 0);
          res = term.operator === '-' ? res - sum : res + sum;
        }
        return res * (line.sign_multiplier ?? 1);
      }
      // Fallback: not evaluating string formulas here to avoid duplication; treat as 0
      return 0;
    }

    if (line.children && line.children.length > 0) {
      return line.children.reduce((acc, child) => acc + computeAmount(child, opts), 0);
    }

    const relevant = opts.mappings.filter((m) => m.statement_line_number === line.standard_number);
    const amount = relevant.reduce((acc, m) => {
      const tbRow = source.find((tb: any) => tb.account_number === m.account_number);
      return acc + (tbRow ? tbRow.closing_balance || 0 : 0);
    }, 0);
    return amount * (line.sign_multiplier ?? 1);
  };

  const { incomeStatement, balanceStatement } = useMemo(() => {
    if (!firmAccounts || !trialBalance || !mappings) {
      return { incomeStatement: [] as DetailedStatementLine[], balanceStatement: [] as DetailedStatementLine[] };
    }

    const incomeAccounts = firmAccounts.filter((a: FirmStandardAccount) => a.account_type === 'resultat');
    const balanceAccounts = firmAccounts.filter((a: FirmStandardAccount) => a.account_type !== 'resultat');

    const incomeRoots = buildLines(incomeAccounts);
    const balanceRoots = buildLines(balanceAccounts);

    const traverse = (node: DetailedStatementLine) => {
      if (node.children && node.children.length > 0) node.children.forEach(traverse);
      node.amount = computeAmount(node, { isPrevious: false, tbNow: trialBalance, tbPrev: previousTrialBalance, mappings });
      node.previous_amount = computeAmount(node, { isPrevious: true, tbNow: trialBalance, tbPrev: previousTrialBalance, mappings });
    };

    incomeRoots.forEach(traverse);
    balanceRoots.forEach(traverse);

    return { incomeStatement: incomeRoots, balanceStatement: balanceRoots };
  }, [firmAccounts, trialBalance, previousTrialBalance, mappings]);

  const periodInfo = useMemo(() => {
    if (!trialBalance || trialBalance.length === 0) return null;
    const first = trialBalance[0];
    return {
      clientId,
      currentYear: first.period_year,
      previousYear: first.period_year - 1,
      periodStart: first.period_start_date,
      periodEnd: first.period_end_date,
    };
  }, [clientId, trialBalance]);

  return {
    incomeStatement,
    balanceStatement,
    periodInfo,
    isLoading: !firmAccounts || !trialBalance || !mappings,
  };
}
