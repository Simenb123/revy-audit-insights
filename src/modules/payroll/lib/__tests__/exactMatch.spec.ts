import { describe, it, expect } from 'vitest';
import { findExactMatches, generateExclusiveRules, type ExactMatchResult } from '../exactMatch';
import type { GLEntry } from '../tb';

export interface MappingRule {
  id: string;
  account: string;
  code: string;
  strategy: 'exclusive' | 'split' | 'score';
  split?: number;
  weight: number;
  keywords: string[];
  regex: string;
  priority: number;
  month_hints: number[];
}

describe('exactMatch', () => {
  const mockGLEntries: GLEntry[] = [
    { account: '5000', text: 'Fastlønn januar', amount: 50000 },
    { account: '5000', text: 'Fastlønn februar', amount: 50000 },
    { account: '5010', text: 'Timelønn mars', amount: 25000 },
    { account: '5010', text: 'Timelønn april', amount: 35000 },
    { account: '5020', text: 'Bonus Q1', amount: 100000 },
    { account: '5020', text: 'Bonus Q2', amount: 40000 },
    { account: '5000', text: 'Fastlønn desember', amount: 240000 },
  ];

  const mockRules: MappingRule[] = [
    {
      id: '1',
      account: '5000',
      code: 'fastlon',
      strategy: 'score',
      weight: 2,
      keywords: ['fastlønn'],
      regex: '',
      priority: 1,
      month_hints: []
    },
    {
      id: '2', 
      account: '5010',
      code: 'timelon',
      strategy: 'score',
      weight: 1,
      keywords: ['timelønn'],
      regex: '',
      priority: 1,
      month_hints: []
    },
    {
      id: '3',
      account: '5020', 
      code: 'bonus',
      strategy: 'score',
      weight: 1,
      keywords: ['bonus'],
      regex: '',
      priority: 1,
      month_hints: []
    }
  ];

  it('T1: should find exact match for single line (Bonus 50,000)', () => {
    const targets = { bonus: 50000 };
    const results = findExactMatches(mockGLEntries, targets, mockRules, 5);
    
    expect(results.bonus.exact).toBeTruthy();
    expect(results.bonus.exact).toHaveLength(1);
    expect(results.bonus.exact![0].amount).toBe(50000);
    expect(results.bonus.exact![0].text).toContain('Bonus');
  });

  it('T2: should find exact match for two lines (Fastlønn 240k + 240k)', () => {
    // Adding another 240k entry to test two-line match
    const extendedEntries = [
      ...mockGLEntries,
      { account: '5000', text: 'Fastlønn ekstra', amount: 240000 }
    ];
    
    const targets = { fastlon: 480000 }; // 240k + 240k
    const results = findExactMatches(extendedEntries, targets, mockRules, 5);
    
    expect(results.fastlon.exact).toBeTruthy();
    expect(results.fastlon.exact).toHaveLength(2);
    
    const totalAmount = results.fastlon.exact!.reduce((sum, entry) => sum + entry.amount, 0);
    expect(totalAmount).toBe(480000);
  });

  it('T3: should apply tie-breaking rules (prefer fewer lines)', () => {
    // Test scenario: target 100,000 can be matched by:
    // Option A: 1 line (100,000)
    // Option B: 2 lines (60,000 + 40,000)
    const testEntries: GLEntry[] = [
      { account: '5020', text: 'Bonus Q1', amount: 100000 }, // Option A
      { account: '5020', text: 'Bonus partial 1', amount: 60000 }, // Option B part 1
      { account: '5020', text: 'Bonus partial 2', amount: 40000 }, // Option B part 2
    ];

    const targets = { bonus: 100000 };
    const results = findExactMatches(testEntries, targets, mockRules, 5);
    
    expect(results.bonus.exact).toBeTruthy();
    expect(results.bonus.exact).toHaveLength(1); // Should choose single line over two lines
    expect(results.bonus.exact![0].amount).toBe(100000);
    expect(results.bonus.exact![0].text).toBe('Bonus Q1');
  });

  it('T4: should handle mapping split correctly', () => {
    const a07Totals = {
      timelon: 350000,
      fasttillegg: 50000,
      fastlon: 600000
    };

    // Entries that map to different internal codes
    const testEntries: GLEntry[] = [
      { account: '5010', text: 'Timelønn total', amount: 350000 },
      { account: '5020', text: 'Fast tillegg', amount: 50000 },
      { account: '5000', text: 'Fastlønn total', amount: 600000 },
    ];

    const testRules: MappingRule[] = [
      { id: '1', account: '5000', code: 'fastlon', strategy: 'exclusive', weight: 1, keywords: [], regex: '', priority: 1, month_hints: [] },
      { id: '2', account: '5010', code: 'timelon', strategy: 'exclusive', weight: 1, keywords: [], regex: '', priority: 1, month_hints: [] },
      { id: '3', account: '5020', code: 'fasttillegg', strategy: 'exclusive', weight: 1, keywords: [], regex: '', priority: 1, month_hints: [] },
    ];

    const results = findExactMatches(testEntries, a07Totals, testRules, 5);

    // All should have exact matches
    expect(results.fastlon.exact).toHaveLength(1);
    expect(results.fastlon.exact![0].amount).toBe(600000);
    
    expect(results.timelon.exact).toHaveLength(1);
    expect(results.timelon.exact![0].amount).toBe(350000);
    
    expect(results.fasttillegg.exact).toHaveLength(1);
    expect(results.fasttillegg.exact![0].amount).toBe(50000);
  });

  it('should handle tolerance correctly (±5 kr)', () => {
    const testEntries: GLEntry[] = [
      { account: '5000', text: 'Fastlønn approx', amount: 49998 }, // 2 kr under
      { account: '5010', text: 'Timelønn over', amount: 50003 },   // 3 kr over
      { account: '5020', text: 'Bonus too far', amount: 50010 },   // 10 kr over (outside tolerance)
    ];

    const targets = { 
      fastlon: 50000,
      timelon: 50000,
      bonus: 50000
    };

    const results = findExactMatches(testEntries, targets, mockRules, 5);

    // First two should match within tolerance
    expect(results.fastlon.exact).toHaveLength(1);
    expect(results.timelon.exact).toHaveLength(1);
    
    // Third should not match (outside tolerance)
    expect(results.bonus.exact).toBeNull();
  });

  it('should prefer higher weight when line count is equal', () => {
    const testEntries: GLEntry[] = [
      { account: '5000', text: 'High weight match', amount: 50000 },
      { account: '5999', text: 'Low weight match', amount: 50000 },
    ];

    const testRules: MappingRule[] = [
      { id: '1', account: '5000', code: 'fastlon', strategy: 'score', weight: 10, keywords: [], regex: '', priority: 1, month_hints: [] },
      { id: '2', account: '5999', code: 'fastlon', strategy: 'score', weight: 1, keywords: [], regex: '', priority: 1, month_hints: [] },
    ];

    const targets = { fastlon: 50000 };
    const results = findExactMatches(testEntries, targets, testRules, 5);

    expect(results.fastlon.exact).toHaveLength(1);
    expect(results.fastlon.exact![0].account).toBe('5000'); // Should prefer higher weight
  });

  it('should return alternatives when no exact match found', () => {
    const testEntries: GLEntry[] = [
      { account: '5000', text: 'Close match 1', amount: 49990 }, // 10 kr under (outside tolerance)
      { account: '5000', text: 'Close match 2', amount: 50010 }, // 10 kr over (outside tolerance)
    ];

    const targets = { fastlon: 50000 };
    const results = findExactMatches(testEntries, targets, mockRules, 5);

    expect(results.fastlon.exact).toBeNull();
    expect(results.fastlon.alternatives).toBeDefined();
    expect(results.fastlon.alternatives.length).toBeGreaterThan(0);
  });
});