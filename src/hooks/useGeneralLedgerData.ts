import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { mapTransaction } from '@/utils/transactionMapping';

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

export const useGeneralLedgerData = (clientId: string, versionId?: string, pagination?: { page: number; pageSize: number }, filters?: { accountNumber?: string; sortBy?: string; sortOrder?: 'asc' | 'desc'; forceLoadAll?: boolean }) => {
  return useQuery({
    queryKey: ['general-ledger-v7', clientId, versionId, pagination, filters?.accountNumber, filters?.sortBy, filters?.sortOrder, filters?.forceLoadAll],
    queryFn: async () => {
      // Remove production logging
      
      // If pagination is specified and not forcing full load, fetch only that page
      if (pagination && !filters?.forceLoadAll) {
        const { page, pageSize } = pagination;
        const offset = (page - 1) * pageSize;
        
        // Paginated query
        
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
            account_number,
            account_name
          `)
          .eq('client_id', clientId);

        // Optional filter by account number
        if (filters?.accountNumber) {
          query = query.eq('account_number', filters.accountNumber);
        }

        // Filter by version if specified
        if (versionId) {
          query = query.eq('version_id', versionId);
        } else {
          // If no version specified, get active version data
          const { data: activeVersion, error: versionError } = await supabase
            .from('accounting_data_versions')
            .select('id')
            .eq('client_id', clientId)
            .eq('is_active', true)
            .maybeSingle();
          
          if (versionError) {
            // Try to get the latest version instead
            const { data: latestVersion } = await supabase
              .from('accounting_data_versions')
              .select('id')
              .eq('client_id', clientId)
              .order('version_number', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (latestVersion) {
              query = query.eq('version_id', latestVersion.id);
            }
          } else if (activeVersion) {
            query = query.eq('version_id', activeVersion.id);
          } else {
            // Try latest version
            const { data: latestVersion } = await supabase
              .from('accounting_data_versions')
              .select('id')
              .eq('client_id', clientId)
              .order('version_number', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (latestVersion) {
              query = query.eq('version_id', latestVersion.id);
            }
          }
        }

        // Apply server-side sorting - now all fields are directly sortable
        if (filters?.sortBy) {
          let ascending = filters.sortOrder === 'asc';
          query = query.order(filters.sortBy, { ascending });
        } else {
          // Default sort by transaction_date
          query = query.order('transaction_date', { ascending: false });
        }

        const { data, error } = await query
          .range(offset, offset + pageSize - 1);

        if (error) throw error;

        // Transform data using shared mapping function
        const transformedData = (data || []).map(mapTransaction);

        return transformedData;
      }

      // Don't start chunking if essential parameters are missing
      if (!clientId) {
        return [];
      }
      
      // Use chunked loading for full data (export, validation)
      
      // Determine the version ID to use for all chunks
      let targetVersionId = versionId;
      if (!targetVersionId) {
        const { data: activeVersion, error: versionError } = await supabase
          .from('accounting_data_versions')
          .select('id')
          .eq('client_id', clientId)
          .eq('is_active', true)
          .maybeSingle();
        
        if (versionError) {
          // Try to get the latest version instead
          const { data: latestVersion } = await supabase
            .from('accounting_data_versions')
            .select('id')
            .eq('client_id', clientId)
            .order('version_number', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          targetVersionId = latestVersion?.id;
        } else {
          targetVersionId = activeVersion?.id;
        }
      }
      
      let allTransactions: any[] = [];
      let offset = 0;
      const chunkSize = 2000; // Increased chunk size for better performance
      let hasMore = true;

      while (hasMore) {
        // Reduced pause between chunks for better performance 
        if (offset > 0) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
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
            account_number,
            account_name
          `)
          .eq('client_id', clientId);

        // Optional filter by account number
        if (filters?.accountNumber) {
          query = query.eq('account_number', filters.accountNumber);
        }

        // Filter by version if we have one
        if (targetVersionId) {
          query = query.eq('version_id', targetVersionId);
        }

        const { data, error } = await query
          .order('transaction_date', { ascending: false })
          .range(offset, offset + chunkSize - 1);

        if (error) {
          // Stop the loop on first error to avoid cascading failures
          hasMore = false;
          break;
        }

        if (!data || data.length === 0) {
          hasMore = false;
          break;
        }
        allTransactions = [...allTransactions, ...data];
        
        // If we got less than chunkSize, we've reached the end
        if (data.length < chunkSize) {
          hasMore = false;
        } else {
          offset += chunkSize;
        }
      }

      if (allTransactions.length === 0) {
        return [];
      }
      
      // Transform the data using shared mapping function
      const transformedData = allTransactions.map(mapTransaction);
      
      return transformedData;
    },
    enabled: !!clientId,
    staleTime: 60_000, // Cache for 60 seconds
    gcTime: 300_000, // Keep in cache for 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });
};