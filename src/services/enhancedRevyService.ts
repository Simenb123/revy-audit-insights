
import { supabase } from '@/integrations/supabase/client';
import { getContextualRecommendations } from './revy/enhancedAiInteractionService';
import { AIRevyVariant } from '@/hooks/useAIRevyVariants';

export interface ContextualTip {
  context: string;
  tip: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
}

export const getEnhancedContextualTips = async (
  context: string,
  clientData?: any,
  userRole?: string
): Promise<string> => {
  try {
    // Load appropriate AI variant for context
    const { data: variants } = await supabase
      .from('ai_revy_variants')
      .select('*')
      .contains('available_contexts', [context])
      .eq('is_active', true)
      .order('sort_order')
      .limit(1);

    const rawVariant = variants?.[0];
    
    if (!rawVariant) {
      return getBasicContextualTip(context);
    }

    // Transform to match AIRevyVariant interface
    const variant: AIRevyVariant = {
      ...rawVariant,
      context_requirements: (rawVariant.context_requirements as Record<string, any>) || {}
    };

    // Get contextual recommendations and pick the most actionable one
    const recommendations = await getContextualRecommendations(
      context,
      clientData,
      userRole,
      variant
    );

    return recommendations[0] || getBasicContextualTip(context);
    
  } catch (error) {
    console.error('Failed to get enhanced contextual tips:', error);
    return getBasicContextualTip(context);
  }
};

const getBasicContextualTip = (context: string): string => {
  const basicTips: Record<string, string> = {
    'documentation': 'Tips: Bruk AI-analyse for automatisk kategorisering av dokumenter',
    'audit-actions': 'Tips: Kopier handlinger fra lignende klienter for å spare tid',
    'client-detail': 'Tips: Sjekk at alle obligatoriske felt er utfylt for klienten',
    'planning': 'Tips: Vurder risikoområder tidlig i planleggingsfasen',
    'execution': 'Tips: Dokumenter alle revisjonshandlinger grundig underveis',
    'completion': 'Tips: Gjennomgå at alle handlinger er fullført før avslutning',
    'general': 'Tips: Bruk AI-assistenten for spørsmål om revisjon og regnskapslovgivning'
  };

  return basicTips[context] || basicTips['general'];
};

export const getContextualWorkflowSuggestions = async (
  context: string,
  clientData?: any
): Promise<Array<{ action: string; description: string; priority: number }>> => {
  try {
    const suggestions = [];

    // Context-specific workflow suggestions
    switch (context) {
      case 'documentation':
        if (clientData?.documentContext?.documentStats?.qualityScore < 60) {
          suggestions.push({
            action: 'Analyser dokumenter med lav sikkerhet',
            description: 'Flere dokumenter trenger manual gjennomgang',
            priority: 1
          });
        }
        break;
        
      case 'audit-actions':
        if (clientData?.phase === 'planning') {
          suggestions.push({
            action: 'Opprett revisjonshandlinger',
            description: 'Kopier handlinger fra maler eller lignende klienter',
            priority: 1
          });
        }
        break;
        
      case 'client-detail':
        if (!clientData?.industry) {
          suggestions.push({
            action: 'Oppdater bransjeinfo',
            description: 'Bransjeregistrering mangler for bedre risikovurdering',
            priority: 2
          });
        }
        break;
    }

    return suggestions.sort((a, b) => a.priority - b.priority);
    
  } catch (error) {
    console.error('Failed to get workflow suggestions:', error);
    return [];
  }
};
