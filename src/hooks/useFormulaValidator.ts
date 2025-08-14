import { useState, useEffect } from 'react';

export interface ValidationError {
  type: 'syntax' | 'circular' | 'reference' | 'division_by_zero';
  message: string;
  position?: number;
  suggestions?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  usedAccounts: string[];
  complexity: 'low' | 'medium' | 'high';
}

interface FormulaValidatorOptions {
  allowedAccounts?: string[];
  maxDepth?: number;
  enableCircularCheck?: boolean;
}

export function useFormulaValidator(options: FormulaValidatorOptions = {}) {
  const {
    allowedAccounts = [],
    maxDepth = 10,
    enableCircularCheck = true
  } = options;

  const validateSyntax = (formula: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    
    // Basic syntax checks
    const brackets = formula.match(/[()]/g) || [];
    let openBrackets = 0;
    
    for (let i = 0; i < brackets.length; i++) {
      if (brackets[i] === '(') openBrackets++;
      else openBrackets--;
      
      if (openBrackets < 0) {
        errors.push({
          type: 'syntax',
          message: 'Ubalanserte parenteser - for mange lukkende parenteser',
          position: formula.indexOf(')', i)
        });
        break;
      }
    }
    
    if (openBrackets > 0) {
      errors.push({
        type: 'syntax',
        message: 'Ubalanserte parenteser - mangler lukkende parenteser',
        suggestions: ['Legg til ")" på slutten av formelen']
      });
    }

    // Check for consecutive operators
    const consecutiveOps = /[+\-*/]{2,}/g;
    const matches = [...formula.matchAll(consecutiveOps)];
    matches.forEach(match => {
      errors.push({
        type: 'syntax',
        message: `Konsekutive operatorer funnet: "${match[0]}"`,
        position: match.index,
        suggestions: ['Fjern eller kombiner operatorer', 'Legg til tall eller kontonummer mellom operatorer']
      });
    });

    // Check for division by zero
    const divisionByZero = /\/\s*0(?!\d)/g;
    const divMatches = [...formula.matchAll(divisionByZero)];
    divMatches.forEach(match => {
      errors.push({
        type: 'division_by_zero',
        message: 'Divisjon med null er ikke tillatt',
        position: match.index,
        suggestions: ['Bytt ut 0 med et kontonummer eller annet tall']
      });
    });

    // Check for invalid characters
    const validPattern = /^[0-9+\-*/().\s]+$/;
    if (!validPattern.test(formula)) {
      errors.push({
        type: 'syntax',
        message: 'Ugyldig tegn i formel - kun tall, operatorer (+, -, *, /) og parenteser er tillatt',
        suggestions: ['Fjern spesialtegn', 'Bruk kun tall og regneoperatorer']
      });
    }

    return errors;
  };

  const extractAccounts = (formula: string): string[] => {
    // Extract account numbers (3-4 digit numbers)
    const accountPattern = /\b\d{3,4}\b/g;
    return [...formula.matchAll(accountPattern)].map(match => match[0]);
  };

  const validateReferences = (formula: string): ValidationError[] => {
    const errors: ValidationError[] = [];
    const usedAccounts = extractAccounts(formula);
    
    if (allowedAccounts.length > 0) {
      usedAccounts.forEach(account => {
        if (!allowedAccounts.includes(account)) {
          errors.push({
            type: 'reference',
            message: `Kontonummer ${account} finnes ikke i kontoplanen`,
            suggestions: [
              'Sjekk om kontonummeret er riktig',
              'Velg et kontonummer fra kontoplanen'
            ]
          });
        }
      });
    }

    return errors;
  };

  const detectCircularReferences = (
    formula: string, 
    formulaId?: string,
    allFormulas: Array<{ id: string; formula_expression: string }> = []
  ): ValidationError[] => {
    if (!enableCircularCheck || !formulaId) return [];
    
    const errors: ValidationError[] = [];
    const visited = new Set<string>();
    const stack = new Set<string>();
    
    const checkCircular = (currentId: string, depth = 0): boolean => {
      if (depth > maxDepth) {
        errors.push({
          type: 'circular',
          message: 'Maksimal dybde nådd - mulig sirkulær referanse',
          suggestions: ['Forenkle formelen', 'Reduser antall nestede referanser']
        });
        return true;
      }
      
      if (stack.has(currentId)) {
        errors.push({
          type: 'circular',
          message: 'Sirkulær referanse oppdaget',
          suggestions: ['Fjern referanser som peker tilbake til denne formelen']
        });
        return true;
      }
      
      if (visited.has(currentId)) return false;
      
      visited.add(currentId);
      stack.add(currentId);
      
      // Check if current formula references other formulas
      const currentFormula = allFormulas.find(f => f.id === currentId);
      if (currentFormula) {
        const referencedFormulas = allFormulas.filter(f => 
          currentFormula.formula_expression.includes(f.id)
        );
        
        for (const ref of referencedFormulas) {
          if (checkCircular(ref.id, depth + 1)) {
            return true;
          }
        }
      }
      
      stack.delete(currentId);
      return false;
    };
    
    checkCircular(formulaId);
    return errors;
  };

  const calculateComplexity = (formula: string): 'low' | 'medium' | 'high' => {
    const operators = formula.match(/[+\-*/]/g) || [];
    const brackets = formula.match(/[()]/g) || [];
    const accounts = extractAccounts(formula);
    
    const score = operators.length + brackets.length * 0.5 + accounts.length * 0.3;
    
    if (score <= 5) return 'low';
    if (score <= 15) return 'medium';
    return 'high';
  };

  const validate = (
    formula: string,
    formulaId?: string,
    allFormulas?: Array<{ id: string; formula_expression: string }>
  ): ValidationResult => {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    
    // Run all validations
    errors.push(...validateSyntax(formula));
    errors.push(...validateReferences(formula));
    errors.push(...detectCircularReferences(formula, formulaId, allFormulas));
    
    const usedAccounts = extractAccounts(formula);
    const complexity = calculateComplexity(formula);
    
    // Add complexity warnings
    if (complexity === 'high') {
      warnings.push('Høy kompleksitet - vurder å dele opp formelen');
    }
    
    if (usedAccounts.length > 10) {
      warnings.push('Mange kontoer i bruk - kan påvirke ytelsen');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      usedAccounts,
      complexity
    };
  };

  return {
    validate,
    validateSyntax,
    validateReferences,
    detectCircularReferences,
    extractAccounts,
    calculateComplexity
  };
}