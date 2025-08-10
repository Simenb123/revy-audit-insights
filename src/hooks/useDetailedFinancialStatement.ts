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

    // Stable sibling sort: display_order, then numeric standard_number, then alphanumeric
    const sortSiblings = (arr: DetailedStatementLine[]) =>
      arr.sort((a, b) => {
        // Primary: display order (undefined treated as 0)
        const byOrder = (a.display_order ?? 0) - (b.display_order ?? 0);
        if (byOrder !== 0) return byOrder;
        // Secondary: numeric standard number when possible (supports decimals)
        const aNum = parseFloat(String(a.standard_number));
        const bNum = parseFloat(String(b.standard_number));
        if (!Number.isNaN(aNum) && !Number.isNaN(bNum) && aNum !== bNum) return aNum - bNum;
        // Tertiary: alphanumeric compare
        return String(a.standard_number).localeCompare(String(b.standard_number));
      });

    const sortTree = (nodes: DetailedStatementLine[]) => {
      sortSiblings(nodes);
      for (const n of nodes) {
        if (n.children && n.children.length) sortTree(n.children);
      }
    };

    sortTree(roots);

    // Dev-only check for presence and order of key lines
    if (import.meta.env?.DEV) {
      try {
        const flatRoots = roots.map(r => ({
          num: String(r.standard_number),
          name: r.standard_name,
          order: r.display_order,
          type: r.line_type,
          total: r.is_total_line
        }));
        // eslint-disable-next-line no-console
        console.debug('[useDetailedFinancialStatement] root order (first 20):', flatRoots.slice(0, 20));
        const findByNum = (nodes: DetailedStatementLine[], target: string): DetailedStatementLine | undefined => {
          for (const n of nodes) {
            if (String(n.standard_number) === target) return n;
            const found = n.children ? findByNum(n.children, target) : undefined;
            if (found) return found;
          }
          return undefined;
        };
        const l20 = findByNum(roots, '20');
        // eslint-disable-next-line no-console
        console.debug('[useDetailedFinancialStatement] check line 20', {
          exists: !!l20,
          name: l20?.standard_name,
          is_total: l20?.is_total_line,
          line_type: l20?.line_type,
        });
      } catch {}
    }

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
