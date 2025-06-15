
import { AuditPhase, Client } from '@/types/revio';
import { ProcessGuidance } from '@/types/auditProcess';
import { searchRelevantKnowledge } from '@/services/knowledgeIntegrationService';

const getIndustrySpecificGuidance = async (phase: AuditPhase, industry: string) => {
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

// Get phase-specific guidance and best practices
export const getPhaseGuidance = async (
  phase: AuditPhase,
  clientIndustry?: string
): Promise<ProcessGuidance> => {
  const guidance: Record<AuditPhase, ProcessGuidance> = {
    'overview': {
      phaseDescription: 'Oversikt og innledende planlegging av revisjonsoppdraget',
      keyObjectives: [
        'Forstå klientens virksomhet og bransje',
        'Identifiser preliminære risikoområder',
        'Planlegg revisjonsressurser og tidsplan'
      ],
      commonPitfalls: [
        'Utilstrekkelig forståelse av klientens forretningsmodell',
        'Manglende identifisering av bransjespecifikke risikoer',
        'Undervurdering av kompleksitet og tidsbruk'
      ],
      isaReferences: ['ISA 300', 'ISA 315'],
      bestPractices: [
        'Gjennomfør grundige klientintervjuer',
        'Analyser bransjetrender og regulatoriske endringer',
        'Utarbeid detaljert prosjektplan med milepæler'
      ]
    },
    'engagement': {
      phaseDescription: 'Etablering og oppfølging av revisjonsoppdraget',
      keyObjectives: [
        'Inngå oppdragsbrev',
        'Etablere kommunikasjonslinjer',
        'Klargjøre forventninger'
      ],
      commonPitfalls: [
        'Uklare oppdragsbetingelser',
        'Manglende kommunikasjon med ledelsen'
      ],
      isaReferences: ['ISA 210', 'ISA 260'],
      bestPractices: [
        'Tydelig oppdragsbrev',
        'Regelmessig kommunikasjon med ledelsen'
      ]
    },
    'planning': {
      phaseDescription: 'Detaljert planlegging av revisjonstilnærmingen',
      keyObjectives: [
        'Fastsette materialitetsnivå',
        'Identifisere og vurdere risikoer',
        'Utvikle revisjonsstrategien',
        'Planlegge testing og prosedyrer'
      ],
      commonPitfalls: [
        'Feil materialitetsnivå',
        'Manglende risikovurdering',
        'Utilstrekkelig planlegging av IT-kontroller'
      ],
      isaReferences: ['ISA 300', 'ISA 315', 'ISA 320', 'ISA 330'],
      bestPractices: [
        'Bruk bransjedata for materialitetsberegninger',
        'Dokumenter alle risikovurderinger grundig',
        'Involver IT-revisjon tidlig i prosessen'
      ]
    },
    'risk_assessment': {
      phaseDescription: 'Grundig vurdering av risikoer for vesentlig feilinformasjon',
      keyObjectives: [
        'Identifisere risikoer på påstandsnivå',
        'Vurdere kontrollmiljøet',
        'Bestemme testing av kontroller',
        'Planlegge substansielle handlinger'
      ],
      commonPitfalls: [
        'Overfladisk risikovurdering',
        'Manglende kobling mellom risiko og respons',
        'Utilstrekkelig forståelse av IT-systemer'
      ],
      isaReferences: ['ISA 315', 'ISA 330', 'ISA 540'],
      bestPractices: [
        'Bruk risikomatriser for strukturert analyse',
        'Involver erfarne teammedlemmer i risikovurdering',
        'Dokumenter alle vurderinger med begrunnelser'
      ]
    },
    'execution': {
      phaseDescription: 'Gjennomføring av planlagte revisjonshandlinger',
      keyObjectives: [
        'Utføre testing av kontroller',
        'Gjennomføre substansielle handlinger',
        'Innhente tilstrekkelig revisjonsbevis',
        'Evaluere funn og konklusjoner'
      ],
      commonPitfalls: [
        'Utilstrekkelig testing',
        'Dårlig dokumentasjon av funn',
        'Manglende oppfølging av avvik'
      ],
      isaReferences: ['ISA 330', 'ISA 500', 'ISA 505', 'ISA 520'],
      bestPractices: [
        'Test kontroller først hvis planlagt',
        'Bruk analytiske handlinger effektivt',
        'Dokumenter alle funn umiddelbart'
      ]
    },
    'completion': {
      phaseDescription: 'Avslutning av revisjonen og rapportering',
      keyObjectives: [
        'Evaluere revisjonsbevis',
        'Konkludere på alle påstander',
        'Utarbeide revisjonsberetning',
        'Gjennomføre kvalitetskontroll'
      ],
      commonPitfalls: [
        'Manglende evaluering av bevis',
        'Utilstrekkelig kvalitetskontroll',
        'Sen rapportering'
      ],
      isaReferences: ['ISA 700', 'ISA 705', 'ISA 720'],
      bestPractices: [
        'Gjennomfør systematic review av alle arbeidsområder',
        'Kvalitetskontroll av erfaren revisor',
        'Tidlig utarbeidelse av utkast til beretning'
      ]
    },
    'reporting': {
      phaseDescription: 'Utforming og levering av revisjonsrapporter',
      keyObjectives: [
        'Utarbeide endelig revisjonsberetning',
        'Kommunisere funn til ledelse og styre',
        'Arkivere revisjonsdokumentasjon'
      ],
      commonPitfalls: [
        'Uklare formuleringer i beretningen',
        'Forsinket kommunikasjon av vesentlige funn',
        'Mangelfull arkivering'
      ],
      isaReferences: ['ISA 700', 'ISA 701', 'ISA 260'],
      bestPractices: [
        'Sikre at beretningen er i tråd med ISA-standardene',
        'Avhold møte med styret for å gjennomgå funn',
        'Følg firmaets retningslinjer for arkivering'
      ]
    }
  };

  let phaseGuidance = guidance[phase];
  
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
