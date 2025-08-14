import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

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
  // VAT-related (optional)
  vat_code?: string | null;
  vat_rate?: number | string | null;
  vat_base?: number | null;
  vat_debit?: number | null;
  vat_credit?: number | null;
  vat_amount?: number | null;
}

export const useGeneralLedgerData = (clientId: string, versionId?: string, pagination?: { page: number; pageSize: number }, filters?: { accountNumber?: string }) => {
  return useQuery({
    queryKey: ['general-ledger-v6', clientId, versionId, pagination, filters?.accountNumber],
    queryFn: async () => {
      console.log('🔍 Fetching general ledger data for client:', clientId, 'version:', versionId);
      console.log('🔐 Auth user ID:', (await supabase.auth.getUser()).data.user?.id);
      
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
            vat_code,
            vat_rate,
            vat_base,
            vat_debit,
            vat_credit,
            reference_number,
            voucher_number,
            period_year,
            period_month,
            version_id,
            client_chart_of_accounts(
              account_number,
              account_name
            )
          `)
          .eq('client_id', clientId);

        // Optional filter by account number
        if (filters?.accountNumber) {
          query = query.eq('client_chart_of_accounts.account_number', filters.accountNumber);
        }

        // Filter by version if specified
        if (versionId) {
          query = query.eq('version_id', versionId);
        } else {
          // If no version specified, get active version data
          console.log('🔍 No version specified, finding active version...');
          const { data: activeVersion, error: versionError } = await supabase
            .from('accounting_data_versions')
            .select('id')
            .eq('client_id', clientId)
            .eq('is_active', true)
            .maybeSingle();
          
          if (versionError) {
            console.error('❌ Error finding active version:', versionError);
            // Try to get the latest version instead
            const { data: latestVersion } = await supabase
              .from('accounting_data_versions')
              .select('id')
              .eq('client_id', clientId)
              .order('version_number', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (latestVersion) {
              console.log('🔄 Using latest version instead:', latestVersion.id);
              query = query.eq('version_id', latestVersion.id);
            }
          } else if (activeVersion) {
            console.log('✅ Found active version:', activeVersion.id);
            query = query.eq('version_id', activeVersion.id);
          } else {
            console.log('⚠️ No active version found, trying latest version...');
            const { data: latestVersion } = await supabase
              .from('accounting_data_versions')
              .select('id')
              .eq('client_id', clientId)
              .order('version_number', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (latestVersion) {
              console.log('🔄 Using latest version:', latestVersion.id);
              query = query.eq('version_id', latestVersion.id);
            }
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
          // VAT fields
          vat_code: transaction.vat_code || null,
          vat_rate: transaction.vat_rate ?? null,
          vat_base: transaction.vat_base ?? null,
          vat_debit: transaction.vat_debit ?? null,
          vat_credit: transaction.vat_credit ?? null,
          vat_amount: ((transaction.vat_debit || 0) as number) - ((transaction.vat_credit || 0) as number),
          reference_number: transaction.reference_number || '',
          voucher_number: transaction.voucher_number || '',
          period_year: transaction.period_year,
          period_month: transaction.period_month,
        })) as GeneralLedgerTransaction[];

        return transformedData;
      }

      // Otherwise, use chunked loading for full data (export, validation)
      console.log('🔍 Using chunked loading to fetch ALL transactions');
      
      // Determine the version ID to use for all chunks
      let targetVersionId = versionId;
      if (!targetVersionId) {
        console.log('🔍 No version specified, finding active version for chunked loading...');
        const { data: activeVersion, error: versionError } = await supabase
          .from('accounting_data_versions')
          .select('id')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .maybeSingle();
        
        if (versionError) {
          console.error('❌ Error finding active version:', versionError);
          // Try to get the latest version instead
          const { data: latestVersion } = await supabase
            .from('accounting_data_versions')
            .select('id')
            .eq('client_id', clientId)
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          targetVersionId = latestVersion?.id;
          console.log('🔄 Using latest version for chunked loading:', targetVersionId);
        } else {
          targetVersionId = activeVersion?.id;
          console.log('✅ Using active version ID for chunked loading:', targetVersionId);
        }
      }
      
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
            vat_code,
            vat_rate,
            vat_base,
            vat_debit,
            vat_credit,
            reference_number,
            voucher_number,
            period_year,
            period_month,
            version_id,
            client_chart_of_accounts(
              account_number,
              account_name
            )
          `)
          .eq('client_id', clientId);

        // Optional filter by account number
        if (filters?.accountNumber) {
          query = query.eq('client_chart_of_accounts.account_number', filters.accountNumber);
        }

        // Filter by version if we have one
        if (targetVersionId) {
          query = query.eq('version_id', targetVersionId);
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
        logger.warn('No general ledger transactions found for client:', clientId);
        return [];
      }

      logger.info('Loaded general ledger transactions:', {
        total: allTransactions.length,
        firstDate: allTransactions[0]?.transaction_date,
        lastDate: allTransactions[allTransactions.length - 1]?.transaction_date
      });
      
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
        // VAT fields
        vat_code: transaction.vat_code || null,
        vat_rate: transaction.vat_rate ?? null,
        vat_base: transaction.vat_base ?? null,
        vat_debit: transaction.vat_debit ?? null,
        vat_credit: transaction.vat_credit ?? null,
        vat_amount: ((transaction.vat_debit || 0) as number) - ((transaction.vat_credit || 0) as number),
        reference_number: transaction.reference_number || '',
        voucher_number: transaction.voucher_number || '',
        period_year: transaction.period_year,
        period_month: transaction.period_month,
      })) as GeneralLedgerTransaction[];

      logger.debug('General Ledger processed:', {
        totalTransactions: transformedData.length,
        dateRange: transformedData.length > 0 ? {
          from: transformedData[transformedData.length - 1]?.transaction_date,
          to: transformedData[0]?.transaction_date
        } : null
      });
      
      return transformedData;
    },
    enabled: !!clientId,
    staleTime: 0, // Force fresh data to show latest transactions
    gcTime: 0, // No caching to ensure we see new data immediately
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
};