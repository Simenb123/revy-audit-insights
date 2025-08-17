import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BankStatement {
  id: string;
  client_id: string;
  bank_account_number: string;
  statement_date: string;
  opening_balance: number;
  closing_balance: number;
  currency_code: string;
  statement_reference?: string;
  file_name?: string;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  bank_statement_id: string;
  transaction_date: string;
  value_date?: string;
  description: string;
  amount: number;
  balance_after?: number;
  reference_number?: string;
  transaction_type?: string;
  journal_entry_line_id?: string;
  reconciliation_status: 'unreconciled' | 'matched' | 'suggested' | 'manual';
  reconciled_at?: string;
  reconciled_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ReconciliationSuggestion {
  id: string;
  bank_transaction_id: string;
  journal_entry_line_id: string;
  confidence_score: number;
  match_reason?: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  decided_at?: string;
  decided_by?: string;
  bank_transaction?: BankTransaction;
  journal_entry_line?: {
    id: string;
    description?: string;
    debit_amount: number;
    credit_amount: number;
    account?: {
      account_number: string;
      account_name: string;
    };
  };
}

export interface CreateBankStatementData {
  client_id: string;
  bank_account_number: string;
  statement_date: string;
  opening_balance: number;
  closing_balance: number;
  currency_code?: string;
  statement_reference?: string;
  file_name?: string;
  transactions: Omit<BankTransaction, 'id' | 'bank_statement_id' | 'created_at' | 'updated_at'>[];
}

export const useBankStatements = (clientId: string) => {
  return useQuery({
    queryKey: ['bank-statements', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_statements')
        .select('*')
        .eq('client_id', clientId)
        .order('statement_date', { ascending: false });

      if (error) throw error;
      return data as BankStatement[];
    },
    enabled: !!clientId,
  });
};

export const useBankTransactions = (statementId: string) => {
  return useQuery({
    queryKey: ['bank-transactions', statementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_transactions')
        .select('*')
        .eq('bank_statement_id', statementId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      return data as BankTransaction[];
    },
    enabled: !!statementId,
  });
};

export const useReconciliationSuggestions = (clientId: string) => {
  return useQuery({
    queryKey: ['reconciliation-suggestions', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reconciliation_suggestions')
        .select(`
          *,
          bank_transaction:bank_transactions(*),
          journal_entry_line:journal_entry_lines(
            *,
            account:client_chart_of_accounts(
              account_number,
              account_name
            )
          )
        `)
        .eq('status', 'pending')
        .order('confidence_score', { ascending: false });

      if (error) throw error;
      return data as ReconciliationSuggestion[];
    },
    enabled: !!clientId,
  });
};

export const useCreateBankStatement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBankStatementData) => {
      // Create bank statement
      const { data: statement, error: statementError } = await supabase
        .from('bank_statements')
        .insert({
          client_id: data.client_id,
          bank_account_number: data.bank_account_number,
          statement_date: data.statement_date,
          opening_balance: data.opening_balance,
          closing_balance: data.closing_balance,
          currency_code: data.currency_code || 'NOK',
          statement_reference: data.statement_reference,
          file_name: data.file_name,
        })
        .select()
        .single();

      if (statementError) throw statementError;

      // Create bank transactions
      if (data.transactions.length > 0) {
        const transactions = data.transactions.map(transaction => ({
          ...transaction,
          bank_statement_id: statement.id,
        }));

        const { error: transactionsError } = await supabase
          .from('bank_transactions')
          .insert(transactions);

        if (transactionsError) throw transactionsError;
      }

      return statement;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bank-statements', data.client_id] });
      toast.success('Kontoutskrift opprettet');
    },
    onError: (error) => {
      console.error('Error creating bank statement:', error);
      toast.error('Feil ved opprettelse av kontoutskrift');
    },
  });
};

export const useAcceptReconciliationSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const { data, error } = await supabase
        .from('reconciliation_suggestions')
        .update({
          status: 'accepted',
          decided_at: new Date().toISOString(),
        })
        .eq('id', suggestionId)
        .select('bank_transaction_id, journal_entry_line_id')
        .single();

      if (error) throw error;

      // Update bank transaction to mark as matched
      const { error: updateError } = await supabase
        .from('bank_transactions')
        .update({
          reconciliation_status: 'matched',
          journal_entry_line_id: data.journal_entry_line_id,
          reconciled_at: new Date().toISOString(),
        })
        .eq('id', data.bank_transaction_id);

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['bank-transactions'] });
      toast.success('Avstemming godkjent');
    },
    onError: (error) => {
      console.error('Error accepting suggestion:', error);
      toast.error('Feil ved godkjenning av avstemming');
    },
  });
};

export const useRejectReconciliationSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (suggestionId: string) => {
      const { data, error } = await supabase
        .from('reconciliation_suggestions')
        .update({
          status: 'rejected',
          decided_at: new Date().toISOString(),
        })
        .eq('id', suggestionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reconciliation-suggestions'] });
      toast.success('Avstemming avvist');
    },
    onError: (error) => {
      console.error('Error rejecting suggestion:', error);
      toast.error('Feil ved avvisning av avstemming');
    },
  });
};