
import { AuditPhase } from '@/types/revio';

export const getIndustrySpecificGuidance = async (phase: AuditPhase, industry: string) => {
  // This could be enhanced to fetch from database
  const industryGuidance = {
    'finansielle tjenester': {
      additionalObjectives: ['Vurder kredittap og nedskrivninger', 'Test værdipapirvurderinger'],
      industryPitfalls: ['Komplekse finansielle instrumenter', 'Regulatoriske endringer'],
      industryPractices: ['Bruk spesialistekspertise for komplekse områder', 'Følg sektorspesifikke standarder']
    },
    'eiendom': {
      additionalObjectives: ['Vurder eiendomsverdier', 'Test utbyggingsprosjekter'],
      industryPitfalls: ['Markedssvingninger', 'Prosjektrisiko'],
      industryPractices: ['Bruk takstekspertise', 'Vurder ferdigstillelsesgrad']
    }
  };
  
  return industryGuidance[industry as keyof typeof industryGuidance] || {
    additionalObjectives: [],
    industryPitfalls: [],
    industryPractices: []
  };
};
