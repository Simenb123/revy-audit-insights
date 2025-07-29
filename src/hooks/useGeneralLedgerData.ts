import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface GeneralLedgerTransaction {
  id: string;
  transaction_date: string;
  client_account_id: string;
  account_number: string;
  account_name: string;
  description: string;
  debit_amount: number | null;
  credit_amount: number | null;
  balance_amount: number | null;
  reference_number: string;
  voucher_number: string;
  period_year: number;
  period_month: number;
}

export const useGeneralLedgerData = (clientId: string, versionId?: string, pagination?: { page: number; pageSize: number }) => {
  return useQuery({
    queryKey: ['general-ledger-v5', clientId, versionId, pagination],
    queryFn: async () => {
      console.log('🔍 Fetching general ledger data for client:', clientId, 'version:', versionId);
      
      // If pagination is specified, fetch only that page
      if (pagination) {
        const { page, pageSize } = pagination;
        const offset = (page - 1) * pageSize;
        
        console.log(`📦 Fetching page ${page}, ${pageSize} records, offset: ${offset}`);
        
        let query = supabase
          .from('general_ledger_transactions')
          .select(`
            id,
            transaction_date,
            client_account_id,
            description,
            debit_amount,
            credit_amount,
            balance_amount,
            reference_number,
            voucher_number,
            period_year,
            period_month,
            version_id,
            client_chart_of_accounts!inner(
              account_number,
              account_name
            )
          `)
          .eq('client_id', clientId);

        // Filter by version if specified
        if (versionId) {
          query = query.eq('version_id', versionId);
        } else {
          // If no version specified, get active version data
          const { data: activeVersion } = await supabase
            .from('accounting_data_versions')
            .select('id')
            .eq('client_id', clientId)
            .eq('is_active', true)
            .single();
          
          if (activeVersion) {
            query = query.eq('version_id', activeVersion.id);
          }
        }

        const { data, error } = await query
          .order('transaction_date', { ascending: false })
          .range(offset, offset + pageSize - 1);

        if (error) throw error;

        // Transform data
        const transformedData = (data || []).map((transaction: any) => ({
          id: transaction.id,
          transaction_date: transaction.transaction_date,
          client_account_id: transaction.client_account_id,
          account_number: transaction.client_chart_of_accounts?.account_number || 'Ukjent',
          account_name: transaction.client_chart_of_accounts?.account_name || 'Ukjent konto',
          description: transaction.description,
          debit_amount: transaction.debit_amount,
          credit_amount: transaction.credit_amount,
          balance_amount: transaction.balance_amount,
          reference_number: transaction.reference_number || '',
          voucher_number: transaction.voucher_number || '',
          period_year: transaction.period_year,
          period_month: transaction.period_month,
        })) as GeneralLedgerTransaction[];

        return transformedData;
      }

      // Otherwise, use chunked loading for full data (export, validation)
      console.log('🔍 Using chunked loading to fetch ALL transactions');
      
      let allTransactions: any[] = [];
      let offset = 0;
      const chunkSize = 1000;
      let hasMore = true;

      while (hasMore) {
        console.log(`📦 Fetching chunk ${Math.floor(offset / chunkSize) + 1}, offset: ${offset}`);
        
        let query = supabase
          .from('general_ledger_transactions')
          .select(`
            id,
            transaction_date,
            client_account_id,
            description,
            debit_amount,
            credit_amount,
            balance_amount,
            reference_number,
            voucher_number,
            period_year,
            period_month,
            version_id,
            client_chart_of_accounts!inner(
              account_number,
              account_name
            )
          `)
          .eq('client_id', clientId);

        // Filter by version if specified
        if (versionId) {
          query = query.eq('version_id', versionId);
        } else {
          // If no version specified, get active version data
          if (offset === 0) { // Only check once
            const { data: activeVersion } = await supabase
              .from('accounting_data_versions')
              .select('id')
              .eq('client_id', clientId)
              .eq('is_active', true)
              .single();
            
            if (activeVersion) {
              query = query.eq('version_id', activeVersion.id);
            }
          }
        }

        const { data, error } = await query
          .order('transaction_date', { ascending: false })
          .range(offset, offset + chunkSize - 1);

        if (error) {
          console.error('❌ Error fetching general ledger chunk:', error);
          throw error;
        }

        if (!data || data.length === 0) {
          console.log(`⚠️ No more transactions found at offset ${offset}`);
          hasMore = false;
          break;
        }

        console.log(`✅ Loaded chunk with ${data.length} transactions`);
        allTransactions = [...allTransactions, ...data];
        
        // If we got less than chunkSize, we've reached the end
        if (data.length < chunkSize) {
          hasMore = false;
        } else {
          offset += chunkSize;
        }
      }

      if (allTransactions.length === 0) {
        console.log('⚠️ No general ledger transactions found for client:', clientId);
        return [];
      }

      console.log('✅ TOTAL TRANSACTIONS LOADED:', allTransactions.length);
      console.log('✅ FIRST TRANSACTION:', allTransactions[0]?.transaction_date);
      console.log('✅ LAST TRANSACTION:', allTransactions[allTransactions.length - 1]?.transaction_date);
      console.log('✅ Found', allTransactions.length, 'general ledger transactions');
      
      // Transform the data to include account details
      const transformedData = allTransactions.map((transaction: any) => ({
        id: transaction.id,
        transaction_date: transaction.transaction_date,
        client_account_id: transaction.client_account_id,
        account_number: transaction.client_chart_of_accounts?.account_number || 'Ukjent',
        account_name: transaction.client_chart_of_accounts?.account_name || 'Ukjent konto',
        description: transaction.description,
        debit_amount: transaction.debit_amount,
        credit_amount: transaction.credit_amount,
        balance_amount: transaction.balance_amount,
        reference_number: transaction.reference_number || '',
        voucher_number: transaction.voucher_number || '',
        period_year: transaction.period_year,
        period_month: transaction.period_month,
      })) as GeneralLedgerTransaction[];

      console.log('📊 General Ledger Summary:', {
        totalTransactions: transformedData.length,
        dateRange: transformedData.length > 0 ? {
          from: transformedData[transformedData.length - 1]?.transaction_date,
          to: transformedData[0]?.transaction_date
        } : null
      });

      console.log('🔄 FINAL TRANSFORMED DATA LENGTH:', transformedData.length);
      
      return transformedData;
    },
    enabled: !!clientId,
    staleTime: 0, // Force fresh data
    gcTime: 0, // No caching for debugging
  });
};