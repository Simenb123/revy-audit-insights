import React, { useMemo } from 'react';
import { MappingRule } from '@/modules/payroll/hooks/useMappingRules';
import { InternalCode } from '@/modules/payroll/hooks/useCodes';

interface GLEntry {
  account: string;
  text: string;
  amount: number;
  date?: Date;
}

interface PayrollSummary {
  bruttolonn?: number;
  trekkPerson?: number;
  agaInns?: number;
  feriepenger?: number;
  pensjon?: number;
}

interface AccountLookup {
  name: string;
  balance: number;
}

interface ReconciliationResult {
  code: string;
  description: string;
  accounts: string[];
  accountNames: string[];
  accountDetails: Array<{ 
    account: string; 
    name: string; 
    amount: number; 
    source: 'TB' | 'A07' | 'Rule';
    matchedRule?: string;
  }>;
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  amelding: number;
  difference: number;
  dataSource: { A07: boolean; TB: boolean; Rules: number };
  debugSteps: Array<{
    step: number;
    description: string;
    calculation?: string;
    value: number;
    accounts?: Array<{
      account: string;
      name: string;
      amount: number;
      operation: '+' | '-' | '=';
    }>;
    rules?: Array<{
      id: string;
      pattern: string;
      matched: boolean;
    }>;
    status: 'success' | 'warning' | 'error' | 'info';
  }>;
}

interface EnhancedReconciliationCalculatorProps {
  payrollSummary: PayrollSummary;
  glEntries: GLEntry[];
  internalCodes: InternalCode[];
  mappingRules: MappingRule[];
  accountLookup: Map<string, AccountLookup>;
}

export const useEnhancedReconciliationCalculator = ({
  payrollSummary,
  glEntries,
  internalCodes,
  mappingRules,
  accountLookup
}: EnhancedReconciliationCalculatorProps): ReconciliationResult[] => {
  
  return useMemo(() => {
    const results: ReconciliationResult[] = [];
    
    // Create A07 totals mapping
    const a07Totals: Record<string, number> = {};
    if (payrollSummary.bruttolonn !== undefined) a07Totals['fastlonn'] = payrollSummary.bruttolonn;
    if (payrollSummary.trekkPerson !== undefined) a07Totals['forskuddstrekk'] = payrollSummary.trekkPerson;
    if (payrollSummary.agaInns !== undefined) a07Totals['arbeidsgiveravgift'] = payrollSummary.agaInns;
    if (payrollSummary.feriepenger !== undefined) a07Totals['feriepenger'] = payrollSummary.feriepenger;
    if (payrollSummary.pensjon !== undefined) a07Totals['pensjon'] = payrollSummary.pensjon;

    internalCodes.forEach(internalCode => {
      const debugSteps: ReconciliationResult['debugSteps'] = [];
      let stepCounter = 1;
      
      // Step 1: Get A07 amount
      const A = a07Totals[internalCode.id] || 0;
      debugSteps.push({
        step: stepCounter++,
        description: `Hent ${internalCode.label} fra A07-melding`,
        calculation: `A = ${A.toLocaleString('no-NO')}`,
        value: A,
        status: A > 0 ? 'success' : 'warning'
      });

      let B = 0, C = 0;
      const accountsUsed = new Set<string>();
      const accountDetails: ReconciliationResult['accountDetails'] = [];
      
      // Step 2: Find relevant mapping rules
      const relevantRules = mappingRules.filter(rule => rule.code === internalCode.id);
      debugSteps.push({
        step: stepCounter++,
        description: `Søk etter mapping-regler for ${internalCode.id}`,
        calculation: `Funnet ${relevantRules.length} regler`,
        value: relevantRules.length,
        rules: relevantRules.map(rule => ({
          id: rule.id,
          pattern: rule.regex || rule.account || 'Ukjent mønster',
          matched: false
        })),
        status: relevantRules.length > 0 ? 'success' : 'warning'
      });

      // Step 3: Apply rules to GL entries
      const ruleAccountDetails: ReconciliationResult['accountDetails'] = [];
      
      glEntries.forEach(entry => {
        const matchingRule = relevantRules.find(rule => {
          // Account matching
          if (rule.account && entry.account.includes(rule.account)) {
            return true;
          }
          
          // Regex matching
          if (rule.regex) {
            try {
              const regex = new RegExp(rule.regex, 'i');
              if (regex.test(entry.account) || regex.test(entry.text)) {
                return true;
              }
            } catch (e) {
              console.warn('Invalid regex in rule:', rule.regex);
            }
          }
          
          return false;
        });
        
        if (matchingRule) {
          accountsUsed.add(entry.account);
          const accountInfo = accountLookup.get(entry.account);
          
          const detail = {
            account: entry.account,
            name: accountInfo?.name || entry.text || entry.account,
            amount: entry.amount,
            source: 'Rule' as const,
            matchedRule: matchingRule.id
          };
          
          accountDetails.push(detail);
          ruleAccountDetails.push(detail);
          
          // Apply amount based on account type and strategy
          if (entry.account.match(/^29[45]/)) {
            // Accrual accounts (294x/295x) - holiday pay logic
            if (entry.amount < 0) {
              B += Math.abs(entry.amount);
            } else {
              C += entry.amount;
            }
          } else {
            // Regular accounts - follow rule strategy
            if (matchingRule.strategy === 'exclusive') {
              if (entry.amount < 0) {
                B += Math.abs(entry.amount);
              } else {
                C += entry.amount;
              }
            }
          }
        }
      });

      if (ruleAccountDetails.length > 0) {
        debugSteps.push({
          step: stepCounter++,
          description: `Anvend mapping-regler på ${ruleAccountDetails.length} kontoer`,
          calculation: `B += negative_amounts, C += positive_amounts`,
          value: ruleAccountDetails.length,
          accounts: ruleAccountDetails.map(detail => ({
            account: detail.account,
            name: detail.name,
            amount: detail.amount,
            operation: detail.amount < 0 ? '-' : '+' as const
          })),
          status: 'success'
        });
      }

      // Step 4: Fallback logic for holiday pay if no rules found
      if (relevantRules.length === 0 && internalCode.id === 'feriepenger') {
        debugSteps.push({
          step: stepCounter++,
          description: 'Ingen spesifikke regler funnet, anvender fallback-logikk for feriepenger',
          calculation: 'Søk etter 294x/295x kontoer',
          value: 0,
          status: 'warning'
        });

        const fallbackAccountDetails: ReconciliationResult['accountDetails'] = [];
        
        glEntries.forEach(entry => {
          const accountNum = entry.account.replace(/\D/g, '');
          const first3Digits = accountNum.substring(0, 3);
          
          if (first3Digits === '294' || first3Digits === '295') {
            accountsUsed.add(entry.account);
            const accountInfo = accountLookup.get(entry.account);
            
            const detail = {
              account: entry.account,
              name: accountInfo?.name || entry.text || entry.account,
              amount: entry.amount,
              source: 'TB' as const
            };
            
            accountDetails.push(detail);
            fallbackAccountDetails.push(detail);
            
            if (entry.amount < 0) {
              B += Math.abs(entry.amount);
            } else {
              C += entry.amount;
            }
          }
        });

        if (fallbackAccountDetails.length > 0) {
          debugSteps.push({
            step: stepCounter++,
            description: `Fallback: Funnet ${fallbackAccountDetails.length} avsetningskontoer for feriepenger`,
            calculation: `294x/295x kontoer: B += ${fallbackAccountDetails.filter(d => d.amount < 0).length} negative, C += ${fallbackAccountDetails.filter(d => d.amount >= 0).length} positive`,
            value: fallbackAccountDetails.length,
            accounts: fallbackAccountDetails.map(detail => ({
              account: detail.account,
              name: detail.name,
              amount: detail.amount,
              operation: detail.amount < 0 ? '-' : '+' as const
            })),
            status: 'success'
          });
        }
      }

      // Step 5: Calculate D = A + B - C
      const D = A + B - C;
      debugSteps.push({
        step: stepCounter++,
        description: 'Beregn justert beløp',
        calculation: `D = A + B - C = ${A.toLocaleString('no-NO')} + ${B.toLocaleString('no-NO')} - ${C.toLocaleString('no-NO')} = ${D.toLocaleString('no-NO')}`,
        value: D,
        status: 'info'
      });

      // Step 6: Calculate E (amount to report for AGA)
      const E = internalCode.aga ? D : 0;
      debugSteps.push({
        step: stepCounter++,
        description: `Beregn beløp å melde for arbeidsgiveravgift`,
        calculation: `E = ${internalCode.aga ? 'D' : '0'} = ${E.toLocaleString('no-NO')}`,
        value: E,
        status: 'info'
      });

      // Step 7: Calculate difference
      const amelding = A; // A07 reported amount
      const difference = Math.abs(D - amelding);
      debugSteps.push({
        step: stepCounter++,
        description: 'Beregn avvik mellom beregnet og meldt beløp',
        calculation: `Avvik = |D - A| = |${D.toLocaleString('no-NO')} - ${amelding.toLocaleString('no-NO')}| = ${difference.toLocaleString('no-NO', { minimumFractionDigits: 2 })}`,
        value: difference,
        status: difference <= 0.01 ? 'success' : difference <= 5 ? 'warning' : 'error'
      });

      results.push({
        code: internalCode.id,
        description: internalCode.label,
        accounts: Array.from(accountsUsed),
        accountNames: Array.from(accountsUsed).map(account => accountLookup.get(account)?.name || account),
        accountDetails,
        A,
        B,
        C,
        D,
        E,
        amelding,
        difference,
        dataSource: {
          A07: A > 0,
          TB: accountDetails.some(d => d.source === 'TB'),
          Rules: relevantRules.length
        },
        debugSteps
      });
    });

    return results;
  }, [payrollSummary, glEntries, internalCodes, mappingRules, accountLookup]);
};