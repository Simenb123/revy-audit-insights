import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface JournalEntry {
  id: string;
  client_id: string;
  voucher_number: string;
  voucher_date: string;
  description: string;
  reference_document_id?: string;
  total_amount: number;
  status: 'draft' | 'posted' | 'cancelled';
  created_by?: string;
  posted_by?: string;
  posted_at?: string;
  created_at: string;
  updated_at: string;
  journal_entry_lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  line_number: number;
  account_id: string;
  description?: string;
  debit_amount: number;
  credit_amount: number;
  vat_code?: string;
  vat_amount: number;
  account?: {
    account_number: string;
    account_name: string;
  };
}

export interface CreateJournalEntryData {
  client_id: string;
  voucher_date: string;
  description: string;
  reference_document_id?: string;
  lines: Omit<JournalEntryLine, 'id' | 'journal_entry_id'>[];
}

export const useJournalEntries = (clientId: string) => {
  return useQuery({
    queryKey: ['journal-entries', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select(`
          *,
          journal_entry_lines (
            *,
            account:client_chart_of_accounts (
              account_number,
              account_name
            )
          )
        `)
        .eq('client_id', clientId)
        .order('voucher_date', { ascending: false });

      if (error) throw error;
      return data as JournalEntry[];
    },
    enabled: !!clientId,
  });
};

export const useCreateJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateJournalEntryData) => {
      // Get next voucher number
      const voucherDate = new Date(data.voucher_date);
      const year = voucherDate.getFullYear();
      const month = voucherDate.getMonth() + 1;

      const { data: voucherNumber, error: voucherError } = await supabase
        .rpc('get_next_voucher_number', {
          p_client_id: data.client_id,
          p_year: year,
          p_month: month
        });

      if (voucherError) throw voucherError;

      // Create journal entry
      const { data: journalEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          client_id: data.client_id,
          voucher_number: voucherNumber,
          voucher_date: data.voucher_date,
          description: data.description,
          reference_document_id: data.reference_document_id,
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Create journal entry lines
      const lines = data.lines.map((line, index) => ({
        ...line,
        journal_entry_id: journalEntry.id,
        line_number: index + 1,
      }));

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines);

      if (linesError) throw linesError;

      return journalEntry;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries', data.client_id] });
      toast.success('Bilag opprettet');
    },
    onError: (error) => {
      console.error('Error creating journal entry:', error);
      toast.error('Feil ved opprettelse av bilag');
    },
  });
};

export const usePostJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      const { data, error } = await supabase
        .from('journal_entries')
        .update({
          status: 'posted',
          posted_by: (await supabase.auth.getUser()).data.user?.id,
          posted_at: new Date().toISOString(),
        })
        .eq('id', entryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries', data.client_id] });
      toast.success('Bilag postert');
    },
    onError: (error) => {
      console.error('Error posting journal entry:', error);
      toast.error('Feil ved postering av bilag');
    },
  });
};

export const useDeleteJournalEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId: string) => {
      const { data, error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries', data.client_id] });
      toast.success('Bilag slettet');
    },
    onError: (error) => {
      console.error('Error deleting journal entry:', error);
      toast.error('Feil ved sletting av bilag');
    },
  });
};