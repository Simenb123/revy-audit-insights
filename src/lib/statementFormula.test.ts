import { describe, expect, it } from 'vitest';
import {
  evaluateStatementFormula,
  StatementFormulaError,
  FormulaObject
} from './statementFormula';

const resolver = (map: Record<string, number>) => (line: string) => {
  if (line in map) return map[line];
  return NaN;
};

describe('evaluateStatementFormula', () => {
  const values = { '1': 100, '2': 200, '3': 10 };
  const getLineAmount = resolver(values);

  it('evaluates simple addition', () => {
    expect(evaluateStatementFormula('1 + 2', getLineAmount)).toBe(300);
  });

  it('respects operator precedence', () => {
    expect(evaluateStatementFormula('1 + 2 * 3', getLineAmount)).toBe(100 + 200 * 10);
  });

  it('handles parentheses', () => {
    expect(evaluateStatementFormula('(1 + 2) * 3', getLineAmount)).toBe((100 + 200) * 10);
  });

  it('supports division', () => {
    expect(evaluateStatementFormula('2 / 3', getLineAmount)).toBeCloseTo(200 / 10);
  });

  it('throws on invalid token', () => {
    expect(() => evaluateStatementFormula('1 + a', getLineAmount)).toThrow(StatementFormulaError);
  });

  it('throws on mismatched parentheses', () => {
    expect(() => evaluateStatementFormula('(1 + 2', getLineAmount)).toThrow('Mismatched parentheses');
  });

  it('throws on invalid expression', () => {
    expect(() => evaluateStatementFormula('1 ++ 2', getLineAmount)).toThrow(StatementFormulaError);
  });

  it('evaluates JSON formula objects', () => {
    const formula: FormulaObject = {
      type: 'formula',
      terms: [
        { account_number: '1', operator: '+' },
        { account_number: '2', operator: '-' }
      ]
    };
    expect(evaluateStatementFormula(formula, getLineAmount)).toBe(100 - 200);
  });

  it('throws on unknown line reference', () => {
    expect(() => evaluateStatementFormula('1 + 4', getLineAmount)).toThrow('Unknown line reference: 4');
  });
});

