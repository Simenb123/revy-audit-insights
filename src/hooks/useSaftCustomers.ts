import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SaftCustomer {
  id: string;
  customer_id: string;
  customer_name: string;
  vat_number: string;
  country: string;
  city: string;
  postal_code: string;
  street_address: string;
  customer_type: string;
  customer_status: string;
  balance_account: string;
  balance_account_id: string;
  opening_debit_balance: number;
  opening_credit_balance: number;
  closing_debit_balance: number;
  closing_credit_balance: number;
  opening_balance_netto: number;
  closing_balance_netto: number;
  payment_terms_days: number;
  payment_terms_months: number;
  created_at: string;
  updated_at: string;
}

export const useSaftCustomers = (clientId?: string, importSessionId?: string) => {
  return useQuery({
    queryKey: ['saft-customers', clientId, importSessionId],
    queryFn: async () => {
      if (!clientId) return [];

      let query = supabase
        .from('saft_customers')
        .select('*')
        .eq('client_id', clientId)
        .order('customer_name', { ascending: true });

      if (importSessionId) {
        query = query.eq('import_session_id', importSessionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SaftCustomer[];
    },
    enabled: !!clientId,
  });
};

export const useSaftCustomerAgedAnalysis = (clientId?: string, importSessionId?: string) => {
  return useQuery({
    queryKey: ['saft-customer-aged-analysis', clientId, importSessionId],
    queryFn: async () => {
      if (!clientId) return [];

      // Fallback to basic customer data since stored procedures don't exist yet
      const { data: customers, error } = await supabase
        .from('saft_customers')
        .select('*')
        .eq('client_id', clientId)
        .order('customer_name', { ascending: true });
      
      if (error) throw error;
      
      return customers?.map(customer => ({
        customer_id: customer.customer_id,
        customer_name: customer.customer_name,
        not_due: 0,
        days_0_30: 0,
        days_31_60: 0,
        days_61_90: 0,
        days_91_plus: 0,
        total_outstanding: customer.closing_balance_netto || 0,
      })) || [];
    },
    enabled: !!clientId,
  });
};