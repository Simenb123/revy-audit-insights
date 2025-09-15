import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FinancialFrameworkType } from '@/types/client-extended';
import { useFormulaCalculation } from '@/hooks/useEnhancedFormulaCalculation';
import { useActiveVersion } from '@/hooks/useAccountingVersions';

interface ThresholdCriteria {
  totalAssets: number | null; // Balance sum (line 665) in million NOK
  revenue: number | null; // Operating revenue (line 19) in million NOK
  employees: number | null; // Employee count
}

interface CriteriaDetail {
  name: string;
  actualValue: number;
  threshold: number;
  exceedsThreshold: boolean;
  formattedActual: string;
  formattedThreshold: string;
  unit: string;
}

interface ValidationResult {
  framework: FinancialFrameworkType;
  isValid: boolean;
  recommendedFramework: FinancialFrameworkType | null;
  failedCriteria: string[];
  message: string;
  detailedCriteria: {
    small: CriteriaDetail[];
    medium: CriteriaDetail[];
  };
  exceedsSmallCount: number;
  exceedsMediumCount: number;
  conclusion: string;
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

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('no-NO').format(value);
};

const formatCurrency = (value: number): string => {
  return `kr ${formatNumber(Math.round(value * 1000000))}`;
};

const createCriteriaDetail = (
  name: string,
  actualValue: number,
  threshold: number,
  unit: string,
  isCurrency: boolean = false
): CriteriaDetail => ({
  name,
  actualValue,
  threshold,
  exceedsThreshold: actualValue >= threshold,
  formattedActual: isCurrency ? formatCurrency(actualValue) : formatNumber(actualValue),
  formattedThreshold: isCurrency ? formatCurrency(threshold) : formatNumber(threshold),
  unit,
});

const validateFramework = (
  selectedFramework: FinancialFrameworkType,
  criteria: ThresholdCriteria
): ValidationResult => {
  const recommendedFramework = getRecommendedFramework(criteria);
  const isValid = selectedFramework === recommendedFramework;
  
  const failedCriteria: string[] = [];
  const { totalAssets = 0, revenue = 0, employees = 0 } = criteria;
  
  // Count how many criteria exceed thresholds
  let exceedsSmallCount = 0;
  if (totalAssets >= THRESHOLDS.small.totalAssets) exceedsSmallCount++;
  if (revenue >= THRESHOLDS.small.revenue) exceedsSmallCount++;
  if (employees >= THRESHOLDS.small.employees) exceedsSmallCount++;
  
  let exceedsMediumCount = 0;
  if (totalAssets >= THRESHOLDS.medium.totalAssets) exceedsMediumCount++;
  if (revenue >= THRESHOLDS.medium.revenue) exceedsMediumCount++;
  if (employees >= THRESHOLDS.medium.employees) exceedsMediumCount++;
  
  // Create detailed criteria for both thresholds
  const detailedCriteria = {
    small: [
      createCriteriaDetail('Sum eiendeler', totalAssets, THRESHOLDS.small.totalAssets, 'mill kr', true),
      createCriteriaDetail('Driftsinntekter', revenue, THRESHOLDS.small.revenue, 'mill kr', true),
      createCriteriaDetail('Antall ansatte', employees, THRESHOLDS.small.employees, 'stk'),
    ],
    medium: [
      createCriteriaDetail('Sum eiendeler', totalAssets, THRESHOLDS.medium.totalAssets, 'mill kr', true),
      createCriteriaDetail('Driftsinntekter', revenue, THRESHOLDS.medium.revenue, 'mill kr', true),
      createCriteriaDetail('Antall ansatte', employees, THRESHOLDS.medium.employees, 'stk'),
    ],
  };
  
  // Generate conclusion based on framework selection and criteria
  let conclusion = '';
  const frameworkName = selectedFramework.replace('ngaap_', '').replace('_', ' ');
  
  if (selectedFramework === 'ngaap_small') {
    if (exceedsSmallCount >= 2) {
      conclusion = `${exceedsSmallCount} av 3 vilkår overstiger terskelverdiene for små foretak. Selskapet bør klassifiseres som ${exceedsMediumCount >= 2 ? 'stort' : 'mellomstort'} foretak.`;
    } else {
      conclusion = `Kun ${exceedsSmallCount} av 3 vilkår overstiger terskelverdiene. Selskapet kan klassifiseres som små foretak.`;
    }
  } else if (selectedFramework === 'ngaap_medium') {
    if (exceedsMediumCount >= 2) {
      conclusion = `${exceedsMediumCount} av 3 vilkår overstiger terskelverdiene for mellomstore foretak. Selskapet bør klassifiseres som stort foretak.`;
    } else if (exceedsSmallCount < 2) {
      conclusion = `Kun ${exceedsSmallCount} av 3 vilkår overstiger terskelverdiene for små foretak. Selskapet kan klassifiseres som små foretak.`;
    } else {
      conclusion = `${exceedsSmallCount} av 3 vilkår overstiger terskelverdiene for små foretak, men kun ${exceedsMediumCount} for mellomstore. Klassifisering som mellomstort foretak er korrekt.`;
    }
  } else if (selectedFramework === 'ngaap_large') {
    if (exceedsMediumCount < 2) {
      conclusion = `Kun ${exceedsMediumCount} av 3 vilkår overstiger terskelverdiene for mellomstore foretak. Selskapet bør klassifiseres som ${exceedsSmallCount >= 2 ? 'mellomstort' : 'småt'} foretak.`;
    } else {
      conclusion = `${exceedsMediumCount} av 3 vilkår overstiger terskelverdiene for mellomstore foretak. Klassifisering som stort foretak er korrekt.`;
    }
  }
  
  // Generate failed criteria messages for backward compatibility
  if (selectedFramework === 'ngaap_small' && exceedsSmallCount >= 2) {
    detailedCriteria.small.forEach(criteria => {
      if (criteria.exceedsThreshold) {
        failedCriteria.push(`${criteria.name} ${criteria.formattedActual} > ${criteria.formattedThreshold} - overstiger terskel`);
      }
    });
  }
  
  let message = '';
  if (!isValid) {
    message = `Du har valgt kategorien NGAAP - ${frameworkName}. Regnskapstallene tilsier ${recommendedFramework.replace('ngaap_', '').replace('_', ' ')} foretak.`;
  } else {
    message = `Valgt rammeverk NGAAP - ${frameworkName} samsvarer med regnskapstallene.`;
  }
  
  return {
    framework: selectedFramework,
    isValid,
    recommendedFramework: isValid ? null : recommendedFramework,
    failedCriteria,
    message,
    detailedCriteria,
    exceedsSmallCount,
    exceedsMediumCount,
    conclusion,
  };
};

export const useFinancialFrameworkValidation = (
  clientId: string,
  fiscalYear: number,
  selectedFramework: FinancialFrameworkType,
  employeeCount: number | null
) => {
  // Get active version for consistent data access
  const { data: activeVersion } = useActiveVersion(clientId);
  
  // Get sum of assets (standard line 665) using the existing formula calculation system
  const totalAssetsResult = useFormulaCalculation({
    clientId,
    fiscalYear,
    customFormula: '[665]', // Standard line for Sum eiendeler
    selectedVersion: activeVersion?.id,
    enabled: !!activeVersion
  });

  // Get operating revenue (standard line 19) using the existing formula calculation system  
  const revenueResult = useFormulaCalculation({
    clientId,
    fiscalYear,
    customFormula: '[19]', // Standard line for Sum driftsinntekter
    selectedVersion: activeVersion?.id,
    enabled: !!activeVersion
  });

  return useQuery({
    queryKey: ['financial-framework-validation', clientId, fiscalYear, selectedFramework, employeeCount, 
               activeVersion?.id, totalAssetsResult.data?.value, revenueResult.data?.value],
    queryFn: async () => {
      const criteria: ThresholdCriteria = {
        totalAssets: totalAssetsResult.data?.value ? Math.abs(totalAssetsResult.data.value) / 1000000 : null, // Convert to millions
        revenue: revenueResult.data?.value ? Math.abs(revenueResult.data.value) / 1000000 : null, // Convert to millions
        employees: employeeCount,
      };

      return validateFramework(selectedFramework, criteria);
    },
    enabled: !!clientId && !!fiscalYear && !!selectedFramework && !!activeVersion &&
             !totalAssetsResult.isLoading && !revenueResult.isLoading,
  });
};