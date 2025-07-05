import { logger } from '@/utils/logger';

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AIRevyVariantName } from '@/constants/aiRevyVariants';

export interface AIRevyVariant {
  id: string;
  name: AIRevyVariantName;
  display_name: string;
  description: string;
  system_prompt_template: string;
  context_requirements: Record<string, any>;
  available_contexts: string[];
  is_active: boolean;
  sort_order: number;
}

export const useAIRevyVariants = (context?: string) => {
  const [variants, setVariants] = useState<AIRevyVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<AIRevyVariant | null>(null);

  useEffect(() => {
    loadVariants();
  }, [context]);

  const loadVariants = async () => {
    try {
      let query = supabase
        .from('ai_revy_variants')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (context) {
        query = query.contains('available_contexts', [context]);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // Transform database data to match interface
      const transformedData = data?.map(item => ({
        ...item,
        context_requirements: item.context_requirements as Record<string, any> || {}
      })) || [];
      
      setVariants(transformedData);
      
      // Auto-select most appropriate variant based on context
      if (transformedData && transformedData.length > 0 && !selectedVariant) {
        const defaultVariant = selectDefaultVariant(transformedData, context);
        setSelectedVariant(defaultVariant);
      }
    } catch (error) {
      logger.error('Error loading AI-Revi variants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectDefaultVariant = (availableVariants: AIRevyVariant[], currentContext?: string): AIRevyVariant => {
    if (!currentContext) return availableVariants[0];

    // Context-based variant selection
    const contextMapping: Record<string, AIRevyVariantName> = {
      'audit-actions': 'methodology',
      'planning': 'methodology',
      'execution': 'methodology',
      'completion': 'methodology',
      'risk-assessment': 'professional',
      'client-detail': 'professional',
      'documentation': 'guide',
      'collaboration': 'guide',
      'general': 'support'
    };

    const preferredVariantName = contextMapping[currentContext];
    const preferred = availableVariants.find(v => v.name === preferredVariantName);
    
    return preferred || availableVariants[0];
  };

  const switchVariant = (variant: AIRevyVariant) => {
    setSelectedVariant(variant);
  };

  const handleVariantChange = (variant: AIRevyVariant) => {
    switchVariant(variant);
  };

  return {
    variants,
    selectedVariant,
    isLoading,
    switchVariant,
    handleVariantChange,
    loadVariants
  };
};
