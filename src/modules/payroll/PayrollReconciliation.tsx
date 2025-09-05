import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useClientDetails } from '@/hooks/useClientDetails';
import { useFiscalYear } from '@/contexts/FiscalYearContext';
import StickyClientLayout from '@/components/Layout/StickyClientLayout';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import StreamlinedReconciliationView from '@/components/Payroll/StreamlinedReconciliationView';
import { useReconciliationPersistence } from '@/hooks/useReconciliationPersistence';

// Import our custom hooks and utilities
import { useAllCodes } from './hooks/useCodes';
import { useMappingRules } from './hooks/useMappingRules';
import { usePayrollImports, usePayrollSummary } from '@/hooks/usePayrollImports';
import { useTrialBalanceData } from '@/hooks/useTrialBalanceData';
import { useActiveTrialBalanceVersion } from '@/hooks/useActiveTrialBalanceVersion';
import { extractEmployeeIncomeRows, type A07ParseResult } from './lib/a07-parser';
import { useEnhancedReconciliationCalculator } from '@/components/Payroll/EnhancedReconciliationCalculator';

export default function PayrollReconciliation() {
  const { clientId } = useParams();
  const client = useClientDetails(clientId);
  const {
    loading: persistenceLoading,
    saveReconciliationSession,
    saveNote,
    loadReconciliationHistory
  } = useReconciliationPersistence(clientId || '');

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

  // Loading and error states
  const loading = client?.isLoading || codesLoading || rulesLoading;
  const error = client?.error;

  // Enhanced functions with real implementation
  const handleRefresh = async () => {
    toast({
      title: "Oppdaterer data",
      description: "Henter ny data fra datakildene..."
    });
    // This would trigger data refresh in real implementation
    window.location.reload();
  };

  const handleExport = () => {
    if (!reconciliationData || reconciliationData.length === 0) {
      toast({
        title: "Ingen data å eksportere",
        description: "Utfør avstemming først for å generere eksportdata.",
        variant: "destructive"
      });
      return;
    }

    // Generate CSV export
    const csvHeader = "Kode,Beskrivelse,A07 Beløp,GL Beløp,Avvik,Status,Kontoer\n";
    const csvData = reconciliationData.map(item => {
      const status = Math.abs(item.difference) <= 0.01 ? 'Treff' : 
                   Math.abs(item.difference) <= 5 ? 'Lite avvik' : 'Stort avvik';
      const accounts = item.accountNames?.join('; ') || '';
      return `"${item.code}","${item.description}","${item.amelding}","${item.D}","${item.difference}","${status}","${accounts}"`;
    }).join('\n');

    const blob = new Blob([csvHeader + csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `avstemming-${client?.data?.name || 'client'}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "CSV eksportert",
      description: "Avstemmingsdata er lastet ned som CSV-fil."
    });
  };

  const handleUpdateNotes = async (code: string, notes: string) => {
    const success = await saveNote(code, 'Payroll Item', notes, 'note');
    if (success) {
      toast({
        title: "Notat lagret",
        description: `Notat for ${code} er lagret.`
      });
    }
  };

  const handleAcceptDiscrepancy = async (code: string) => {
    const success = await saveNote(code, 'Payroll Item', `Avvik godkjent av bruker - ${new Date().toLocaleString('nb-NO')}`, 'approval');
    if (success) {
      toast({
        title: "Avvik godkjent",
        description: `Avvik for ${code} er markert som godkjent.`
      });
    }
  };

  const handleRejectDiscrepancy = async (code: string) => {
    const success = await saveNote(code, 'Payroll Item', `Avvik avvist av bruker - ${new Date().toLocaleString('nb-NO')}`, 'rejection');
    if (success) {
      toast({
        title: "Avvik avvist",
        description: `Avvik for ${code} er markert som avvist og krever oppfølging.`
      });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !client?.data) {
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
      clientName={client.data?.name || client.data?.company_name || 'Ukjent klient'}
      orgNumber={client.data?.org_number}
      pageTitle="Kontrolloppstilling lønn"
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-auto">
          <div className="space-y-6 p-6">
            <StreamlinedReconciliationView
              reconciliationData={reconciliationData}
              client={client.data}
              loading={loading || persistenceLoading}
              onRefresh={handleRefresh}
              onExport={handleExport}
              onUpdateNotes={handleUpdateNotes}
              onAcceptDiscrepancy={handleAcceptDiscrepancy}
              onRejectDiscrepancy={handleRejectDiscrepancy}
            />
          </div>
        </div>
      </div>
    </StickyClientLayout>
  );
}