import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ReconciliationSession {
  id: string;
  clientId: string;
  reconciliationData: any;
  metrics: {
    totalItems: number;
    perfectMatches: number;
    minorDiscrepancies: number;
    majorDiscrepancies: number;
    totalDiscrepancyAmount: number;
    matchRate: number;
    accountCoverage: number;
    dataQualityScore: number;
  };
}

interface Note {
  id: string;
  code: string;
  text: string;
  timestamp: Date;
  author: string;
  type: 'note' | 'approval' | 'rejection';
}

export const useReconciliationPersistence = (clientId: string) => {
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const saveReconciliationSession = useCallback(async (
    reconciliationData: any,
    payrollImportId?: string,
    trialBalanceId?: string
  ) => {
    try {
      setLoading(true);
      
      const metrics = calculateMetricsFromData(reconciliationData);
      
      // Save main reconciliation session
      const { data: session, error: sessionError } = await supabase
        .from('payroll_reconciliations')
        .insert({
          client_id: clientId,
          payroll_import_id: payrollImportId,
          trial_balance_id: trialBalanceId,
          total_items: metrics.totalItems,
          perfect_matches: metrics.perfectMatches,
          minor_discrepancies: metrics.minorDiscrepancies,
          major_discrepancies: metrics.majorDiscrepancies,
          total_discrepancy_amount: metrics.totalDiscrepancyAmount,
          match_rate: metrics.matchRate,
          account_coverage: metrics.accountCoverage,
          data_quality_score: metrics.dataQualityScore,
          status: 'draft'
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      
      setCurrentSessionId(session.id);

      // Save individual reconciliation items
      const items = reconciliationData.items.map((item: any) => ({
        reconciliation_id: session.id,
        item_code: item.code || 'unknown',
        description: item.description,
        payroll_amount: item.payrollAmount,
        gl_amount: item.glAmount,
        discrepancy: item.discrepancy,
        status: item.status,
        accounts: JSON.stringify(item.accounts || []),
        mapping_rules_applied: JSON.stringify(item.mappingRulesApplied || [])
      }));

      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('reconciliation_items')
          .insert(items);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Avstemming lagret",
        description: "Avstemmingssesjonen er lagret med alle detaljer."
      });

      return session.id;
    } catch (error: any) {
      console.error('Error saving reconciliation session:', error);
      toast({
        title: "Lagring feilet",
        description: error.message || "Kunne ikke lagre avstemmingssesjonen.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const saveNote = useCallback(async (
    itemCode: string,
    itemDescription: string,
    noteText: string,
    noteType: 'note' | 'approval' | 'rejection' = 'note'
  ) => {
    try {
      if (!currentSessionId) {
        toast({
          title: "Ingen aktiv sesjon",
          description: "Lagre avstemmingen først før du legger til notater.",
          variant: "destructive"
        });
        return null;
      }

      const { data: note, error } = await supabase
        .from('reconciliation_notes')
        .insert({
          reconciliation_id: currentSessionId,
          item_code: itemCode,
          item_description: itemDescription,
          note_text: noteText,
          note_type: noteType,
          author_name: 'Current User' // TODO: Get real user name
        })
        .select()
        .single();

      if (error) throw error;

      return note;
    } catch (error: any) {
      console.error('Error saving note:', error);
      toast({
        title: "Notat ikke lagret",
        description: error.message || "Kunne ikke lagre notatet.",
        variant: "destructive"
      });
      return null;
    }
  }, [currentSessionId]);

  const loadReconciliationHistory = useCallback(async (limit = 10) => {
    try {
      const { data: sessions, error } = await supabase
        .from('payroll_reconciliations')
        .select(`
          *,
          reconciliation_items (
            item_code,
            description,
            payroll_amount,
            gl_amount,
            discrepancy,
            status
          ),
          reconciliation_notes (
            item_code,
            note_text,
            note_type,
            author_name,
            created_at
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return sessions;
    } catch (error: any) {
      console.error('Error loading reconciliation history:', error);
      return [];
    }
  }, [clientId]);

  const loadNotesForItem = useCallback(async (itemCode: string): Promise<Note[]> => {
    try {
      if (!currentSessionId) return [];

      const { data: notes, error } = await supabase
        .from('reconciliation_notes')
        .select('*')
        .eq('reconciliation_id', currentSessionId)
        .eq('item_code', itemCode)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return notes.map((note: any) => ({
        id: note.id,
        code: note.item_code,
        text: note.note_text,
        timestamp: new Date(note.created_at),
        author: note.author_name,
        type: note.note_type
      }));
    } catch (error: any) {
      console.error('Error loading notes:', error);
      return [];
    }
  }, [currentSessionId]);

  return {
    loading,
    currentSessionId,
    saveReconciliationSession,
    saveNote,
    loadReconciliationHistory,
    loadNotesForItem
  };
};

function calculateMetricsFromData(reconciliationData: any) {
  const items = reconciliationData.items || [];
  const totalItems = items.length;
  const perfectMatches = items.filter((item: any) => item.status === 'match').length;
  const minorDiscrepancies = items.filter((item: any) => item.status === 'minor_discrepancy').length;
  const majorDiscrepancies = items.filter((item: any) => item.status === 'major_discrepancy').length;
  
  const totalDiscrepancyAmount = items.reduce((sum: number, item: any) => {
    return sum + Math.abs(item.discrepancy || 0);
  }, 0);
  
  const matchRate = totalItems > 0 ? (perfectMatches / totalItems) * 100 : 0;
  const accountCoverage = 100; // TODO: Calculate based on actual account coverage
  const dataQualityScore = matchRate > 90 ? 95 : matchRate > 70 ? 80 : 60;

  return {
    totalItems,
    perfectMatches,
    minorDiscrepancies,
    majorDiscrepancies,
    totalDiscrepancyAmount,
    matchRate,
    accountCoverage,
    dataQualityScore
  };
}