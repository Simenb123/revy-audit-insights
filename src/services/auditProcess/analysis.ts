
import { Client } from '@/types/revio';
import { supabase } from '@/integrations/supabase/client';
import { AuditProcessInsight } from '@/types/auditProcess';
import {
  getNextSteps,
  getRequiredActions,
  assessRiskAreas,
  generateDeadlines,
  generateRecommendations,
  getDefaultInsight,
} from './helpers';

// Analyze client's audit process and provide intelligent insights
export const analyzeAuditProcess = async (
  client: Client,
  userRole: string = 'employee'
): Promise<AuditProcessInsight> => {
  try {
    // Get client's audit actions and progress
    const { data: auditActions, error } = await supabase
      .from('client_audit_actions')
      .select('*')
      .eq('client_id', client.id);

    if (error) {
      console.error('Error fetching audit actions:', error);
    }

    const actions = auditActions || [];
    const currentPhase = client.phase || 'planning';
    
    // Calculate completion rate
    const totalActions = actions.length;
    const completedActions = actions.filter(a => a.status === 'completed').length;
    const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

    // Identify next steps based on current phase and progress
    const nextSteps = getNextSteps(currentPhase, actions, client);
    
    // Identify required actions that are missing or overdue
    const requiredActions = getRequiredActions(currentPhase, actions, client);
    
    // Assess risk areas based on client data and incomplete actions
    const riskAreas = assessRiskAreas(client, actions);
    
    // Generate deadlines and priorities
    const deadlines = generateDeadlines(currentPhase, actions, client);
    
    // Provide role-specific recommendations
    const recommendations = generateRecommendations(currentPhase, client, actions, userRole);

    return {
      currentPhase,
      nextSteps,
      requiredActions,
      riskAreas,
      deadlines,
      completionRate,
      recommendations
    };
  } catch (error) {
    console.error('Error analyzing audit process:', error);
    return getDefaultInsight(client.phase || 'planning');
  }
};
