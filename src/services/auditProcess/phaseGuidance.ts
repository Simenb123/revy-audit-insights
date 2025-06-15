
import { AuditPhase } from '@/types/revio';
import { ProcessGuidance } from '@/types/auditProcess';
import { getIndustrySpecificGuidance } from './industryGuidance';
import { phaseGuidanceData } from './phaseGuidanceData';

// Get phase-specific guidance and best practices
export const getPhaseGuidance = async (
  phase: AuditPhase,
  clientIndustry?: string
): Promise<ProcessGuidance> => {
  let phaseGuidance = { ...phaseGuidanceData[phase] }; // Create a copy to avoid mutation
  
  // Add industry-specific guidance if available
  if (clientIndustry) {
    const industrySpecific = await getIndustrySpecificGuidance(phase, clientIndustry);
    phaseGuidance = {
      ...phaseGuidance,
      keyObjectives: [...phaseGuidance.keyObjectives, ...industrySpecific.additionalObjectives],
      commonPitfalls: [...phaseGuidance.commonPitfalls, ...industrySpecific.industryPitfalls],
      bestPractices: [...phaseGuidance.bestPractices, ...industrySpecific.industryPractices]
    };
  }

  return phaseGuidance;
};
