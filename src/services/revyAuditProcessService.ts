
import { AuditPhase, AuditSubjectArea, Client } from '@/types/revio';
import { supabase } from '@/integrations/supabase/client';
import { searchRelevantKnowledge, getProcedureTemplates } from './knowledgeIntegrationService';

export interface AuditProcessInsight {
  currentPhase: AuditPhase;
  nextSteps: string[];
  requiredActions: string[];
  riskAreas: string[];
  deadlines: Array<{ task: string; date: string; priority: 'high' | 'medium' | 'low' }>;
  completionRate: number;
  recommendations: string[];
}

export interface ProcessGuidance {
  phaseDescription: string;
  keyObjectives: string[];
  commonPitfalls: string[];
  isaReferences: string[];
  bestPractices: string[];
}

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

// Helper functions
const getNextSteps = (phase: AuditPhase, actions: any[], client: Client): string[] => {
  const nextSteps: string[] = [];
  
  // Get incomplete actions in current phase
  const currentPhaseActions = actions.filter(a => 
    a.phase === phase && a.status !== 'completed'
  );
  
  if (currentPhaseActions.length > 0) {
    nextSteps.push(`Fullfør ${currentPhaseActions.length} gjenstående handlinger i ${phase}-fasen`);
  }
  
  // Phase-specific next steps
  switch (phase) {
    case 'planning':
      nextSteps.push('Ferdigstill materialitetsvurdering og risikoanalyse');
      break;
    case 'risk_assessment':
      nextSteps.push('Planlegg testing basert på identifiserte risikoer');
      break;
    case 'execution':
      nextSteps.push('Gjennomfør substansielle tester og evaluer funn');
      break;
    case 'completion':
      nextSteps.push('Utarbeid utkast til revisjonsberetning');
      break;
  }
  
  return nextSteps;
};

const getRequiredActions = (phase: AuditPhase, actions: any[], client: Client): string[] => {
  const required: string[] = [];
  
  // Check for missing critical actions per phase
  const phaseRequirements = {
    'planning': ['materialitet', 'risikovurdering', 'revisjonsplan'],
    'risk_assessment': ['kontrollmiljø', 'IT-kontroller', 'prosessforståelse'],
    'execution': ['substansiell testing', 'kontrolltest', 'analytiske handlinger'],
    'completion': ['evaluering', 'konklusjon', 'kvalitetskontroll']
  };
  
  const requirements = phaseRequirements[phase as keyof typeof phaseRequirements] || [];
  
  requirements.forEach(req => {
    const hasAction = actions.some(a => 
      a.name.toLowerCase().includes(req) || 
      a.description?.toLowerCase().includes(req)
    );
    
    if (!hasAction) {
      required.push(`Opprett handling for ${req}`);
    }
  });
  
  return required;
};

const assessRiskAreas = (client: Client, actions: any[]): string[] => {
  const risks: string[] = [];
  
  // Industry-specific risks
  if (client.industry?.includes('finans')) {
    risks.push('Kredittrisiko', 'Markedsrisiko', 'Regulatorisk risiko');
  }
  
  // Progress-based risks
  if (client.progress < 25) {
    risks.push('Forsinkelsesrisiko');
  }
  
  // Action-based risks
  const overdueActions = actions.filter(a => 
    a.due_date && new Date(a.due_date) < new Date() && a.status !== 'completed'
  );
  
  if (overdueActions.length > 0) {
    risks.push('Overskridelse av frister');
  }
  
  return risks;
};

const generateDeadlines = (phase: AuditPhase, actions: any[], client: Client): any[] => {
  const deadlines: any[] = [];
  
  // Add action deadlines
  actions
    .filter(a => a.due_date && a.status !== 'completed')
    .forEach(action => {
      deadlines.push({
        task: action.name,
        date: action.due_date,
        priority: action.risk_level === 'high' ? 'high' : 'medium'
      });
    });
  
  // Add phase-specific deadlines
  if (client.year_end_date) {
    const yearEnd = new Date(client.year_end_date);
    deadlines.push({
      task: 'Ferdigstill revisjon',
      date: new Date(yearEnd.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days after year end
      priority: 'high'
    });
  }
  
  return deadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const generateRecommendations = (phase: AuditPhase, client: Client, actions: any[], userRole: string): string[] => {
  const recommendations: string[] = [];
  
  // Role-specific recommendations
  if (userRole === 'partner') {
    recommendations.push('Gjennomfør strategisk review av tilnærming og risiko');
  } else if (userRole === 'manager') {
    recommendations.push('Overvåk teamets fremdrift og ressursbruk');
  } else {
    recommendations.push('Diskuter komplekse områder med ansvarlig manager');
  }
  
  // Progress-based recommendations
  if (client.progress < 50) {
    recommendations.push('Vurder ekstra ressurser for å overholde tidsplan');
  }
  
  return recommendations;
};

const getDefaultInsight = (phase: AuditPhase): AuditProcessInsight => ({
  currentPhase: phase,
  nextSteps: ['Gjennomgå revisjonsplan og identifiser neste aktiviteter'],
  requiredActions: ['Sørg for at alle nødvendige handlinger er planlagt'],
  riskAreas: ['Vurder tidsplan og ressurser'],
  deadlines: [],
  completionRate: 0,
  recommendations: ['Kontakt manager for veiledning om revisjonsfremdrift']
});

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
