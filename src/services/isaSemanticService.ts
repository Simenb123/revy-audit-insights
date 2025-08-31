import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

export interface ISAStandardMapping {
  isa_number: string;
  title: string;
  subject_areas: string[];
  account_categories: string[];
  risk_areas: string[];
  context_keywords: string[];
}

export interface SemanticContext {
  documentContext?: any;
  clientContext?: any;
  auditPhase?: 'planning' | 'execution' | 'completion';
  riskLevel?: 'low' | 'medium' | 'high';
  accountCategories?: string[];
}

// ISA Standards semantic mapping
const ISA_SEMANTIC_MAP: ISAStandardMapping[] = [
  {
    isa_number: 'ISA 200',
    title: 'Overordnede mål og generelle prinsipper',
    subject_areas: ['general', 'planning', 'ethics'],
    account_categories: ['all'],
    risk_areas: ['general'],
    context_keywords: ['overordnet', 'prinsipper', 'mål', 'etikk', 'kompetanse']
  },
  {
    isa_number: 'ISA 210',
    title: 'Avtale om revisjonsoppdrag',
    subject_areas: ['planning', 'client-acceptance'],
    account_categories: ['all'],
    risk_areas: ['client_acceptance'],
    context_keywords: ['avtale', 'oppdrag', 'ansvar', 'betingelser']
  },
  {
    isa_number: 'ISA 220',
    title: 'Kvalitetsstyring',
    subject_areas: ['quality-control', 'supervision'],
    account_categories: ['all'],
    risk_areas: ['quality'],
    context_keywords: ['kvalitet', 'styring', 'supervisjon', 'kontroll']
  },
  {
    isa_number: 'ISA 230',
    title: 'Revisjonsdokumentasjon',
    subject_areas: ['documentation', 'working-papers'],
    account_categories: ['all'],
    risk_areas: ['documentation'],
    context_keywords: ['dokumentasjon', 'arbeidspapirer', 'arkivering', 'oppbevaring']
  },
  {
    isa_number: 'ISA 300',
    title: 'Planlegging',
    subject_areas: ['planning', 'strategy'],
    account_categories: ['all'],
    risk_areas: ['planning'],
    context_keywords: ['planlegging', 'strategi', 'tilnærming', 'ressurser']
  },
  {
    isa_number: 'ISA 315',
    title: 'Identifisering og vurdering av risiko',
    subject_areas: ['risk-assessment', 'internal-control'],
    account_categories: ['all'],
    risk_areas: ['inherent_risk', 'control_risk'],
    context_keywords: ['risiko', 'vurdering', 'identifisering', 'intern kontroll', 'vesentlighet']
  },
  {
    isa_number: 'ISA 320',
    title: 'Vesentlighet',
    subject_areas: ['materiality', 'planning'],
    account_categories: ['revenue', 'expenses', 'assets', 'liabilities'],
    risk_areas: ['materiality'],
    context_keywords: ['vesentlighet', 'materialitet', 'terskelverdier', 'beløpsgrenser']
  },
  {
    isa_number: 'ISA 330',
    title: 'Revisjonshandlinger som respons på vurdert risiko',
    subject_areas: ['substantive-testing', 'controls-testing'],
    account_categories: ['all'],
    risk_areas: ['substantive_risk'],
    context_keywords: ['revisjonshandlinger', 'respons', 'testing', 'prosedyrer']
  },
  {
    isa_number: 'ISA 450',
    title: 'Vurdering av feil',
    subject_areas: ['error-evaluation', 'misstatements'],
    account_categories: ['all'],
    risk_areas: ['misstatement'],
    context_keywords: ['feil', 'avvik', 'vurdering', 'korrigering']
  },
  {
    isa_number: 'ISA 500',
    title: 'Revisjonsbevis',
    subject_areas: ['audit-evidence', 'procedures'],
    account_categories: ['all'],
    risk_areas: ['evidence'],
    context_keywords: ['revisjonsbevis', 'bevis', 'tilstrekkelighet', 'hensiktsmessighet']
  },
  {
    isa_number: 'ISA 501',
    title: 'Spesielle hensyn - Spesifikt revisjonsbevis',
    subject_areas: ['inventory', 'litigation', 'segment-information'],
    account_categories: ['inventory', 'provisions', 'contingencies'],
    risk_areas: ['specific_areas'],
    context_keywords: ['beholdning', 'varelager', 'rettstvister', 'segmentinformasjon']
  },
  {
    isa_number: 'ISA 505',
    title: 'Eksterne bekreftelser',
    subject_areas: ['confirmations', 'third-party'],
    account_categories: ['receivables', 'payables', 'cash', 'loans'],
    risk_areas: ['confirmation'],
    context_keywords: ['bekreftelser', 'eksterne', 'tredjeparter', 'kunder', 'leverandører']
  },
  {
    isa_number: 'ISA 520',  
    title: 'Analytiske handlinger',
    subject_areas: ['analytical-procedures', 'data-analysis'],
    account_categories: ['revenue', 'expenses', 'ratios'],
    risk_areas: ['analytical'],
    context_keywords: ['analytiske', 'handlinger', 'forholdstall', 'sammenligning', 'trend']
  },
  {
    isa_number: 'ISA 530',
    title: 'Revisjonsutvalg',
    subject_areas: ['sampling', 'statistical'],
    account_categories: ['all'],
    risk_areas: ['sampling'],
    context_keywords: ['utvalg', 'sampling', 'statistisk', 'ikke-statistisk', 'populasjon']
  },
  {
    isa_number: 'ISA 540',
    title: 'Revisjon av regnskapsestimater',
    subject_areas: ['estimates', 'fair-value', 'provisions'],
    account_categories: ['provisions', 'fair_value', 'estimates'],
    risk_areas: ['estimation'],
    context_keywords: ['estimater', 'anslag', 'virkelig verdi', 'avsetninger', 'usikkerhet']
  },
  {
    isa_number: 'ISA 550',
    title: 'Nærstående parter',
    subject_areas: ['related-parties', 'transactions'],
    account_categories: ['related_party_transactions'],
    risk_areas: ['related_parties'],
    context_keywords: ['nærstående', 'parter', 'transaksjoner', 'forbindelser']
  },
  {
    isa_number: 'ISA 560',
    title: 'Etterfølgende hendelser',
    subject_areas: ['subsequent-events', 'post-balance'],
    account_categories: ['all'],
    risk_areas: ['subsequent_events'],
    context_keywords: ['etterfølgende', 'hendelser', 'etter balansedagen', 'post-balance']
  },
  {
    isa_number: 'ISA 570',
    title: 'Fortsatt drift',
    subject_areas: ['going-concern', 'liquidity'],
    account_categories: ['equity', 'liabilities', 'cash_flow'],
    risk_areas: ['going_concern'],
    context_keywords: ['fortsatt drift', 'going concern', 'likviditet', 'solvens']
  },
  {
    isa_number: 'ISA 580',
    title: 'Skriftlige bekreftelser',
    subject_areas: ['management-representations', 'written-confirmations'],
    account_categories: ['all'],
    risk_areas: ['management_representations'],
    context_keywords: ['skriftlige', 'bekreftelser', 'ledelsesbekreftelser', 'representasjoner']
  },
  {
    isa_number: 'ISA 600',
    title: 'Konsernrevisjon',
    subject_areas: ['group-audit', 'component-audits'],
    account_categories: ['consolidation', 'investments'],
    risk_areas: ['group_audit'],
    context_keywords: ['konsern', 'konsolidering', 'datterselskap', 'komponent']
  },
  {
    isa_number: 'ISA 610',
    title: 'Bruk av internrevisorenes arbeid',
    subject_areas: ['internal-audit', 'coordination'],
    account_categories: ['internal_controls'],
    risk_areas: ['internal_audit'],
    context_keywords: ['internrevisjon', 'internrevisor', 'samarbeid', 'koordinering']
  },
  {
    isa_number: 'ISA 620',
    title: 'Bruk av eksperters arbeid',
    subject_areas: ['experts', 'specialist-work'],
    account_categories: ['complex_estimates', 'valuations'],
    risk_areas: ['expert_work'],
    context_keywords: ['eksperter', 'spesialister', 'fagkunnskap', 'verdivurdering']
  },
  {
    isa_number: 'ISA 700',
    title: 'Utforming av revisjonsberetning',
    subject_areas: ['audit-report', 'opinion'],
    account_categories: ['all'],
    risk_areas: ['reporting'],
    context_keywords: ['revisjonsberetning', 'konklusjon', 'uttalelse', 'rapport']
  },
  {
    isa_number: 'ISA 701',
    title: 'Sentrale revisjonsforhold',
    subject_areas: ['key-audit-matters', 'reporting'],
    account_categories: ['significant_accounts'],
    risk_areas: ['key_matters'],
    context_keywords: ['sentrale', 'revisjonsforhold', 'nøkkelområder', 'betydelige']
  },
  {
    isa_number: 'ISA 705',
    title: 'Modifikasjoner av konklusjonen',
    subject_areas: ['modified-opinion', 'qualifications'],
    account_categories: ['all'],
    risk_areas: ['modified_opinion'],
    context_keywords: ['modifikasjon', 'forbehold', 'avvisning', 'begrenset', 'konklusjon']
  },
  {
    isa_number: 'ISA 706',
    title: 'Presiseringer og andre forhold',
    subject_areas: ['emphasis-matters', 'other-matters'],
    account_categories: ['all'],
    risk_areas: ['emphasis_matters'],
    context_keywords: ['presiseringer', 'andre forhold', 'emphasis', 'other matters']
  },
  {
    isa_number: 'ISA 720',
    title: 'Annen informasjon',
    subject_areas: ['other-information', 'annual-report'],
    account_categories: ['all'],
    risk_areas: ['other_information'],
    context_keywords: ['annen informasjon', 'årsrapport', 'konsistens', 'vesentlige feil']
  }
];

export const getRelevantISAStandards = (context: SemanticContext): ISAStandardMapping[] => {
  try {
    logger.log('Getting relevant ISA standards for context', context);

    let relevantStandards: ISAStandardMapping[] = [];
    const contextText = JSON.stringify(context).toLowerCase();

    // Phase-based relevance
    if (context.auditPhase === 'planning') {
      relevantStandards.push(
        ...ISA_SEMANTIC_MAP.filter(isa => 
          isa.subject_areas.some(area => 
            ['planning', 'risk-assessment', 'materiality', 'client-acceptance'].includes(area)
          )
        )
      );
    } else if (context.auditPhase === 'execution') {
      relevantStandards.push(
        ...ISA_SEMANTIC_MAP.filter(isa =>
          isa.subject_areas.some(area =>
            ['substantive-testing', 'controls-testing', 'audit-evidence', 'sampling'].includes(area)
          )
        )
      );
    } else if (context.auditPhase === 'completion') {
      relevantStandards.push(
        ...ISA_SEMANTIC_MAP.filter(isa =>
          isa.subject_areas.some(area =>
            ['audit-report', 'subsequent-events', 'going-concern', 'error-evaluation'].includes(area)
          )
        )
      );
    }

    // Account category-based relevance
    if (context.accountCategories) {
      for (const category of context.accountCategories) {
        const categoryStandards = ISA_SEMANTIC_MAP.filter(isa =>
          isa.account_categories.includes(category) || isa.account_categories.includes('all')
        );
        relevantStandards.push(...categoryStandards);
      }
    }

    // Keyword-based relevance from document context
    if (context.documentContext) {
      for (const isa of ISA_SEMANTIC_MAP) {
        const hasRelevantKeywords = isa.context_keywords.some(keyword =>
          contextText.includes(keyword.toLowerCase())
        );
        if (hasRelevantKeywords) {
          relevantStandards.push(isa);
        }
      }
    }

    // Risk level adjustments
    if (context.riskLevel === 'high') {
      relevantStandards.push(
        ...ISA_SEMANTIC_MAP.filter(isa =>
          ['ISA 315', 'ISA 330', 'ISA 450', 'ISA 701'].includes(isa.isa_number)
        )
      );
    }

    // Remove duplicates and sort by relevance
    const uniqueStandards = Array.from(
      new Map(relevantStandards.map(isa => [isa.isa_number, isa])).values()
    );

    logger.log('Found relevant ISA standards', {
      count: uniqueStandards.length,
      standards: uniqueStandards.map(isa => isa.isa_number)
    });

    return uniqueStandards.slice(0, 8); // Limit to most relevant

  } catch (error) {
    logger.error('Error getting relevant ISA standards:', error);
    return [];
  }
};

export const getISAContextPrompt = (isaStandards: ISAStandardMapping[]): string => {
  if (isaStandards.length === 0) return '';

  const standardsList = isaStandards.map(isa => 
    `${isa.isa_number}: ${isa.title}`
  ).join('\n');

  return `
RELEVANTE ISA STANDARDER for denne konteksten:
${standardsList}

Når du svarer, vurder disse ISA standardene og referer til relevante bestemmelser når det er hensiktsmessig. 
Fokuser på praktisk anvendelse og koble svarene til de aktuelle revisjonsområdene.
`;
};

export const enhanceAIPromptWithISAContext = (
  basePrompt: string,
  context: SemanticContext
): string => {
  const relevantISAs = getRelevantISAStandards(context);
  const isaPrompt = getISAContextPrompt(relevantISAs);
  
  return `${basePrompt}\n\n${isaPrompt}`;
};

export const getSubjectAreaMappings = () => {
  const mappings = new Map<string, string[]>();
  
  for (const isa of ISA_SEMANTIC_MAP) {
    for (const area of isa.subject_areas) {
      if (!mappings.has(area)) {
        mappings.set(area, []);
      }
      mappings.get(area)!.push(isa.isa_number);
    }
  }
  
  return mappings;
};