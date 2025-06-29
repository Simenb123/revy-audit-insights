import { logger } from '@/utils/logger';

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { EnhancedAuditActionTemplate } from '@/types/enhanced-audit-actions';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useSpecializedAIChat = (actionTemplate: EnhancedAuditActionTemplate) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const buildSpecializedContext = (workingPaperData?: any) => {
    const context = {
      actionTemplate: {
        name: actionTemplate.name,
        subject_area: actionTemplate.subject_area,
        action_type: actionTemplate.action_type,
        risk_level: actionTemplate.risk_level,
        objective: actionTemplate.objective,
        procedures: actionTemplate.procedures,
        estimated_hours: actionTemplate.estimated_hours
      },
      isaStandards: actionTemplate.isa_mappings?.map(mapping => ({
        number: mapping.isa_standard?.isa_number,
        title: mapping.isa_standard?.title,
        relevance: mapping.relevance_level,
        description: mapping.isa_standard?.description
      })) || [],
      documentRequirements: actionTemplate.document_mappings?.map(mapping => ({
        name: mapping.document_requirement?.name,
        type: mapping.document_requirement?.document_type,
        mandatory: mapping.is_mandatory,
        timing: mapping.timing,
        description: mapping.document_requirement?.description
      })) || [],
      aiMetadata: actionTemplate.ai_metadata ? {
        complexity: actionTemplate.ai_metadata.estimated_complexity,
        commonIssues: actionTemplate.ai_metadata.common_issues,
        typicalDocuments: actionTemplate.ai_metadata.typical_documents,
        riskIndicators: actionTemplate.ai_metadata.risk_indicators,
        qualityCheckpoints: actionTemplate.ai_metadata.quality_checkpoints
      } : null,
      workingPaperData
    };

    return context;
  };

  const sendMessage = useCallback(async (userMessage: string, workingPaperData?: any) => {
    if (!userMessage.trim()) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const context = buildSpecializedContext(workingPaperData);
      
      const { data, error } = await supabase.functions.invoke('revy-ai-chat', {
        body: {
          message: userMessage,
          context: {
            type: 'specialized_audit_action',
            variant: 'methodology',
            data: context
          },
          session_context: {
            action_template_id: actionTemplate.id,
            subject_area: actionTemplate.subject_area,
            action_type: actionTemplate.action_type
          }
        }
      });

      if (error) throw error;

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      logger.error('Error sending message to specialized AI:', error);
      toast({
        title: "Feil ved kommunikasjon med AI",
        description: "Kunne ikke sende melding til den spesialiserte assistenten.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [actionTemplate]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages
  };
};
