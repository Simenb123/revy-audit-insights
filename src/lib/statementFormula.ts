export interface FormulaTerm {
  account_number: string;
  operator?: string;
}

export interface FormulaObject {
  type: 'formula';
  terms: FormulaTerm[];
}

export class StatementFormulaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StatementFormulaError';
  }
}

export type StatementFormula = string | FormulaObject;

/**
 * Evaluate a statement formula. Supports formulas specified as JSON objects
 * or as strings containing operators (+, -, *, /) and parentheses.
 */
export function evaluateStatementFormula(
  formula: StatementFormula,
  getLineAmount: (lineNumber: string) => number
): number {
  if (!formula) return 0;

  if (typeof formula === 'object' && formula.type === 'formula' && Array.isArray(formula.terms)) {
    return evaluateObjectFormula(formula, getLineAmount);
  }

  if (typeof formula === 'string') {
    return evaluateStringFormula(formula, getLineAmount);
  }

  throw new StatementFormulaError('Unsupported formula format');
}

function evaluateObjectFormula(
  formula: FormulaObject,
  getLineAmount: (lineNumber: string) => number
): number {
  let result = 0;
  let first = true;

  for (const term of formula.terms) {
    const value = getNumericLineAmount(term.account_number, getLineAmount);
    const operator = term.operator || '+';

    if (first) {
      result = value;
      first = false;
      continue;
    }

    switch (operator) {
      case '+':
        result += value;
        break;
      case '-':
        result -= value;
        break;
      case '*':
        result *= value;
        break;
      case '/':
        result /= value;
        break;
      default:
        throw new StatementFormulaError(`Unsupported operator: ${operator}`);
    }
  }

  return result;
}

function evaluateStringFormula(
  formula: string,
  getLineAmount: (lineNumber: string) => number
): number {
  const sanitized = formula.replace(/\s+/g, '');
  if (sanitized === '') return 0;

  const tokenRegex = /\d+(?:\.\d+)?|[()+\-*/]/g;
  const tokens: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(sanitized)) !== null) {
    tokens.push(match[0]);
  }

  if (tokens.join('') !== sanitized) {
    throw new StatementFormulaError(`Invalid characters in formula: ${formula}`);
  }

  const values: (number | string)[] = tokens.map(token => {
    if (/^\d/.test(token)) {
      return getNumericLineAmount(token, getLineAmount);
    }
    return token;
  });

  const rpn = toRPN(values);
  return evaluateRPN(rpn);
}

function getNumericLineAmount(line: string, getLineAmount: (lineNumber: string) => number): number {
  const value = getLineAmount(line);
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new StatementFormulaError(`Unknown line reference: ${line}`);
  }
  return value;
}

function toRPN(tokens: (number | string)[]): (number | string)[] {
  const output: (number | string)[] = [];
  const operators: string[] = [];
  const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

  tokens.forEach(token => {
    if (typeof token === 'number') {
      output.push(token);
    } else if (token in precedence) {
      while (
        operators.length &&
        operators[operators.length - 1] !== '(' &&
        precedence[operators[operators.length - 1]] >= precedence[token]
      ) {
        output.push(operators.pop()!);
      }
      operators.push(token);
    } else if (token === '(') {
      operators.push(token);
    } else if (token === ')') {
      let found = false;
      while (operators.length) {
        const op = operators.pop()!;
        if (op === '(') {
          found = true;
          break;
        }
        output.push(op);
      }
      if (!found) {
        throw new StatementFormulaError('Mismatched parentheses');
      }
    } else {
      throw new StatementFormulaError(`Invalid token: ${token}`);
    }
  });

  while (operators.length) {
    const op = operators.pop()!;
    if (op === '(') {
      throw new StatementFormulaError('Mismatched parentheses');
    }
    output.push(op);
  }

  return output;
}

function evaluateRPN(rpn: (number | string)[]): number {
  const stack: number[] = [];

  for (const token of rpn) {
    if (typeof token === 'number') {
      stack.push(token);
    } else if (typeof token === 'string') {
      if (stack.length < 2) {
        throw new StatementFormulaError('Invalid expression');
      }
      const b = stack.pop()!;
      const a = stack.pop()!;
      switch (token) {
        case '+':
          stack.push(a + b);
          break;
        case '-':
          stack.push(a - b);
          break;
        case '*':
          stack.push(a * b);
          break;
        case '/':
          stack.push(a / b);
          break;
        default:
          throw new StatementFormulaError(`Unsupported operator: ${token}`);
      }
    }
  }

  if (stack.length !== 1) {
    throw new StatementFormulaError('Invalid expression');
  }

  return stack[0];
}

