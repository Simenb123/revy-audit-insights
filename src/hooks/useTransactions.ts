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
}

export function useTransactions(
  clientId: string,
  options: UseTransactionsOptions = {}
) {
  return useQuery({
    queryKey: ['transactions', clientId, options],
    enabled: !!clientId,
    queryFn: async () => {
      const { page = 1, pageSize = 100, startDate, endDate, startAccount, endAccount, sortBy, sortOrder } = options
      const { data, error } = await supabase.functions.invoke('transactions', {
        body: {
          clientId,
          startDate,
          endDate,
          startAccount,
          endAccount,
          page,
          pageSize,
          sortBy,
          sortOrder,
        },
      })

      if (error) throw error

      const items = (data?.data || []).map((t: any) => ({
        id: t.id,
        transaction_date: t.transaction_date,
        account_number: t.account_number || '',
        account_name: t.account_name || '',
        description: t.description,
        debit_amount: t.debit_amount,
        credit_amount: t.credit_amount,
        balance_amount: t.balance_amount ?? ((t.debit_amount || 0) as number - (t.credit_amount || 0) as number),
      })) as Transaction[]

      return {
        transactions: items,
        count: data?.count ?? 0,
        totals: data?.totals ?? { totalDebit: 0, totalCredit: 0, totalBalance: 0 },
      }
    },
  })
}
