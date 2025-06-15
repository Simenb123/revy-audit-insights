
import { AuditPhase, Client } from '@/types/revio';
import { searchRelevantKnowledge } from '@/services/knowledgeIntegrationService';
import { getPhaseGuidance } from './phaseGuidance';

// Generate contextual recommendations based on audit progress
export const generateContextualRecommendations = async (
  query: string,
  client: Client,
  currentPhase: AuditPhase,
  userRole: string
): Promise<string[]> => {
  try {
    // Search for relevant knowledge
    const knowledge = await searchRelevantKnowledge(query, 'audit-process', undefined, currentPhase);
    
    const recommendations: string[] = [];
    
    // Add knowledge-based recommendations
    if (knowledge.articles.length > 0) {
      const topArticle = knowledge.articles[0];
      recommendations.push(`Se artikkel: "${topArticle.article.title}" for detaljert veiledning`);
    }
    
    // Add ISA standard references
    if (knowledge.isaStandards.length > 0) {
      recommendations.push(`Gjennomgå ${knowledge.isaStandards.slice(0, 2).join(' og ')} for standardkrav`);
    }
    
    // Add procedure recommendations
    if (knowledge.procedures.length > 0) {
      recommendations.push(...knowledge.procedures.slice(0, 2));
    }
    
    // Add role-specific recommendations
    if (userRole === 'partner') {
      recommendations.push('Gjennomfør kvalitetskontroll og partner review');
    } else if (userRole === 'manager') {
      recommendations.push('Koordiner teamressurser og overvåk fremdrift');
    }
    
    // Add phase-specific recommendations
    const phaseGuidance = await getPhaseGuidance(currentPhase, client.industry);
    recommendations.push(...phaseGuidance.bestPractices.slice(0, 1));
    
    return recommendations.slice(0, 5); // Limit to 5 recommendations
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return ['Kontakt teamleder for veiledning om spørsmålet ditt'];
  }
};
