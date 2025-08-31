export interface AnalysisConfiguration {
  id: string;
  name: string;
  description: string;
  controlTests: ControlTestConfiguration;
  riskScoring: RiskScoringConfiguration;
  aiAnalysis: AIAnalysisConfiguration;
  reporting: ReportingConfiguration;
}

export interface ControlTestConfiguration {
  enabledTests: string[];
  balanceTolerancePercent: number;
  duplicateAmountThreshold: number;
  duplicateDateRangeDays: number;
  weekendPostingEnabled: boolean;
  futureTransactionDays: number;
  maxAccountFlowValidations: number;
}

export interface RiskScoringConfiguration {
  enabledFactors: string[];
  thresholds: {
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
  };
  weights: {
    timing: number;
    amount: number;
    description: number;
    frequency: number;
    user: number;
  };
  minimumTransactionCount: number;
}

export interface AIAnalysisConfiguration {
  enabled: boolean;
  model: string;
  temperature?: number;
  maxTransactions: number;
  confidenceThreshold: number;
  analysisTypes: string[];
  customPrompts: Record<string, string>;
}

export interface ReportingConfiguration {
  defaultTemplate: string;
  includeSensitiveData: boolean;
  autoGenerateOnComplete: boolean;
  emailNotifications: boolean;
  retentionDays: number;
}

export class AnalysisConfigurationService {
  
  private defaultConfigurations: AnalysisConfiguration[] = [
    {
      id: 'comprehensive',
      name: 'Omfattende analyse',
      description: 'Fullstendig analyse med alle kontrolltester og høy sensitivitet',
      controlTests: {
        enabledTests: [
          'voucher_balance_test',
          'duplicate_transactions_test',
          'account_flow_validation_test',
          'time_logic_validation_test'
        ],
        balanceTolerancePercent: 0.01,
        duplicateAmountThreshold: 0.01,
        duplicateDateRangeDays: 30,
        weekendPostingEnabled: true,
        futureTransactionDays: 7,
        maxAccountFlowValidations: 10000
      },
      riskScoring: {
        enabledFactors: [
          'weekend_posting',
          'holiday_posting',
          'large_amount',
          'round_amount',
          'high_frequency',
          'unusual_description',
          'manual_entry'
        ],
        thresholds: {
          lowRisk: 3,
          mediumRisk: 7,
          highRisk: 12
        },
        weights: {
          timing: 2.0,
          amount: 1.5,
          description: 1.0,
          frequency: 1.2,
          user: 1.8
        },
        minimumTransactionCount: 5
      },
      aiAnalysis: {
        enabled: true,
        model: 'gpt-5',
        temperature: 0.7,
        maxTransactions: 1000,
        confidenceThreshold: 0.7,
        analysisTypes: ['anomaly_detection', 'pattern_analysis', 'risk_assessment'],
        customPrompts: {}
      },
      reporting: {
        defaultTemplate: 'comprehensive',
        includeSensitiveData: false,
        autoGenerateOnComplete: true,
        emailNotifications: false,
        retentionDays: 365
      }
    },
    {
      id: 'quick',
      name: 'Rask analyse',
      description: 'Grunnleggende analyse for rask gjennomgang',
      controlTests: {
        enabledTests: [
          'voucher_balance_test',
          'duplicate_transactions_test'
        ],
        balanceTolerancePercent: 0.1,
        duplicateAmountThreshold: 0.1,
        duplicateDateRangeDays: 7,
        weekendPostingEnabled: false,
        futureTransactionDays: 3,
        maxAccountFlowValidations: 1000
      },
      riskScoring: {
        enabledFactors: [
          'large_amount',
          'round_amount',
          'high_frequency'
        ],
        thresholds: {
          lowRisk: 5,
          mediumRisk: 10,
          highRisk: 15
        },
        weights: {
          timing: 1.0,
          amount: 2.0,
          description: 0.5,
          frequency: 1.0,
          user: 1.0
        },
        minimumTransactionCount: 10
      },
      aiAnalysis: {
        enabled: false,
        model: 'gpt-5-mini',
        maxTransactions: 500,
        confidenceThreshold: 0.8,
        analysisTypes: ['anomaly_detection'],
        customPrompts: {}
      },
      reporting: {
        defaultTemplate: 'executive',
        includeSensitiveData: false,
        autoGenerateOnComplete: false,
        emailNotifications: false,
        retentionDays: 90
      }
    },
    {
      id: 'detailed',
      name: 'Detaljert analyse',
      description: 'Grundig analyse for komplekse revisjoner',
      controlTests: {
        enabledTests: [
          'voucher_balance_test',
          'duplicate_transactions_test',
          'account_flow_validation_test',
          'time_logic_validation_test'
        ],
        balanceTolerancePercent: 0.001,
        duplicateAmountThreshold: 0.001,
        duplicateDateRangeDays: 90,
        weekendPostingEnabled: true,
        futureTransactionDays: 14,
        maxAccountFlowValidations: 50000
      },
      riskScoring: {
        enabledFactors: [
          'weekend_posting',
          'holiday_posting',
          'large_amount',
          'round_amount',
          'high_frequency',
          'unusual_description',
          'manual_entry',
          'after_hours',
          'sequential_amounts',
          'recurring_description'
        ],
        thresholds: {
          lowRisk: 2,
          mediumRisk: 5,
          highRisk: 8
        },
        weights: {
          timing: 2.5,
          amount: 2.0,
          description: 1.5,
          frequency: 1.5,
          user: 2.0
        },
        minimumTransactionCount: 3
      },
      aiAnalysis: {
        enabled: true,
        model: 'gpt-5',
        temperature: 0.6,
        maxTransactions: 2000,
        confidenceThreshold: 0.6,
        analysisTypes: ['anomaly_detection', 'pattern_analysis', 'risk_assessment', 'compliance_check'],
        customPrompts: {
          'compliance_check': 'Analyze transactions for compliance with Norwegian accounting standards and regulations.'
        }
      },
      reporting: {
        defaultTemplate: 'technical',
        includeSensitiveData: true,
        autoGenerateOnComplete: true,
        emailNotifications: true,
        retentionDays: 2555 // 7 years
      }
    }
  ];

  getAvailableConfigurations(): AnalysisConfiguration[] {
    return this.defaultConfigurations;
  }

  getConfiguration(configId: string): AnalysisConfiguration | null {
    return this.defaultConfigurations.find(config => config.id === configId) || null;
  }

  createCustomConfiguration(config: Partial<AnalysisConfiguration>): AnalysisConfiguration {
    const baseConfig = this.defaultConfigurations[0]; // Use comprehensive as base
    
    return {
      id: config.id || `custom_${Date.now()}`,
      name: config.name || 'Tilpasset konfigurasjon',
      description: config.description || 'Brukertilpasset analysekonfigurasjon',
      controlTests: { ...baseConfig.controlTests, ...config.controlTests },
      riskScoring: { ...baseConfig.riskScoring, ...config.riskScoring },
      aiAnalysis: { ...baseConfig.aiAnalysis, ...config.aiAnalysis },
      reporting: { ...baseConfig.reporting, ...config.reporting }
    };
  }

  validateConfiguration(config: AnalysisConfiguration): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate control tests
    if (config.controlTests.balanceTolerancePercent < 0 || config.controlTests.balanceTolerancePercent > 1) {
      errors.push('Balansetoleranse må være mellom 0 og 1');
    }

    if (config.controlTests.duplicateAmountThreshold < 0 || config.controlTests.duplicateAmountThreshold > 1) {
      errors.push('Duplikatbeløp-terskel må være mellom 0 og 1');
    }

    if (config.controlTests.duplicateDateRangeDays < 1 || config.controlTests.duplicateDateRangeDays > 365) {
      errors.push('Duplikatdato-område må være mellom 1 og 365 dager');
    }

    // Validate risk scoring
    if (config.riskScoring.thresholds.lowRisk >= config.riskScoring.thresholds.mediumRisk) {
      errors.push('Lav risiko-terskel må være mindre enn medium risiko-terskel');
    }

    if (config.riskScoring.thresholds.mediumRisk >= config.riskScoring.thresholds.highRisk) {
      errors.push('Medium risiko-terskel må være mindre enn høy risiko-terskel');
    }

    // Validate AI analysis
    if (config.aiAnalysis.enabled && config.aiAnalysis.maxTransactions < 100) {
      errors.push('Maksimum transaksjoner for AI-analyse må være minst 100');
    }

    if (config.aiAnalysis.confidenceThreshold < 0 || config.aiAnalysis.confidenceThreshold > 1) {
      errors.push('AI konfidensterskel må være mellom 0 og 1');
    }

    // Validate reporting
    if (config.reporting.retentionDays < 30) {
      errors.push('Lagringstid må være minst 30 dager');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  exportConfiguration(config: AnalysisConfiguration): string {
    return JSON.stringify(config, null, 2);
  }

  importConfiguration(configJson: string): AnalysisConfiguration {
    try {
      const config = JSON.parse(configJson) as AnalysisConfiguration;
      const validation = this.validateConfiguration(config);
      
      if (!validation.valid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }
      
      return config;
    } catch (error) {
      throw new Error(`Failed to import configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getConfigurationSummary(config: AnalysisConfiguration): string {
    return `
Konfigurasjon: ${config.name}
- Kontrolltester: ${config.controlTests.enabledTests.length} aktivert
- Risikofaktorer: ${config.riskScoring.enabledFactors.length} aktivert  
- AI-analyse: ${config.aiAnalysis.enabled ? 'Aktivert' : 'Deaktivert'}
- Rapportmal: ${config.reporting.defaultTemplate}
- Lagringstid: ${config.reporting.retentionDays} dager
    `.trim();
  }
}

export const analysisConfigurationService = new AnalysisConfigurationService();