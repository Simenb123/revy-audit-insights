import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PayrollMonthlySubmission {
  id: string;
  period_year: number;
  period_month: number;
  submission_data: any;
  summary_data: any;
  created_at: string;
}

export interface PayrollEmployee {
  id: string;
  employee_id: string;
  employee_data: any;
  created_at: string;
}

export interface PayrollIncomeDetail {
  id: string;
  income_type: string;
  amount: number;
  period_year: number;
  period_month: number;
  details: any;
  created_at: string;
}

export interface PayrollRawData {
  id: string;
  raw_json: any;
  file_size: number;
  created_at: string;
}

export const usePayrollMonthlySubmissions = (importId: string) => {
  return useQuery({
    queryKey: ['payroll-monthly-submissions', importId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_monthly_submissions')
        .select('*')
        .eq('payroll_import_id', importId)
        .order('period_year', { ascending: true })
        .order('period_month', { ascending: true });

      if (error) throw error;
      return data as PayrollMonthlySubmission[];
    },
    enabled: !!importId,
  });
};

export const usePayrollEmployees = (importId: string) => {
  return useQuery({
    queryKey: ['payroll-employees', importId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_employees')
        .select('*')
        .eq('payroll_import_id', importId)
        .order('employee_id', { ascending: true });

      if (error) throw error;
      return data as PayrollEmployee[];
    },
    enabled: !!importId,
  });
};

export const usePayrollIncomeDetails = (employeeId: string) => {
  return useQuery({
    queryKey: ['payroll-income-details', employeeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_income_details')
        .select('*')
        .eq('payroll_employee_id', employeeId)
        .order('period_year', { ascending: true })
        .order('period_month', { ascending: true });

      if (error) throw error;
      return data as PayrollIncomeDetail[];
    },
    enabled: !!employeeId,
  });
};

export const usePayrollRawData = (importId: string) => {
  return useQuery({
    queryKey: ['payroll-raw-data', importId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_raw_data')
        .select('*')
        .eq('payroll_import_id', importId)
        .single();

      if (error) throw error;
      return data as PayrollRawData;
    },
    enabled: !!importId,
  });
};