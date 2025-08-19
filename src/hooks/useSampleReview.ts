import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SampleItem {
  id: string;
  plan_id: string;
  transaction_id: string;
  transaction_date: string;
  account_no: string;
  account_name: string;
  description: string;
  amount: number;
  is_reviewed: boolean;
  reviewer_id?: string;
  review_date?: string;
  deviation_amount: number;
  deviation_notes?: string;
  review_status: 'pending' | 'ok' | 'deviation' | 'follow_up';
  // These will come from metadata or joined data
  voucher_number?: string;
  risk_score?: number;
  is_high_risk?: boolean;
}

export const useSampleReview = (planId: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch sample items for the plan
  const { data: sampleItems, isLoading, error } = useQuery({
    queryKey: ['sample-items', planId],
    queryFn: async () => {
      // First get the sampling items
      const { data: items, error: itemsError } = await supabase
        .from('audit_sampling_items')
        .select('*')
        .eq('plan_id', planId)
        .order('transaction_date', { ascending: true });

      if (itemsError) throw itemsError;

      // For each item, we need to get the voucher_number from the general ledger
      const enhancedItems = await Promise.all(
        (items || []).map(async (item) => {
          // Try to get voucher number from general ledger transactions
          const { data: glTransaction } = await supabase
            .from('general_ledger_transactions')
            .select('voucher_number')
            .eq('id', item.transaction_id)
            .maybeSingle();

          return {
            ...item,
            voucher_number: glTransaction?.voucher_number || item.transaction_id,
          };
        })
      );

      return enhancedItems as SampleItem[];
    },
    enabled: !!planId,
  });

  // Update review status for an item
  const updateReviewMutation = useMutation({
    mutationFn: async ({ 
      itemId, 
      isReviewed, 
      deviationAmount, 
      deviationNotes, 
      reviewStatus 
    }: {
      itemId: string;
      isReviewed: boolean;
      deviationAmount?: number;
      deviationNotes?: string;
      reviewStatus: 'pending' | 'ok' | 'deviation' | 'follow_up';
    }) => {
      const { error } = await supabase
        .from('audit_sampling_items')
        .update({
          is_reviewed: isReviewed,
          reviewer_id: isReviewed ? (await supabase.auth.getUser()).data.user?.id : null,
          review_date: isReviewed ? new Date().toISOString() : null,
          deviation_amount: deviationAmount || 0,
          deviation_notes: deviationNotes,
          review_status: reviewStatus,
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sample-items', planId] });
      toast({
        title: "Kontroll oppdatert",
        description: "Kontrollstatus er lagret"
      });
    },
    onError: (error) => {
      toast({
        title: "Feil ved oppdatering",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const updateItemReview = useCallback((
    itemId: string,
    isReviewed: boolean,
    deviationAmount?: number,
    deviationNotes?: string,
    reviewStatus: 'pending' | 'ok' | 'deviation' | 'follow_up' = 'ok'
  ) => {
    updateReviewMutation.mutate({
      itemId,
      isReviewed,
      deviationAmount,
      deviationNotes,
      reviewStatus,
    });
  }, [updateReviewMutation]);

  // Calculate summary statistics
  const reviewSummary = sampleItems ? {
    totalItems: sampleItems.length,
    reviewedItems: sampleItems.filter(item => item.is_reviewed).length,
    pendingItems: sampleItems.filter(item => item.review_status === 'pending').length,
    okItems: sampleItems.filter(item => item.review_status === 'ok').length,
    deviationItems: sampleItems.filter(item => item.review_status === 'deviation').length,
    followUpItems: sampleItems.filter(item => item.review_status === 'follow_up').length,
    totalDeviationAmount: sampleItems.reduce((sum, item) => sum + (item.deviation_amount || 0), 0),
    completionPercentage: sampleItems.length > 0 
      ? Math.round((sampleItems.filter(item => item.is_reviewed).length / sampleItems.length) * 100)
      : 0,
  } : null;

  return {
    sampleItems: sampleItems || [],
    isLoading,
    error,
    updateItemReview,
    reviewSummary,
    isUpdating: updateReviewMutation.isPending,
  };
};