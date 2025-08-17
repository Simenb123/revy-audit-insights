import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AISuggestedPosting {
  id: string;
  document_id: string;
  client_id: string;
  suggested_entries: any[];
  confidence_score: number;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  applied_to_journal_entry_id?: string;
  created_at: string;
  updated_at: string;
  document?: {
    file_name: string;
    extracted_text?: string;
  };
}

export const useAISuggestedPostings = (documentId?: string) => {
  return useQuery({
    queryKey: ['ai-suggested-postings', documentId],
    queryFn: async () => {
      let query = supabase
        .from('ai_suggested_postings')
        .select(`
          *,
          document:client_documents_files (
            file_name,
            extracted_text
          )
        `);

      if (documentId) {
        query = query.eq('document_id', documentId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data as AISuggestedPosting[];
    },
    enabled: !!documentId,
  });
};

export const useGenerateAIPostingSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      documentId, 
      clientId 
    }: { 
      documentId: string; 
      clientId: string; 
    }) => {
      // Get document details
      const { data: document, error: docError } = await supabase
        .from('client_documents_files')
        .select('extracted_text, file_name')
        .eq('id', documentId)
        .single();

      if (docError) throw docError;

      if (!document.extracted_text) {
        throw new Error('Dokument har ikke ekstrahert tekst');
      }

      // Get chart of accounts for this client
      const { data: accounts, error: accountsError } = await supabase
        .from('client_chart_of_accounts')
        .select('id, account_number, account_name, account_type')
        .eq('client_id', clientId);

      if (accountsError) throw accountsError;

      // Call AI service to get posting suggestions
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke(
        'enhanced-document-ai', 
        {
          body: {
            document_text: document.extracted_text,
            file_name: document.file_name,
            client_id: clientId,
            variant_config: 'accounting',
            chart_of_accounts: accounts
          }
        }
      );

      if (aiError) throw aiError;

      // Store AI suggestion in database
      const { data: suggestion, error: suggestionError } = await supabase
        .from('ai_suggested_postings')
        .insert({
          document_id: documentId,
          client_id: clientId,
          suggested_entries: aiResponse.suggested_entries || [],
          confidence_score: aiResponse.confidence_score || 0.8,
          status: 'pending'
        })
        .select()
        .single();

      if (suggestionError) throw suggestionError;

      return suggestion;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggested-postings', data.document_id] });
      toast.success('AI konteringsforslag generert');
    },
    onError: (error) => {
      console.error('Error generating AI posting suggestion:', error);
      toast.error('Feil ved generering av konteringsforslag');
    },
  });
};

export const useAcceptAIPostingSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      suggestionId,
      modifications
    }: {
      suggestionId: string;
      modifications?: any[];
    }) => {
      // Get the suggestion
      const { data: suggestion, error: suggestionError } = await supabase
        .from('ai_suggested_postings')
        .select('*')
        .eq('id', suggestionId)
        .single();

      if (suggestionError) throw suggestionError;

      // Use modified entries if provided, otherwise use original suggestion
      const entriesToUse = modifications || suggestion.suggested_entries;

      // Get next voucher number
      const voucherDate = new Date();
      const year = voucherDate.getFullYear();
      const month = voucherDate.getMonth() + 1;

      const { data: voucherNumber, error: voucherError } = await supabase
        .rpc('get_next_voucher_number', {
          p_client_id: suggestion.client_id,
          p_year: year,
          p_month: month
        });

      if (voucherError) throw voucherError;

      // Create journal entry from AI suggestion
      const { data: journalEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          client_id: suggestion.client_id,
          voucher_number: voucherNumber,
          voucher_date: new Date().toISOString().split('T')[0],
          description: `AI-foreslått postering - ${Array.isArray(entriesToUse) && entriesToUse[0]?.description || 'Automatisk'}`,
          reference_document_id: suggestion.document_id,
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Create journal entry lines
      const lines = Array.isArray(entriesToUse) ? entriesToUse.map((entry: any, index: number) => ({
        journal_entry_id: journalEntry.id,
        line_number: index + 1,
        account_id: entry.account_id,
        description: entry.description,
        debit_amount: entry.debit_amount || 0,
        credit_amount: entry.credit_amount || 0,
        vat_code: entry.vat_code,
        vat_amount: entry.vat_amount || 0,
      })) : [];

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines);

      if (linesError) throw linesError;

      // Update suggestion status
      const { error: updateError } = await supabase
        .from('ai_suggested_postings')
        .update({
          status: modifications ? 'modified' : 'accepted',
          applied_to_journal_entry_id: journalEntry.id,
        })
        .eq('id', suggestionId);

      if (updateError) throw updateError;

      return { journalEntry, suggestion };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-suggested-postings'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries', data.suggestion.client_id] });
      toast.success('Konteringsforslag akseptert og bilag opprettet');
    },
    onError: (error) => {
      console.error('Error accepting AI posting suggestion:', error);
      toast.error('Feil ved akseptering av konteringsforslag');
    },
  });
};