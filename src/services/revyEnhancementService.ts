import { logger } from '@/utils/logger';

import { useNavigate } from 'react-router-dom';

export interface EnhancedResponse {
  content: string;
  links: Array<{
    type: 'navigation' | 'action' | 'external' | 'knowledge';
    text: string;
    path?: string;
    url?: string;
    action?: () => void;
    icon?: React.ReactNode;
    variant?: 'default' | 'secondary' | 'outline';
  }>;
  sources: Array<{
    title: string;
    type: 'isa' | 'regulation' | 'knowledge' | 'client';
    reference?: string;
    url?: string;
  }>;
}

export const enhanceAIResponse = (
  rawResponse: string,
  context: string,
  clientData?: any
): EnhancedResponse => {
  const links: EnhancedResponse['links'] = [];
  const sources: EnhancedResponse['sources'] = [];
  let content = rawResponse;

  // Extract and create navigation links based on keywords
  const navigationPatterns = [
    {
      keywords: ['risikovurdering', 'risiko', 'risikoanalyse'],
      text: 'Gå til Risikoanalyse',
      path: '/risikoanalyse',
      variant: 'outline' as const
    },
    {
      keywords: ['klient', 'klientdetaljer', 'klientinformasjon'],
      text: 'Se klientdetaljer',
      path: clientData?.id ? `/klienter/${clientData.id}` : '/klienter',
      variant: 'outline' as const
    },
    {
      keywords: ['revisjonshandlinger', 'handlinger', 'oppgaver'],
      text: 'Vis revisjonshandlinger',
      path: clientData?.id ? `/klienter/${clientData.id}?tab=actions` : '/klienter',
      variant: 'outline' as const
    },
    {
      keywords: ['dokumentasjon', 'arbeidspapirer', 'dokumenter'],
      text: 'Last opp dokumenter',
      path: '/data-import',
      variant: 'outline' as const
    },
    {
      keywords: ['regnskapsdata', 'regnskap', 'balanse'],
      text: 'Analyser regnskapsdata',
      path: '/analyse',
      variant: 'outline' as const
    },
    {
      keywords: ['kunnskapsbase', 'fagstoff', 'veiledning'],
      text: 'Utforsk kunnskapsbase',
      path: '/kunnskap',
      variant: 'outline' as const
    }
  ];

  // Add relevant navigation links based on content
  navigationPatterns.forEach(pattern => {
    if (pattern.keywords.some(keyword => content.toLowerCase().includes(keyword))) {
      links.push({
        type: 'navigation' as const,
        text: pattern.text,
        path: pattern.path,
        variant: pattern.variant
      });
    }
  });

  // Extract ISA references and add as sources
  const isaMatches = content.match(/ISA\s+(\d+)/g);
  if (isaMatches) {
    isaMatches.forEach(match => {
      const isaNumber = match.match(/\d+/)?.[0];
      if (isaNumber) {
        sources.push({
          title: `ISA ${isaNumber}`,
          type: 'isa',
          reference: isaNumber,
        });
      }
    });
  }

  // Add regulation references
  const regulationKeywords = [
    'Regnskapsloven', 'NGRS', 'IFRS', 'Revisorloven', 'MVA-loven'
  ];
  
  regulationKeywords.forEach(regulation => {
    if (content.includes(regulation)) {
      sources.push({
        title: regulation,
        type: 'regulation'
      });
    }
  });

  // Add client-specific sources if we have client data
  if (clientData) {
    sources.push({
      title: clientData.company_name || clientData.name,
      type: 'client'
    });
  }

  // Context-specific enhancements
  if (context === 'risk-assessment') {
    links.push({
      type: 'action',
      text: 'Start risikovurdering',
      path: `/klienter/${clientData?.id}/risk-assessment`,
      variant: 'default'
    });
  }

  if (context === 'client-detail' && clientData) {
    links.push({
      type: 'navigation',
      text: 'Se fremdrift',
      path: `/klienter/${clientData.id}?tab=progress`,
      variant: 'secondary'
    });
  }

  return {
    content,
    links: links.slice(0, 3), // Limit to 3 most relevant links
    sources: [...new Set(sources.map(s => JSON.stringify(s)))].map(s => JSON.parse(s)) // Remove duplicates
  };
};

// Helper function to generate proactive actions based on client data
export const generateProactiveActions = (clientData: any, context: string) => {
  const actions = [];
  
  if (clientData?.progress && clientData.progress < 50) {
    actions.push({
      type: 'action' as const,
      text: 'Opprett handlingsplan',
      action: () => logger.log('Creating action plan...'),
      variant: 'default' as const
    });
  }

  if (context === 'client-detail' && clientData?.risk_areas?.length > 0) {
    actions.push({
      type: 'navigation' as const,
      text: 'Vurder risikoområder',
      path: `/klienter/${clientData.id}/risk`,
      variant: 'outline' as const
    });
  }

  return actions;
};

// Function to extract and format contextual tips
export const getContextualSuggestions = (context: string, clientData?: any) => {
  const suggestions = [];

  switch (context) {
    case 'risk-assessment':
      suggestions.push('Vurder materialitetsnivå basert på klientens størrelse');
      suggestions.push('Identifiser bransjespecifikke risikoer');
      break;
    case 'client-detail':
      if (clientData?.industry) {
        suggestions.push(`Sammenlign med andre ${clientData.industry}-klienter`);
      }
      suggestions.push('Sjekk fremdrift på revisjonshandlinger');
      break;
    case 'documentation':
      suggestions.push('Følg ISA 230 for dokumentasjonskrav');
      suggestions.push('Strukturer arbeidspapirer systematisk');
      break;
  }

  return suggestions;
};
