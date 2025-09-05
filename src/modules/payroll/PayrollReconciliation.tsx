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
import { useEnhancedReconciliationCalculator } from '@/components/Payroll/EnhancedReconciliationCalculator';

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

  // Use enhanced reconciliation calculator with debugging
  const reconciliationData = useEnhancedReconciliationCalculator({
    payrollSummary: payrollSummary || {},
    glEntries: effectiveGlEntries,
    internalCodes,
    mappingRules,
    accountLookup
  });

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