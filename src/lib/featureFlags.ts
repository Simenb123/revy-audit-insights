/**
 * Feature Flags System
 * 
 * Controls visibility of features in production vs development.
 * Features are disabled by default in production, can be enabled via environment variables.
 */

export type FeatureFlag = 
  | 'FEATURE_PAYROLL_A07'
  | 'FEATURE_REPORT_BUILDER' 
  | 'FEATURE_ADVANCED_AI';

interface FeatureConfig {
  key: FeatureFlag;
  envVar: string;
  defaultValue: boolean;
  betaPhase: boolean;
}

const featureConfigs: FeatureConfig[] = [
  {
    key: 'FEATURE_PAYROLL_A07',
    envVar: 'VITE_FEATURE_PAYROLL_A07',
    defaultValue: false,
    betaPhase: true
  },
  {
    key: 'FEATURE_REPORT_BUILDER',
    envVar: 'VITE_FEATURE_REPORT_BUILDER',
    defaultValue: false,
    betaPhase: true
  },
  {
    key: 'FEATURE_ADVANCED_AI',
    envVar: 'VITE_FEATURE_ADVANCED_AI',
    defaultValue: false,
    betaPhase: true
  }
];

/**
 * Check if a feature is enabled
 */
function isFeatureEnabled(flag: FeatureFlag): boolean {
  const config = featureConfigs.find(c => c.key === flag);
  if (!config) return false;
  
  const envValue = import.meta.env[config.envVar];
  if (envValue !== undefined) {
    return envValue === 'true' || envValue === '1';
  }
  
  return config.defaultValue;
}

/**
 * Check if a feature is in beta phase
 */
function isFeatureInBeta(flag: FeatureFlag): boolean {
  const config = featureConfigs.find(c => c.key === flag);
  return config?.betaPhase ?? false;
}

// Specific feature flag helpers
export const isPayrollEnabled = () => isFeatureEnabled('FEATURE_PAYROLL_A07');
export const isReportBuilderEnabled = () => isFeatureEnabled('FEATURE_REPORT_BUILDER');
export const isAdvancedAIEnabled = () => isFeatureEnabled('FEATURE_ADVANCED_AI');

// Beta phase helpers
export const isPayrollInBeta = () => isFeatureInBeta('FEATURE_PAYROLL_A07');
export const isReportBuilderInBeta = () => isFeatureInBeta('FEATURE_REPORT_BUILDER');
export const isAdvancedAIInBeta = () => isFeatureInBeta('FEATURE_ADVANCED_AI');

// General helpers
export { isFeatureEnabled, isFeatureInBeta };