import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CounterAccountDistribution {
  account_number: string;
  account_name: string;
  transaction_count: number;
  total_amount: number;
  percentage: number;
}

export interface TransactionStatistics {
  totalTransactions: number;
  averageAmount: number;
  medianAmount: number;
  minAmount: number;
  maxAmount: number;
  standardDeviation: number;
  q1: number;
  q3: number;
  outliers: Array<{
    account_number: string;
    amount: number;
    transaction_date: string;
    description: string;
  }>;
}

export interface PopulationAnalysisData {
  counterAccountDistribution: CounterAccountDistribution[];
  transactionStatistics: TransactionStatistics;
  riskIndicators: Array<{
    type: 'unusual_counter_account' | 'large_transaction' | 'round_amount' | 'late_posting';
    account_number: string;
    description: string;
    risk_score: number;
  }>;
}

export function usePopulationAnalysis(
  clientId: string,
  fiscalYear: number,
  selectedStandardNumbers: string[],
  excludedAccountNumbers: string[],
  versionId?: string,
  analysisLevel: 'account' | 'statement_line' = 'account'
) {
  return useQuery({
    queryKey: ['population-analysis', clientId, fiscalYear, selectedStandardNumbers, excludedAccountNumbers, versionId, analysisLevel],
    queryFn: async (): Promise<PopulationAnalysisData> => {
      try {
      // If no accounts selected, return empty analysis
      if (selectedStandardNumbers.length === 0) {
        return {
          counterAccountDistribution: [],
          transactionStatistics: {
            totalTransactions: 0,
            averageAmount: 0,
            medianAmount: 0,
            minAmount: 0,
            maxAmount: 0,
            standardDeviation: 0,
            q1: 0,
            q3: 0,
            outliers: []
          },
          riskIndicators: []
        };
      }

      // Get the same account mappings as usePopulationCalculator
      const { data: mappingsData } = await supabase
        .from('trial_balance_mappings')
        .select('account_number, statement_line_number')
        .eq('client_id', clientId);

      const { data: classificationsData } = await supabase
        .from('account_classifications')
        .select('account_number, new_category')
        .eq('client_id', clientId)
        .eq('is_active', true);

      const { data: standardAccounts } = await supabase
        .from('standard_accounts')
        .select('id, standard_number, standard_name');

      // Build account mapping lookup
      const mappingLookup = new Map<string, string>();
      (mappingsData as any[])?.forEach((mapping: any) => {
        const standardAccount = (standardAccounts as any[])?.find(sa => sa.standard_number === mapping.statement_line_number);
        if (standardAccount) {
          mappingLookup.set(mapping.account_number, standardAccount.standard_number);
        }
      });

      const classificationLookup = new Map<string, string>();
      (classificationsData as any[])?.forEach((classification: any) => {
        if (mappingLookup.has(classification.account_number)) return;
        
        const standardAccount = (standardAccounts as any[])?.find(sa => sa.standard_name === classification.new_category);
        if (standardAccount) {
          classificationLookup.set(classification.account_number, standardAccount.standard_number);
        }
      });

      // Get relevant account numbers
      const relevantAccountNumbers = new Set<string>();
      for (const [accountNumber, standardNumber] of mappingLookup.entries()) {
        if (selectedStandardNumbers.includes(standardNumber)) {
          relevantAccountNumbers.add(accountNumber);
        }
      }
      for (const [accountNumber, standardNumber] of classificationLookup.entries()) {
        if (selectedStandardNumbers.includes(standardNumber)) {
          relevantAccountNumbers.add(accountNumber);
        }
      }

      // Filter out excluded accounts
      const includedAccountNumbers = Array.from(relevantAccountNumbers).filter(
        accountNumber => !excludedAccountNumbers.includes(accountNumber)
      );

      if (includedAccountNumbers.length === 0) {
        return {
          counterAccountDistribution: [],
          transactionStatistics: {
            totalTransactions: 0,
            averageAmount: 0,
            medianAmount: 0,
            minAmount: 0,
            maxAmount: 0,
            standardDeviation: 0,
            q1: 0,
            q3: 0,
            outliers: []
          },
          riskIndicators: []
        };
      }

      // Get general ledger transactions for analysis
      let transactionQuery = supabase
        .from('general_ledger_transactions')
        .select(`
          id,
          transaction_date,
          account_number,
          description,
          debit_amount,
          credit_amount,
          voucher_number
        `)
        .eq('client_id', clientId)
        .gte('transaction_date', `${fiscalYear}-01-01`)
        .lte('transaction_date', `${fiscalYear}-12-31`)
        .in('account_number', includedAccountNumbers);

      if (versionId) {
        transactionQuery = transactionQuery.eq('version_id', versionId);
      }

      const { data: transactions } = await transactionQuery;

      if (!transactions || transactions.length === 0) {
        return {
          counterAccountDistribution: [],
          transactionStatistics: {
            totalTransactions: 0,
            averageAmount: 0,
            medianAmount: 0,
            minAmount: 0,
            maxAmount: 0,
            standardDeviation: 0,
            q1: 0,
            q3: 0,
            outliers: []
          },
          riskIndicators: []
        };
      }

      // Calculate transaction amounts
      const amounts = transactions.map(t => Math.abs((t.debit_amount || 0) - (t.credit_amount || 0)));
      amounts.sort((a, b) => a - b);

      // Calculate statistics
      const totalTransactions = transactions.length;
      const sum = amounts.reduce((a, b) => a + b, 0);
      const averageAmount = sum / totalTransactions;
      const medianAmount = amounts[Math.floor(amounts.length / 2)] || 0;
      const minAmount = amounts[0] || 0;
      const maxAmount = amounts[amounts.length - 1] || 0;
      
      // Calculate standard deviation
      const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - averageAmount, 2), 0) / amounts.length;
      const standardDeviation = Math.sqrt(variance);

      // Calculate quartiles
      const q1 = amounts[Math.floor(amounts.length * 0.25)] || 0;
      const q3 = amounts[Math.floor(amounts.length * 0.75)] || 0;
      const iqr = q3 - q1;
      
      // Identify outliers (beyond 1.5 * IQR)
      const outlierThresholdLow = q1 - 1.5 * iqr;
      const outlierThresholdHigh = q3 + 1.5 * iqr;
      
      const outliers = transactions
        .filter(t => {
          const amount = Math.abs((t.debit_amount || 0) - (t.credit_amount || 0));
          return amount < outlierThresholdLow || amount > outlierThresholdHigh;
        })
        .map(t => ({
          account_number: t.account_number,
          amount: Math.abs((t.debit_amount || 0) - (t.credit_amount || 0)),
          transaction_date: t.transaction_date,
          description: t.description || 'Ingen beskrivelse'
        }))
        .slice(0, 10); // Limit to top 10 outliers

      // Get counter-account distribution by analyzing vouchers
      const voucherNumbers = [...new Set(transactions.map(t => t.voucher_number).filter(Boolean))];
      
      let counterAccountQuery = supabase
        .from('general_ledger_transactions')
        .select(`
          account_number,
          debit_amount,
          credit_amount,
          voucher_number,
          client_chart_of_accounts!inner(account_name)
        `)
        .eq('client_id', clientId)
        .in('voucher_number', voucherNumbers);

      if (versionId) {
        counterAccountQuery = counterAccountQuery.eq('version_id', versionId);
      }

      const { data: allVoucherTransactions } = await counterAccountQuery;

      // Find counter accounts (accounts in same vouchers but not in our selection)
      const counterAccountMap = new Map<string, { 
        account_name: string; 
        transaction_count: number; 
        total_amount: number; 
      }>();

      allVoucherTransactions?.forEach(t => {
        if (!includedAccountNumbers.includes(t.account_number)) {
          const amount = Math.abs((t.debit_amount || 0) - (t.credit_amount || 0));
          const existing = counterAccountMap.get(t.account_number) || { 
            account_name: t.client_chart_of_accounts?.account_name || 'Ukjent', 
            transaction_count: 0, 
            total_amount: 0 
          };
          
          counterAccountMap.set(t.account_number, {
            account_name: existing.account_name,
            transaction_count: existing.transaction_count + 1,
            total_amount: existing.total_amount + amount
          });
        }
      });

      const totalCounterAmount = Array.from(counterAccountMap.values()).reduce((sum, item) => sum + item.total_amount, 0);
      
      const counterAccountDistribution: CounterAccountDistribution[] = Array.from(counterAccountMap.entries())
        .map(([account_number, data]) => ({
          account_number,
          account_name: data.account_name,
          transaction_count: data.transaction_count,
          total_amount: data.total_amount,
          percentage: totalCounterAmount > 0 ? (data.total_amount / totalCounterAmount) * 100 : 0
        }))
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, 10); // Top 10 counter accounts

      // Generate risk indicators
      const riskIndicators: Array<{
        type: 'unusual_counter_account' | 'large_transaction' | 'round_amount' | 'late_posting';
        account_number: string;
        description: string;
        risk_score: number;
      }> = [];

      // Large transactions (top 1% by amount)
      const largeThreshold = amounts[Math.floor(amounts.length * 0.99)] || 0;
      transactions
        .filter(t => Math.abs((t.debit_amount || 0) - (t.credit_amount || 0)) >= largeThreshold)
        .forEach(t => {
          riskIndicators.push({
            type: 'large_transaction' as const,
            account_number: t.account_number,
            description: `Stor transaksjon: ${Math.abs((t.debit_amount || 0) - (t.credit_amount || 0)).toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}`,
            risk_score: 0.7
          });
        });

      // Round amounts (potential manual entries)
      transactions
        .filter(t => {
          const amount = Math.abs((t.debit_amount || 0) - (t.credit_amount || 0));
          return amount > 0 && amount % 1000 === 0 && amount >= 10000;
        })
        .slice(0, 5)
        .forEach(t => {
          riskIndicators.push({
            type: 'round_amount' as const,
            account_number: t.account_number,
            description: `Runde beløp: ${Math.abs((t.debit_amount || 0) - (t.credit_amount || 0)).toLocaleString('nb-NO', { style: 'currency', currency: 'NOK' })}`,
            risk_score: 0.5
          });
        });

      return {
        counterAccountDistribution,
        transactionStatistics: {
          totalTransactions,
          averageAmount,
          medianAmount,
          minAmount,
          maxAmount,
          standardDeviation,
          q1,
          q3,
          outliers
        },
        riskIndicators: riskIndicators.slice(0, 20) // Limit to top 20 risk indicators
      };
      } catch (error) {
        console.error('Error in population analysis:', error);
        throw new Error(
          error instanceof Error 
            ? `Feil ved populasjonsanalyse: ${error.message}` 
            : 'Ukjent feil ved populasjonsanalyse'
        );
      }
    },
    enabled: !!clientId && selectedStandardNumbers.length > 0,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });
}