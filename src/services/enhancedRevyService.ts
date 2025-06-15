import { supabase } from '@/integrations/supabase/client';
import { RevyContext } from '@/types/revio';
import { getBasicContextualTip } from './revy/contextualTipService';

// The `detectEnhancedContext` function has been removed.
// This logic is now centralized in `RevyContextProvider` for a single source of truth.

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

// The 'buildEnhancedMessage' function was previously here. It has been removed
// because its logic (searching for knowledge articles and building a complex context object)
// has been moved into the 'revy-ai-chat' edge function. This simplifies the client-side
// code and centralizes the AI logic on the server.
