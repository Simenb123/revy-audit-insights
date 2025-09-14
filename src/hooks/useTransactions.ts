import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface Transaction {
  id: string
  transaction_date: string
  account_number: string
  account_name: string
  description: string
  debit_amount: number | null
  credit_amount: number | null
  balance_amount: number | null
  net_amount: number | null
}

interface UseTransactionsOptions {
  page?: number
  pageSize?: number
  startDate?: string
  endDate?: string
  startAccount?: string
  endAccount?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  versionId?: string // Add version ID support
}

export function useTransactions(
  clientId: string,
  options: UseTransactionsOptions = {}
) {
  return useQuery({
    queryKey: ['transactions', clientId, options],
    enabled: !!clientId,
    queryFn: async () => {
      const { 
        page = 1, 
        pageSize = 100, 
        startDate, 
        endDate, 
        startAccount, 
        endAccount, 
        sortBy, 
        sortOrder,
        versionId
      } = options
      
      // Use optimized Supabase RPC function instead of edge function
      const { data, error } = await supabase.rpc('fetch_ledger_transactions', {
        p_client_id: clientId,
        p_version_id: versionId || null,
        p_page: page,
        p_page_size: pageSize,
        p_start_date: startDate || null,
        p_end_date: endDate || null,
        p_start_account: startAccount || null,
        p_end_account: endAccount || null,
        p_sort_by: sortBy || 'transaction_date',
        p_sort_order: sortOrder || 'asc'
      })

      if (error) throw error

      const result = data as any
      const items = (result?.data || []).map((t: any) => ({
        id: t.id,
        transaction_date: t.transaction_date,
        account_number: t.account_number || '',
        account_name: t.account_name || '',
        description: t.description,
        debit_amount: t.debit_amount,
        credit_amount: t.credit_amount,
        balance_amount: t.balance_amount,
        net_amount: t.net_amount, // Server-provided net amount
      })) as Transaction[]

      return {
        transactions: items,
        count: result?.count ?? 0,
        totals: result?.totals ?? { totalDebit: 0, totalCredit: 0, totalBalance: 0, totalNet: 0 },
        metadata: result?.metadata
      }
    },
  })
}
