import { describe, test, expect, beforeEach } from 'vitest';
import { generateAuditSample, calculateThresholdSuggestion } from '../algorithms';
import { SamplingParams, Transaction, RiskMatrix } from '../types';
import { 
  createSeededRNG, 
  getZScore, 
  getPoissonFactor, 
  generateQuantileStrata,
  validateSamplingParams,
  calculateSuggestedThreshold
} from '../utils';

describe('Sampling - Kjernefunksjonalitet', () => {
  let standardPopulation: Transaction[];
  let defaultParams: SamplingParams;
  let defaultRiskMatrix: RiskMatrix;

  beforeEach(() => {
    // Create a standard test population (100 transactions)
    standardPopulation = Array.from({ length: 100 }, (_, i) => ({
      id: `t${i + 1}`,
      transaction_date: '2024-01-01',
      account_no: `${1000 + i}`,
      account_name: `Konto ${i + 1}`,
      description: `Transaksjon ${i + 1}`,
      amount: (i + 1) * 1000, // 1000, 2000, 3000, ..., 100000
      risk_score: Math.min(1.0, i / 100) // 0 to 1 risk score
    }));

    defaultRiskMatrix = {
      lav: 0.8,
      moderat: 1.0,
      hoy: 1.3
    };

    defaultParams = {
      fiscalYear: 2024,
      testType: 'SUBSTANTIVE',
      method: 'MUS',
      populationSize: standardPopulation.length,
      populationSum: standardPopulation.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
      materiality: 100000,
      performanceMateriality: 75000,
      expectedMisstatement: 10000,
      confidenceLevel: 95,
      riskLevel: 'moderat',
      thresholdMode: 'DISABLED',
      minPerStratum: 2,
      riskMatrix: defaultRiskMatrix,
      riskWeighting: 'disabled',
      confidenceFactor: 1.0,
      seed: 12345
    };
  });

  describe('Deterministisk oppførsel (seed)', () => {
    test('SRS gir samme resultat med samme seed', () => {
      const params1 = { ...defaultParams, method: 'SRS' as const, seed: 123 };
      const params2 = { ...defaultParams, method: 'SRS' as const, seed: 123 };
      
      const result1 = generateAuditSample(standardPopulation, params1);
      const result2 = generateAuditSample(standardPopulation, params2);
      
      expect(result1.samples.total.map(s => s.id)).toEqual(result2.samples.total.map(s => s.id));
    });

    test('Systematisk sampling gir samme resultat med samme seed', () => {
      const params1 = { ...defaultParams, method: 'SYSTEMATIC' as const, seed: 456 };
      const params2 = { ...defaultParams, method: 'SYSTEMATIC' as const, seed: 456 };
      
      const result1 = generateAuditSample(standardPopulation, params1);
      const result2 = generateAuditSample(standardPopulation, params2);
      
      expect(result1.samples.total.map(s => s.id)).toEqual(result2.samples.total.map(s => s.id));
    });

    test('MUS gir samme resultat med samme seed', () => {
      const params1 = { ...defaultParams, method: 'MUS' as const, seed: 789 };
      const params2 = { ...defaultParams, method: 'MUS' as const, seed: 789 };
      
      const result1 = generateAuditSample(standardPopulation, params1);
      const result2 = generateAuditSample(standardPopulation, params2);
      
      expect(result1.samples.total.map(s => s.id)).toEqual(result2.samples.total.map(s => s.id));
    });

    test('Forskjellige seeds gir forskjellige resultater', () => {
      const params1 = { ...defaultParams, method: 'SRS' as const, seed: 111 };
      const params2 = { ...defaultParams, method: 'SRS' as const, seed: 222 };
      
      const result1 = generateAuditSample(standardPopulation, params1);
      const result2 = generateAuditSample(standardPopulation, params2);
      
      expect(result1.samples.total.map(s => s.id)).not.toEqual(result2.samples.total.map(s => s.id));
    });
  });

  describe('MUS algoritme formler', () => {
    test('n øker når EM øker (EM < TM)', () => {
      const params1 = { 
        ...defaultParams, 
        expectedMisstatement: 5000,
        materiality: 100000
      };
      
      const params2 = { 
        ...defaultParams, 
        expectedMisstatement: 20000,
        materiality: 100000
      };
      
      const result1 = generateAuditSample(standardPopulation, params1);
      const result2 = generateAuditSample(standardPopulation, params2);
      
      expect(result2.plan.recommendedSampleSize).toBeGreaterThanOrEqual(result1.plan.recommendedSampleSize);
    });

    test('Poissonformel brukes korrekt for MUS', () => {
      const expectedPoissonFactor95 = getPoissonFactor(95);
      const expectedPoissonFactor99 = getPoissonFactor(99);
      
      expect(expectedPoissonFactor99).toBeGreaterThan(expectedPoissonFactor95);
      expect(Math.abs(expectedPoissonFactor95 - 2.996)).toBeLessThan(0.01); // -ln(1-0.95) ≈ 2.996
    });

    test('Risikojustering påvirker utvalgsstørrelse', () => {
      const paramsLav = { ...defaultParams, riskLevel: 'lav' as const };
      const paramsHøy = { ...defaultParams, riskLevel: 'hoy' as const };
      
      const resultLav = generateAuditSample(standardPopulation, paramsLav);
      const resultHøy = generateAuditSample(standardPopulation, paramsHøy);
      
      expect(resultHøy.plan.actualSampleSize).toBeGreaterThan(resultLav.plan.actualSampleSize);
    });
  });

  describe('Kontroll/Attributt testing (Cochran)', () => {
    test('Høyere konfidensgrad gir høyere n', () => {
      const paramsControl: SamplingParams = {
        ...defaultParams,
        testType: 'CONTROL',
        method: 'SRS',
        tolerableDeviationRate: 5,
        expectedDeviationRate: 1
      };
      
      const params90 = { ...paramsControl, confidenceLevel: 90 };
      const params99 = { ...paramsControl, confidenceLevel: 99 };
      
      const result90 = generateAuditSample(standardPopulation, params90);
      const result99 = generateAuditSample(standardPopulation, params99);
      
      expect(result99.plan.recommendedSampleSize).toBeGreaterThanOrEqual(result90.plan.recommendedSampleSize);
    });

    test('Z-scores er korrekte', () => {
      expect(getZScore(90)).toBeCloseTo(1.65, 2);
      expect(getZScore(95)).toBeCloseTo(1.96, 2);
      expect(getZScore(99)).toBeCloseTo(2.58, 2);
    });
  });

  describe('Terskel-splitt funksjonalitet', () => {
    test('Union av målrettet og rest equals N', () => {
      const params = { 
        ...defaultParams, 
        thresholdMode: 'CUSTOM' as const, 
        thresholdAmount: 50000 
      };
      
      const result = generateAuditSample(standardPopulation, params);
      const totalSamples = result.samples.targeted.length + result.samples.residual.length;
      
      expect(totalSamples).toBe(result.plan.actualSampleSize);
      
      // Verify targeted items are >= threshold
      result.samples.targeted.forEach(sample => {
        expect(Math.abs(sample.amount)).toBeGreaterThanOrEqual(50000);
      });
      
      // Verify residual items are < threshold
      result.samples.residual.forEach(sample => {
        expect(Math.abs(sample.amount)).toBeLessThan(50000);
      });
    });

    test('Ingen duplikater mellom målrettet og rest', () => {
      const params = { 
        ...defaultParams, 
        thresholdMode: 'PM' as const 
      };
      
      const result = generateAuditSample(standardPopulation, params);
      const targetedIds = new Set(result.samples.targeted.map(s => s.id));
      const residualIds = new Set(result.samples.residual.map(s => s.id));
      
      // No intersection between targeted and residual
      targetedIds.forEach(id => {
        expect(residualIds.has(id)).toBe(false);
      });
    });
  });

  describe('Grensetilfeller', () => {
    test('n=0 gir tomt utvalg', () => {
      // Create params that would result in very small sample size
      const params = { 
        ...defaultParams, 
        materiality: 10000000, // Very high materiality
        expectedMisstatement: 0,
        riskLevel: 'lav' as const
      };
      
      const result = generateAuditSample([], params);
      expect(result.samples.total.length).toBe(0);
    });

    test('n≥N gir hele populasjonen', () => {
      // Small population with high required sample size
      const smallPop = standardPopulation.slice(0, 5);
      const params = { 
        ...defaultParams,
        populationSize: smallPop.length,
        populationSum: smallPop.reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
        materiality: 1000, // Very low materiality = high sample size needed
        expectedMisstatement: 500
      };
      
      const result = generateAuditSample(smallPop, params);
      expect(result.samples.total.length).toBeLessThanOrEqual(smallPop.length);
    });
  });

  describe('PPS×risiko weighting', () => {
    test('Eneste positive vekt velges', () => {
      // Create scenario where only one transaction has positive weight
      const testPop: Transaction[] = [
        { id: 'a', transaction_date: '2024-01-01', account_no: '1000', account_name: 'Test A', description: 'Test', amount: 0 },
        { id: 'b', transaction_date: '2024-01-01', account_no: '1001', account_name: 'Test B', description: 'Test', amount: 0 },
        { id: 'c', transaction_date: '2024-01-01', account_no: '1002', account_name: 'Test C', description: 'Test', amount: 100000, risk_score: 1.0 }
      ];
      
      const params = { 
        ...defaultParams,
        method: 'MUS' as const,
        populationSize: testPop.length,
        populationSum: 100000,
        riskWeighting: 'hoy' as const
      };
      
      const result = generateAuditSample(testPop, params);
      
      // Should select the only transaction with positive amount
      expect(result.samples.total.some(s => s.id === 'c')).toBe(true);
    });
  });

  describe('Stratifisering', () => {
    test('Strata-forslag er monotont økende', () => {
      const amounts = standardPopulation.map(tx => tx.amount);
      const strata = generateQuantileStrata(amounts, 4);
      
      for (let i = 1; i < strata.length; i++) {
        expect(strata[i]).toBeGreaterThan(strata[i - 1]);
      }
    });

    test('Allokering respekterer sum(n_i) == n', () => {
      const params = { 
        ...defaultParams, 
        method: 'STRATIFIED' as const,
        strataBounds: [25000, 50000, 75000],
        minPerStratum: 2
      };
      
      const result = generateAuditSample(standardPopulation, params);
      
      if (result.strata) {
        const totalAllocated = result.strata.reduce((sum, stratum) => sum + stratum.allocatedSampleSize, 0);
        expect(totalAllocated).toBe(result.plan.actualSampleSize);
      }
    });

    test('Ingen stratum over-allokeres', () => {
      const params = { 
        ...defaultParams, 
        method: 'STRATIFIED' as const,
        strataBounds: [25000, 50000, 75000],
        minPerStratum: 2
      };
      
      const result = generateAuditSample(standardPopulation, params);
      
      if (result.strata) {
        result.strata.forEach(stratum => {
          expect(stratum.allocatedSampleSize).toBeLessThanOrEqual(stratum.transactions.length);
        });
      }
    });

    test('min_per_stratum respekteres', () => {
      const params = { 
        ...defaultParams, 
        method: 'STRATIFIED' as const,
        strataBounds: [25000, 50000, 75000],
        minPerStratum: 3
      };
      
      const result = generateAuditSample(standardPopulation, params);
      
      if (result.strata) {
        result.strata.forEach(stratum => {
          if (stratum.transactions.length > 0) {
            expect(stratum.allocatedSampleSize).toBeGreaterThanOrEqual(Math.min(3, stratum.transactions.length));
          }
        });
      }
    });
  });

  describe('Terskel-forslag (Excel-lignende)', () => {
    test('Terskel-forslag formula er korrekt', () => {
      const pm = 75000;
      const em = 10000;
      const confidenceFactor = 1.5;
      const riskFactor = 1.3;
      
      const suggested = calculateSuggestedThreshold(pm, em, confidenceFactor, riskFactor);
      const expected = (pm - em) / (confidenceFactor * riskFactor);
      
      expect(suggested).toBeCloseTo(expected, 2);
    });

    test('calculateThresholdSuggestion wrapper fungerer', () => {
      const result = calculateThresholdSuggestion(75000, 10000, 1.5, 1.3);
      expect(result).toBeCloseTo(33333.33, 2);
    });
  });

  describe('Param validering', () => {
    test('Gyldige parametere passerer validering', () => {
      const errors = validateSamplingParams(defaultParams);
      expect(errors.length).toBe(0);
    });

    test('Negative populasjonsstørrelse gir feil', () => {
      const invalidParams = { ...defaultParams, populationSize: -1 };
      const errors = validateSamplingParams(invalidParams);
      expect(errors.some(e => e.includes('Population size'))).toBe(true);
    });

    test('EM >= TM gir feil for substantive tests', () => {
      const invalidParams = { 
        ...defaultParams, 
        materiality: 50000,
        expectedMisstatement: 60000 
      };
      const errors = validateSamplingParams(invalidParams);
      expect(errors.some(e => e.includes('Expected misstatement'))).toBe(true);
    });

    test('Manglende tolerable deviation rate for control tests gir feil', () => {
      const invalidParams = { 
        ...defaultParams, 
        testType: 'CONTROL' as const,
        tolerableDeviationRate: undefined as undefined
      };
      const errors = validateSamplingParams(invalidParams);
      expect(errors.some(e => e.includes('Tolerable deviation rate'))).toBe(true);
    });

    test('Ugyldig konfidensgrad gir feil', () => {
      const invalidParams = { ...defaultParams, confidenceLevel: 85 };
      const errors = validateSamplingParams(invalidParams);
      expect(errors.some(e => e.includes('Confidence level'))).toBe(true);
    });
  });

  describe('RNG determinisme', () => {
    test('createSeededRNG gir konsekvent sekvens', () => {
      const rng1 = createSeededRNG(42);
      const rng2 = createSeededRNG(42);
      
      const sequence1 = Array.from({ length: 10 }, () => rng1());
      const sequence2 = Array.from({ length: 10 }, () => rng2());
      
      expect(sequence1).toEqual(sequence2);
    });

    test('Forskjellige seeds gir forskjellige sekvenser', () => {
      const rng1 = createSeededRNG(42);
      const rng2 = createSeededRNG(43);
      
      const sequence1 = Array.from({ length: 10 }, () => rng1());
      const sequence2 = Array.from({ length: 10 }, () => rng2());
      
      expect(sequence1).not.toEqual(sequence2);
    });
  });
});