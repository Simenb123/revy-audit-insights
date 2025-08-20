import { describe, test, expect } from 'vitest';
import { SamplingParams, SamplingResult, ExportFormat } from '../types';
import { 
  formatCurrency, 
  formatNumber, 
  formatPercentage,
  generateParamHash,
  calculateSuggestedThreshold,
  generateQuantileStrata,
  getRiskWeightedAmount
} from '../utils';
import { exportToCSV, exportToJSON, preparePDFData } from '../exportService';

describe('Sampling Utils', () => {
  describe('Formatering', () => {
    test('formatCurrency gir norsk format', () => {
      expect(formatCurrency(12345)).toBe('kr 12 345');
      expect(formatCurrency(1234567)).toBe('kr 1 234 567');
    });

    test('formatNumber gir norsk format', () => {
      expect(formatNumber(12345.67, 2)).toBe('12 345,67');
      expect(formatNumber(1234567, 0)).toBe('1 234 567');
    });

    test('formatPercentage gir norsk format', () => {
      expect(formatPercentage(12.34)).toBe('12,3 %');
      expect(formatPercentage(100)).toBe('100,0 %');
    });
  });

  describe('Parameter hash (deterministisk)', () => {
    test('Samme parametere gir samme hash', () => {
      const params1: SamplingParams = {
        fiscalYear: 2024,
        testType: 'SUBSTANTIVE',
        method: 'MUS',
        populationSize: 100,
        populationSum: 1000000,
        materiality: 50000,
        confidenceLevel: 95,
        riskLevel: 'moderat',
        thresholdMode: 'DISABLED',
        minPerStratum: 2,
        riskMatrix: { lav: 0.8, moderat: 1.0, hoy: 1.3 },
        riskWeighting: 'disabled',
        confidenceFactor: 1.0,
        seed: 12345
      };

      const params2 = { ...params1 };
      
      expect(generateParamHash(params1)).toBe(generateParamHash(params2));
    });

    test('Forskjellige parametere gir forskjellige hash', () => {
      const params1: SamplingParams = {
        fiscalYear: 2024,
        testType: 'SUBSTANTIVE',
        method: 'MUS',
        populationSize: 100,
        populationSum: 1000000,
        materiality: 50000,
        confidenceLevel: 95,
        riskLevel: 'moderat',
        thresholdMode: 'DISABLED',
        minPerStratum: 2,
        riskMatrix: { lav: 0.8, moderat: 1.0, hoy: 1.3 },
        riskWeighting: 'disabled',
        confidenceFactor: 1.0,
        seed: 12345
      };

      const params2 = { ...params1, seed: 54321 };
      
      expect(generateParamHash(params1)).not.toBe(generateParamHash(params2));
    });

    test('Rekkefølge på objektnøkler påvirker ikke hash', () => {
      const params1: any = { a: 1, b: 2, c: 3 };
      const params2: any = { c: 3, a: 1, b: 2 };
      
      expect(generateParamHash(params1)).toBe(generateParamHash(params2));
    });
  });

  describe('Terskel-forslag', () => {
    test('Excel-lignende formel er korrekt', () => {
      const pm = 75000;
      const em = 10000;
      const confidenceFactor = 1.5;
      const riskFactor = 1.3;
      
      const result = calculateSuggestedThreshold(pm, em, confidenceFactor, riskFactor);
      const expected = (pm - em) / (confidenceFactor * riskFactor);
      
      expect(result).toBeCloseTo(expected, 2);
      expect(result).toBeCloseTo(33333.33, 2);
    });
  });

  describe('Kvantil-baserte strata', () => {
    test('Genererer monotont økende grenser', () => {
      const amounts = [1000, 2000, 5000, 10000, 15000, 25000, 50000, 75000, 100000];
      const strata = generateQuantileStrata(amounts, 4);
      
      for (let i = 1; i < strata.length; i++) {
        expect(strata[i]).toBeGreaterThan(strata[i - 1]);
      }
    });

    test('Tom array gir tom resultat', () => {
      const strata = generateQuantileStrata([], 4);
      expect(strata).toEqual([]);
    });
  });

  describe('Risikovekting', () => {
    test('Disabled risikovekting returnerer base amount', () => {
      const amount = 10000;
      const riskScore = 0.5;
      
      const weighted = getRiskWeightedAmount(amount, riskScore, 'disabled');
      expect(weighted).toBe(Math.abs(amount));
    });

    test('Moderat risikovekting bruker alpha=0.6', () => {
      const amount = 10000;
      const riskScore = 0.5;
      
      const weighted = getRiskWeightedAmount(amount, riskScore, 'moderat');
      const expected = Math.abs(amount) * (1 + 0.6 * riskScore);
      
      expect(weighted).toBeCloseTo(expected, 2);
    });

    test('Høy risikovekting bruker alpha=1.0', () => {
      const amount = 10000;
      const riskScore = 0.8;
      
      const weighted = getRiskWeightedAmount(amount, riskScore, 'hoy');
      const expected = Math.abs(amount) * (1 + 1.0 * riskScore);
      
      expect(weighted).toBeCloseTo(expected, 2);
    });

    test('Negative beløp konverteres til absolutt verdi', () => {
      const amount = -10000;
      const riskScore = 0.5;
      
      const weighted = getRiskWeightedAmount(amount, riskScore, 'moderat');
      expect(weighted).toBeGreaterThan(0);
    });
  });
});

describe('Export Metadata', () => {
  const mockResult: SamplingResult = {
    plan: {
      id: 'test-plan-id',
      recommendedSampleSize: 50,
      actualSampleSize: 45,
      coveragePercentage: 85.5,
      method: 'MUS',
      testType: 'SUBSTANTIVE',
      generatedAt: '2024-01-01T10:00:00Z',
      paramHash: 'abc123',
      seed: 12345
    },
    samples: {
      targeted: [],
      residual: [
        {
          id: 'tx1',
          transaction_date: '2024-01-01',
          account_no: '1000',
          account_name: 'Test Account',
          description: 'Test Transaction',
          amount: 50000,
          sample_type: 'RESIDUAL'
        }
      ],
      total: [
        {
          id: 'tx1',
          transaction_date: '2024-01-01',
          account_no: '1000',
          account_name: 'Test Account',
          description: 'Test Transaction',
          amount: 50000,
          sample_type: 'RESIDUAL'
        }
      ]
    },
    metadata: {
      thresholdUsed: 75000,
      riskMatrixUsed: { lav: 0.8, moderat: 1.0, hoy: 1.3 },
      calculations: {
        nBase: 50,
        riskFactor: 1.0,
        finalN: 50
      }
    }
  };

  const mockParams: SamplingParams = {
    fiscalYear: 2024,
    testType: 'SUBSTANTIVE',
    method: 'MUS',
    populationSize: 100,
    populationSum: 1000000,
    materiality: 100000,
    performanceMateriality: 75000,
    expectedMisstatement: 10000,
    confidenceLevel: 95,
    riskLevel: 'moderat',
    thresholdMode: 'PM',
    thresholdAmount: 75000,
    minPerStratum: 2,
    riskMatrix: { lav: 0.8, moderat: 1.0, hoy: 1.3 },
    riskWeighting: 'disabled',
    confidenceFactor: 1.5,
    seed: 12345
  };

  describe('CSV Export Metadata', () => {
    test('Inneholder påkrevd metadata', () => {
      const format: ExportFormat = { 
        type: 'CSV', 
        includeMetadata: true, 
        includeParameters: true 
      };
      
      const csv = exportToCSV(mockResult, mockParams, format);
      
      expect(csv).toContain('# Metode: MUS');
      expect(csv).toContain('# Test type: SUBSTANTIVE');
      expect(csv).toContain('# Seed,12345');
      expect(csv).toContain('# Konfidensgrad,95%');
      expect(csv).toContain('# Vesentlighet,kr 100 000');
    });

    test('Ekskluderer metadata når ikke ønsket', () => {
      const format: ExportFormat = { 
        type: 'CSV', 
        includeMetadata: false, 
        includeParameters: false 
      };
      
      const csv = exportToCSV(mockResult, mockParams, format);
      
      expect(csv).not.toContain('# Metode:');
      expect(csv).not.toContain('# PARAMETERE');
    });
  });

  describe('JSON Export Metadata', () => {
    test('Inneholder komplett metadata struktur', () => {
      const format: ExportFormat = { 
        type: 'JSON', 
        includeMetadata: true, 
        includeParameters: true 
      };
      
      const json = exportToJSON(mockResult, mockParams, format);
      const parsed = JSON.parse(json);
      
      expect(parsed.exportMetadata).toBeDefined();
      expect(parsed.exportMetadata.exportedBy).toBe('Revio Audit Sampling');
      expect(parsed.plan.seed).toBe(12345);
      expect(parsed.plan.paramHash).toBe('abc123');
      expect(parsed.parameters).toBeDefined();
      expect(parsed.parameters.seed).toBe(12345);
      expect(parsed.metadata.riskMatrixUsed).toEqual({ lav: 0.8, moderat: 1.0, hoy: 1.3 });
    });

    test('Ekskluderer parametere når ikke ønsket', () => {
      const format: ExportFormat = { 
        type: 'JSON', 
        includeMetadata: false, 
        includeParameters: false 
      };
      
      const json = exportToJSON(mockResult, mockParams, format);
      const parsed = JSON.parse(json);
      
      expect(parsed.parameters).toBeUndefined();
      expect(parsed.metadata).toBeUndefined();
    });
  });

  describe('PDF Export Data', () => {
    test('Inneholder alle påkrevde felt for PDF generering', () => {
      const pdfData = preparePDFData(mockResult, mockParams, 'Test Plan');
      
      expect(pdfData.title).toBe('Revisjonsutvalg');
      expect(pdfData.planName).toBe('Test Plan');
      expect(pdfData.summary.seed).toBe(12345);
      expect(pdfData.parameters.confidenceLevel).toBe('95%');
      expect(pdfData.parameters.materiality).toBe('kr 100 000');
      expect(pdfData.calculations.riskFactor).toBe('1,00');
      expect(pdfData.samples).toHaveLength(1);
      expect(pdfData.samples[0].amount).toBe('kr 50 000');
    });
  });
});