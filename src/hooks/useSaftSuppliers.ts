import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SaftSupplier {
  id: string;
  supplier_id: string;
  supplier_name: string;
  vat_number: string;
  country: string;
  city: string;
  postal_code: string;
  street_address: string;
  supplier_type: string;
  supplier_status: string;
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

export const useSaftSuppliers = (clientId?: string, importSessionId?: string) => {
  return useQuery({
    queryKey: ['saft-suppliers', clientId, importSessionId],
    queryFn: async () => {
      if (!clientId) return [];

      let query = supabase
        .from('saft_suppliers')
        .select('*')
        .eq('client_id', clientId)
        .order('supplier_name', { ascending: true });

      if (importSessionId) {
        query = query.eq('import_session_id', importSessionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SaftSupplier[];
    },
    enabled: !!clientId,
  });
};

export const useSaftSupplierAgedAnalysis = (clientId?: string, importSessionId?: string) => {
  return useQuery({
    queryKey: ['saft-supplier-aged-analysis', clientId, importSessionId],
    queryFn: async () => {
      if (!clientId) return [];

      // Fallback to basic supplier data since stored procedures don't exist yet
      const { data: suppliers, error } = await supabase
        .from('saft_suppliers')
        .select('*')
        .eq('client_id', clientId)
        .order('supplier_name', { ascending: true });
      
      if (error) throw error;
      
      return suppliers?.map(supplier => ({
        supplier_id: supplier.supplier_id,
        supplier_name: supplier.supplier_name,
        not_due: 0,
        days_0_30: 0,
        days_31_60: 0,
        days_61_90: 0,
        days_91_plus: 0,
        total_outstanding: supplier.closing_balance_netto || 0,
      })) || [];
    },
    enabled: !!clientId,
  });
};