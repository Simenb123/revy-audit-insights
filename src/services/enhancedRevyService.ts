
import { supabase } from '@/integrations/supabase/client';
import { RevyContext } from '@/types/revio';
import { searchRelevantKnowledge } from './knowledgeIntegrationService';

// Enhanced context detection based on URL and app state
export const detectEnhancedContext = (pathname: string, clientData?: any): RevyContext => {
  console.log('🔍 Detecting context from pathname:', pathname);
  
  // More specific context detection
  if (pathname.includes('/klienter/')) {
    if (pathname.includes('/revisjonshandlinger') || pathname.includes('/actions')) {
      return 'audit-actions';
    }
    if (pathname.includes('/risikovurdering') || pathname.includes('/risk')) {
      return 'risk-assessment';
    }
    if (pathname.includes('/dokumentasjon') || pathname.includes('/documents')) {
      return 'documentation';
    }
    if (pathname.includes('/team') || pathname.includes('/samarbeid')) {
      return 'collaboration';
    }
    return 'client-detail';
  }
  
  if (pathname.includes('/klienter')) {
    return 'client-overview';
  }
  
  if (pathname.includes('/dashboard')) {
    return 'dashboard';
  }
  
  if (pathname.includes('/teams')) {
    return 'team-management';
  }
  
  if (pathname.includes('/communication')) {
    return 'communication';
  }
  
  return 'general';
};

// Get contextual suggestions based on current app state
export const getEnhancedContextualTips = async (
  context: RevyContext, 
  clientData?: any,
  userRole?: string
): Promise<string> => {
  try {
    // If we have client data, provide specific tips
    if (clientData) {
      const clientSpecificTips = await getClientSpecificTips(clientData, context);
      if (clientSpecificTips) return clientSpecificTips;
    }

    // Enhanced contextual tips based on user role and context
    const roleBasedTips = getRoleBasedTips(context, userRole);
    
    return roleBasedTips;
  } catch (error) {
    console.error('Error getting enhanced tips:', error);
    return getBasicContextualTip(context);
  }
};

const getClientSpecificTips = async (clientData: any, context: RevyContext): Promise<string | null> => {
  if (!clientData) return null;

  const tips = [];
  
  // Progress-based tips
  if (clientData.progress < 25) {
    tips.push(`${clientData.company_name} er i tidlig fase (${clientData.progress}% fullført). Fokuser på planlegging og risikovurdering.`);
  } else if (clientData.progress > 75) {
    tips.push(`${clientData.company_name} nærmer seg ferdigstillelse (${clientData.progress}% fullført). Tid for avslutning og rapportering.`);
  }

  // Industry-specific tips
  if (clientData.industry) {
    const industryTip = getIndustrySpecificTip(clientData.industry, context);
    if (industryTip) tips.push(industryTip);
  }

  // Phase-specific tips
  if (clientData.phase) {
    const phaseTip = getPhaseSpecificTip(clientData.phase, clientData.company_name);
    if (phaseTip) tips.push(phaseTip);
  }

  return tips.length > 0 ? tips.join(' ') : null;
};

const getIndustrySpecificTip = (industry: string, context: RevyContext): string | null => {
  const industryTips: Record<string, string> = {
    'Bygg og anlegg': 'For byggebransjen: Vær spesielt oppmerksom på prosjektregnskapsføring og pågående arbeider (POC).',
    'Handel': 'For handelsbedrifter: Fokuser på lagerverdsettelse, kundefordringer og sesongjusteringer.',
    'Teknologi': 'For teknologibedrifter: Vurder immaterielle eiendeler, utviklingskostnader og inntektsføring.',
    'Finans': 'For finansnæringen: Særlig oppmerksomhet på regulatoriske krav, risikostyring og kapitalkrav.',
    'Eiendom': 'For eiendomsbransjen: Fokuser på verdivurderinger, avskrivninger og leiekontrakter.'
  };

  return industryTips[industry] || null;
};

const getPhaseSpecificTip = (phase: string, companyName: string): string | null => {
  const phaseTips: Record<string, string> = {
    'planning': `${companyName} er i planleggingsfasen. Sett opp revisjonshandlinger og vurder risiko.`,
    'risk_assessment': `Nå er tiden for grundig risikovurdering av ${companyName}. Bruk ISA 315 som guide.`,
    'execution': `${companyName} er i gjennomføringsfasen. Fokuser på substansielle handlinger og kontrollprøving.`,
    'completion': `${companyName} nærmer seg avslutning. Tid for konklusjoner og rapportering.`
  };

  return phaseTips[phase] || null;
};

const getRoleBasedTips = (context: RevyContext, userRole?: string): string => {
  const baseTip = getBasicContextualTip(context);
  
  if (userRole === 'partner') {
    return `${baseTip} Som partner kan du også vurdere porteføljeoptimalisering og ressursallokering.`;
  } else if (userRole === 'manager') {
    return `${baseTip} Som manager, følg opp teamets fremdrift og kvalitetssikring.`;
  }
  
  return baseTip;
};

const getBasicContextualTip = (context: RevyContext): string => {
  const tips: Record<RevyContext, string> = {
    'dashboard': 'På dashboardet kan du se oversikt over klienter, oppgaver og fremdrift. Spør meg om KPI-er eller planlegging.',
    'client-overview': 'Her ser du alle dine klienter. Jeg kan hjelpe med å prioritere arbeid eller finne spesifikke klienter.',
    'client-detail': 'Jeg kan gi deg innsikt i denne klientens finansielle stilling, risikoområder og foreslå revisjonshandlinger.',
    'audit-actions': 'Jeg kan hjelpe med å planlegge revisjonshandlinger, forklare ISA-standarder og foreslå prosedyrer.',
    'risk-assessment': 'La meg hjelpe deg med risikovurdering etter ISA 315. Jeg kan forklare risikoområder og materialitetsvurderinger.',
    'documentation': 'Jeg kan veilede om dokumentasjonskrav etter ISA 230 og hjelpe med å strukturere arbeidspapirer.',
    'collaboration': 'Jeg kan hjelpe med teamorganisering, kommunikasjon og oppgavefordeling i revisjonsprosjekter.',
    'communication': 'Her kan jeg hjelpe med meldinger, møtenotater eller klientkommunikasjon.',
    'team-management': 'Som teamleder kan jeg hjelpe med kapasitetsplanlegging, kompetanseutvikling og teamdynamikk.',
    'general': 'Jeg kan hjelpe deg med revisjonsmetodikk, ISA-standarder, regnskapsanalyse eller appfunksjonalitet. Hva lurer du på?'
  };
  
  return tips[context] || tips.general;
};

// Enhanced message building with better context
export const buildEnhancedMessage = async (
  userMessage: string,
  context: RevyContext,
  clientData?: any,
  userRole?: string
): Promise<{ message: string; enhancedContext: any }> => {
  try {
    // Search for relevant knowledge
    const knowledge = await searchRelevantKnowledge(userMessage, context);
    
    // Get enhanced context
    const enhancedContext = {
      context,
      clientData,
      userRole,
      knowledge: knowledge.articles.slice(0, 3), // Top 3 relevant articles
      procedures: knowledge.procedures,
      isaStandards: knowledge.isaStandards,
      riskFactors: knowledge.riskFactors
    };

    return {
      message: userMessage,
      enhancedContext
    };
  } catch (error) {
    console.error('Error building enhanced message:', error);
    return {
      message: userMessage,
      enhancedContext: { context, clientData, userRole }
    };
  }
};
