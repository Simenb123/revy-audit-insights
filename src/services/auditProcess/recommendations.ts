import { logger } from '@/utils/logger';

import { AuditPhase, Client } from '@/types/revio';
import { getPhaseGuidance } from './phaseGuidance';
import { generateAIResponse } from '@/services/revy/aiInteractionService';

// Generate contextual recommendations based on audit progress
export const generateContextualRecommendations = async (
  query: string,
  client: Client,
  currentPhase: AuditPhase,
  userRole: string
): Promise<string[]> => {
  try {
    const recommendationQuery = `
      Basert på følgende spørsmål for en revisor: "${query}",
      for klienten "${client.company_name}" som er i revisjonsfasen "${currentPhase}",
      og for en bruker med rollen "${userRole}",
      gi meg en liste med 3-5 konkrete, handlingsorienterte anbefalinger.
      Inkluder referanser til relevante ISA-standarder hvis mulig.
      VIKTIG: Formater svaret som en gyldig JSON-array med strenger.
      Eksempel: ["Anbefaling 1", "Anbefaling 2", "Anbefaling 3"]
    `;

    // A session ID is not strictly necessary for this one-off query.
    // The AI service should be able to handle a null session ID.
    const aiResult = await generateAIResponse(
      recommendationQuery,
      'audit-actions', // context
      [], // history
      client as any, // clientData
      userRole,
      null // session ID
    );
    
    try {
      // The AI might return markdown with a JSON block. Let's extract it.
      const jsonMatch = aiResult.match(/```(?:json)?\s*([\s\S]*?)\s*```|(\[[\s\S]*?\])/);
      if (jsonMatch) {
        const jsonString = jsonMatch[1] || jsonMatch[2];
        const recommendations = JSON.parse(jsonString);
        if (Array.isArray(recommendations) && recommendations.every(item => typeof item === 'string')) {
          return recommendations.slice(0, 5);
        }
      }
      // Fallback if parsing fails but there is a response
      console.warn("AI response for recommendations was not a valid JSON array. Falling back to splitting.", aiResult);
      return aiResult.split('\n').map(r => r.replace(/^- /, '')).filter(Boolean).slice(0, 5);
    } catch (e) {
      logger.error("Failed to parse recommendations from AI:", e, "Raw response:", aiResult);
      // Fallback to splitting by newline if JSON parsing fails
      return aiResult.split('\n').map(r => r.replace(/^- /, '')).filter(Boolean).slice(0, 5);
    }

  } catch (error) {
    logger.error('Error generating recommendations:', error);
    return ['Det oppstod en feil under generering av anbefalinger. Prøv igjen senere.'];
  }
};
