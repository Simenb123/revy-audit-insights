import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FinancialFrameworkType } from '@/types/client-extended';

interface ThresholdCriteria {
  totalAssets: number | null; // Balance sum (line 665) in million NOK
  revenue: number | null; // Operating revenue (line 19) in million NOK
  employees: number | null; // Employee count
}

interface ValidationResult {
  framework: FinancialFrameworkType;
  isValid: boolean;
  recommendedFramework: FinancialFrameworkType | null;
  failedCriteria: string[];
  message: string;
}

// Threshold definitions in million NOK
const THRESHOLDS = {
  small: {
    totalAssets: 84,
    revenue: 168,
    employees: 50,
  },
  medium: {
    totalAssets: 290,
    revenue: 580,
    employees: 250,
  },
};

const getRecommendedFramework = (criteria: ThresholdCriteria): FinancialFrameworkType => {
  const { totalAssets = 0, revenue = 0, employees = 0 } = criteria;
  
  // Count how many criteria exceed small thresholds
  let exceedsSmall = 0;
  if (totalAssets >= THRESHOLDS.small.totalAssets) exceedsSmall++;
  if (revenue >= THRESHOLDS.small.revenue) exceedsSmall++;
  if (employees >= THRESHOLDS.small.employees) exceedsSmall++;
  
  // Count how many criteria exceed medium thresholds
  let exceedsMedium = 0;
  if (totalAssets >= THRESHOLDS.medium.totalAssets) exceedsMedium++;
  if (revenue >= THRESHOLDS.medium.revenue) exceedsMedium++;
  if (employees >= THRESHOLDS.medium.employees) exceedsMedium++;
  
  // Logic: "Under to av tre vilkår" = less than 2 of 3 criteria
  if (exceedsMedium >= 2) {
    return 'ngaap_large'; // Store foretak
  } else if (exceedsSmall >= 2) {
    return 'ngaap_medium'; // Mellomstore foretak
  } else {
    return 'ngaap_small'; // Små foretak
  }
};

const validateFramework = (
  selectedFramework: FinancialFrameworkType,
  criteria: ThresholdCriteria
): ValidationResult => {
  const recommendedFramework = getRecommendedFramework(criteria);
  const isValid = selectedFramework === recommendedFramework;
  
  const failedCriteria: string[] = [];
  const { totalAssets = 0, revenue = 0, employees = 0 } = criteria;
  
  // Check which specific criteria might be causing issues
  if (selectedFramework === 'ngaap_small') {
    if (totalAssets >= THRESHOLDS.small.totalAssets) {
      failedCriteria.push(`Balansesum (${totalAssets.toFixed(1)} mill) overskrider grensen på ${THRESHOLDS.small.totalAssets} mill`);
    }
    if (revenue >= THRESHOLDS.small.revenue) {
      failedCriteria.push(`Driftsinntekter (${revenue.toFixed(1)} mill) overskrider grensen på ${THRESHOLDS.small.revenue} mill`);
    }
    if (employees >= THRESHOLDS.small.employees) {
      failedCriteria.push(`Antall ansatte (${employees}) overskrider grensen på ${THRESHOLDS.small.employees}`);
    }
  }
  
  let message = '';
  if (!isValid) {
    message = `Basert på regnskapstallene anbefales ${recommendedFramework.replace('ngaap_', '').replace('_', ' ')} rammeverk`;
  } else {
    message = 'Valgt rammeverk samsvarer med regnskapstallene';
  }
  
  return {
    framework: selectedFramework,
    isValid,
    recommendedFramework: isValid ? null : recommendedFramework,
    failedCriteria,
    message,
  };
};

export const useFinancialFrameworkValidation = (
  clientId: string,
  fiscalYear: number,
  selectedFramework: FinancialFrameworkType,
  employeeCount: number | null
) => {
  return useQuery({
    queryKey: ['financial-framework-validation', clientId, fiscalYear, selectedFramework, employeeCount],
    queryFn: async () => {
      // Fetch trial balance data for balance sum (line 665) and revenue (line 19)
      // Join with client_chart_of_accounts to get account numbers
      const { data: trialBalanceData, error } = await supabase
        .from('trial_balances')
        .select(`
          closing_balance,
          client_chart_of_accounts!inner(account_number)
        `)
        .eq('client_id', clientId)
        .eq('period_year', fiscalYear)
        .in('client_chart_of_accounts.account_number', ['665', '19']);

      if (error) throw error;

      const totalAssetsLine = trialBalanceData?.find(item => 
        item.client_chart_of_accounts?.account_number === '665'
      );
      const revenueLine = trialBalanceData?.find(item => 
        item.client_chart_of_accounts?.account_number === '19'
      );

      const criteria: ThresholdCriteria = {
        totalAssets: totalAssetsLine ? Math.abs(totalAssetsLine.closing_balance) / 1000000 : null, // Convert to millions
        revenue: revenueLine ? Math.abs(revenueLine.closing_balance) / 1000000 : null, // Convert to millions
        employees: employeeCount,
      };

      return validateFramework(selectedFramework, criteria);
    },
    enabled: !!clientId && !!fiscalYear && !!selectedFramework,
  });
};