import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import StickyClientLayout from '@/components/Layout/StickyClientLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import StreamlinedReconciliationView from '@/components/Payroll/StreamlinedReconciliationView';

// Import our custom hooks and utilities
import { useAllCodes } from './hooks/useCodes';
import { useMappingRules } from './hooks/useMappingRules';
import { usePayrollImports, usePayrollSummary } from '@/hooks/usePayrollImports';
import { useTrialBalanceData } from '@/hooks/useTrialBalanceData';
import { useActiveTrialBalanceVersion } from '@/hooks/useActiveTrialBalanceVersion';
import { extractEmployeeIncomeRows, type A07ParseResult } from './lib/a07-parser';

const PayrollReconciliation = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { data: client, isLoading, error } = useClientDetails(clientId || '');
  const { setSelectedClientId } = useFiscalYear();

  // Fetch data
  const { ameldingCodes, ameldingCodeMap, internalCodes, isLoading: codesLoading } = useAllCodes();
  const { data: mappingRules = [], isLoading: rulesLoading } = useMappingRules(clientId || '');

  // Fetch existing data from database
  const { selectedFiscalYear } = useFiscalYear();
  const { data: payrollImports = [] } = usePayrollImports(clientId || '');
  const { data: activeTrialBalanceVersion } = useActiveTrialBalanceVersion(clientId || '', selectedFiscalYear);
  const { data: trialBalanceData = [] } = useTrialBalanceData(clientId || '', activeTrialBalanceVersion?.version, selectedFiscalYear);
  
  // Get the most recent payroll import for summary data
  const latestPayrollImport = payrollImports[0];
  const { data: payrollSummary } = usePayrollSummary(latestPayrollImport?.id);

  // Convert trial balance data to GL entries format for existing logic
  const effectiveGlEntries = useMemo(() => {
    if (!trialBalanceData.length) return [];
    
    return trialBalanceData.map(entry => ({
      account: entry.account_number,
      text: entry.account_name,
      amount: entry.closing_balance,
      date: entry.period_end_date ? new Date(entry.period_end_date) : undefined
    }));
  }, [trialBalanceData]);

  // Auto-populate A07 data from database if available
  const effectiveA07Data = useMemo(() => {
    if (!payrollSummary) return null;
    
    const rows: any[] = [];
    const totals: Record<string, number> = {};
    const errors: string[] = [];
    
    // Map database payroll summary to internal codes using proper property access
    if (payrollSummary.bruttolonn !== undefined) {
      totals['fastlonn'] = payrollSummary.bruttolonn;
    }
    if (payrollSummary.trekkPerson !== undefined) {
      totals['forskuddstrekk'] = payrollSummary.trekkPerson;
    }
    if (payrollSummary.agaInns !== undefined) {
      totals['arbeidsgiveravgift'] = payrollSummary.agaInns;
    }

    return { rows, totals, errors };
  }, [payrollSummary]);

  // Create account lookup for names and traceability
  const accountLookup = useMemo(() => {
    const lookup = new Map<string, { name: string; balance: number }>();
    
    // Add trial balance accounts with names
    trialBalanceData.forEach(item => {
      lookup.set(item.account_number, {
        name: item.account_name || item.account_number,
        balance: item.closing_balance
      });
    });
    
    // Add GL entries if not in trial balance
    effectiveGlEntries.forEach(entry => {
      if (!lookup.has(entry.account)) {
        lookup.set(entry.account, {
          name: entry.text || entry.account,
          balance: entry.amount
        });
      }
    });
    
    return lookup;
  }, [trialBalanceData, effectiveGlEntries]);

  // Calculate reconciliation (A-E)
  const reconciliationData = useMemo(() => {
    if (!effectiveA07Data || effectiveGlEntries.length === 0 || !internalCodes.length) return [];

    const results: Array<{
      code: string;
      description: string;
      accounts: string[];
      accountNames: string[];
      accountDetails: Array<{ account: string; name: string; amount: number; source: 'TB' | 'A07' | 'Rule' }>;
      A: number;
      B: number;
      C: number;
      D: number;
      E: number;
      amelding: number;
      difference: number;
      dataSource: { A07: boolean; TB: boolean; Rules: number };
    }> = [];

    internalCodes.forEach(internalCode => {
      const A = effectiveA07Data.totals[internalCode.id] || 0;
      
      // B/C calculation based on mapping rules for this internal code
      let B = 0, C = 0;
      const accountsUsed = new Set<string>();
      const accountDetails: Array<{ account: string; name: string; amount: number; source: 'TB' | 'A07' | 'Rule' }> = [];
      
      // Get rules that map to this internal code
      const relevantRules = mappingRules.filter(rule => rule.code === internalCode.id);
      
      effectiveGlEntries.forEach(entry => {
        // Check if this GL entry matches any rule for this internal code
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
          
          accountDetails.push({
            account: entry.account,
            name: accountInfo?.name || entry.text || entry.account,
            amount: entry.amount,
            source: 'Rule'
          });
          
          // Apply strategy-based logic for accrual accounts (294x/295x)
          if (entry.account.match(/^29[45]/)) {
            if (entry.amount < 0) {
              B += Math.abs(entry.amount);
            } else {
              C += entry.amount;
            }
          }
        }
      });
      
      // Fallback: If no specific rules found, use default logic for accruals
      if (relevantRules.length === 0 && internalCode.id === 'feriepenger') {
        effectiveGlEntries.forEach(entry => {
          const accountNum = entry.account.replace(/\D/g, '');
          const first3Digits = accountNum.substring(0, 3);
          if (first3Digits === '294' || first3Digits === '295') {
            accountsUsed.add(entry.account);
            const accountInfo = accountLookup.get(entry.account);
            
            accountDetails.push({
              account: entry.account,
              name: accountInfo?.name || entry.text || entry.account,
              amount: entry.amount,
              source: 'TB'
            });
            
            if (entry.amount < 0) {
              B += Math.abs(entry.amount);
            } else {
              C += entry.amount;
            }
          }
        });
      }

      const D = A + B - C;
      const E = internalCode.aga ? D : 0;
      const amelding = A; // A07 reported amount
      const difference = Math.abs(D - amelding);

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
        }
      });
    });

    return results;
  }, [effectiveA07Data, effectiveGlEntries, internalCodes, mappingRules, accountLookup]);

  if (isLoading || codesLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Klient ikke funnet</h1>
          <p className="text-muted-foreground">Kunne ikke finne klient med ID {clientId}</p>
        </div>
      </div>
    );
  }

  return (
    <StickyClientLayout
      clientName={client.company_name || client.name}
      orgNumber={client.org_number}
      pageTitle="Kontrolloppstilling lønn"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          <div className="space-y-6 p-6">
            <StreamlinedReconciliationView
              reconciliationData={reconciliationData}
              isLoading={isLoading || codesLoading || rulesLoading}
              onRefresh={() => window.location.reload()}
              onExport={() => {
                toast({
                  title: 'Eksport',
                  description: 'Eksport funksjonalitet kommer snart...'
                });
              }}
              onUpdateNotes={(code, notes) => {
                console.log('Update notes for', code, ':', notes);
              }}
              onAcceptDiscrepancy={(code) => {
                toast({
                  title: 'Avvik godkjent',
                  description: `Avvik for ${code} er godkjent.`
                });
              }}
              onRejectDiscrepancy={(code) => {
                toast({
                  title: 'Avvik avvist',
                  description: `Avvik for ${code} er avvist og kan justeres via mapping.`
                });
              }}
            />
          </div>
        </div>
      </div>
    </StickyClientLayout>
  );
};

export default PayrollReconciliation;