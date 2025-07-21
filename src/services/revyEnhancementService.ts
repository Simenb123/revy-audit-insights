
import { logger } from '@/utils/logger';
import { RevyContext, ProactiveAction } from '@/types/revio';
import { FileText, ExternalLink, AlertCircle, Users, TrendingUp, Book } from 'lucide-react';

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
  clientData?: any,
  knowledgeArticles?: any[]
): EnhancedResponse => {
  const links: EnhancedResponse['links'] = [];
  const sources: EnhancedResponse['sources'] = [];
  let content = rawResponse;

  // Parse markdown links from AI response
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = markdownLinkRegex.exec(content)) !== null) {
    const linkText = match[1];
    const linkPath = match[2];
    
    // Check if it's an internal article link
    if (linkPath.startsWith('/fag/artikkel/')) {
      links.push({
        type: 'knowledge',
        text: linkText,
        path: linkPath,
        icon: <Book className="h-3 w-3" />,
        variant: 'outline'
      });
    } else if (linkPath.startsWith('/')) {
      // Internal navigation link
      links.push({
        type: 'navigation',
        text: linkText,
        path: linkPath,
        icon: <TrendingUp className="h-3 w-3" />,
        variant: 'outline'
      });
    } else if (linkPath.startsWith('http')) {
      // External link
      links.push({
        type: 'external',
        text: linkText,
        url: linkPath,
        icon: <ExternalLink className="h-3 w-3" />,
        variant: 'outline'
      });
    }
  }

  // Add sources from knowledge articles if provided
  if (knowledgeArticles && knowledgeArticles.length > 0) {
    knowledgeArticles.forEach(article => {
      if (article.title && content.includes(article.title)) {
        sources.push({
          title: article.title,
          type: 'knowledge',
          reference: article.slug,
          url: article.slug ? `/fag/artikkel/${article.slug}` : undefined
        });
      }
    });
  }

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

  // Context-specific navigation links
  const navigationPatterns = [
    {
      keywords: ['risikovurdering', 'risiko', 'risikoanalyse'],
      text: 'Gå til Risikoanalyse',
      path: '/risikoanalyse',
      icon: <AlertCircle className="h-3 w-3" />,
      variant: 'outline' as const
    },
    {
      keywords: ['klient', 'klientdetaljer', 'klientinformasjon'],
      text: 'Se klientdetaljer',
      path: clientData?.id ? `/klienter/${clientData.id}` : '/klienter',
      icon: <Users className="h-3 w-3" />,
      variant: 'outline' as const
    },
    {
      keywords: ['revisjonshandlinger', 'handlinger', 'oppgaver'],
      text: 'Vis revisjonshandlinger',
      path: clientData?.id ? `/klienter/${clientData.id}?tab=actions` : '/klienter',
      icon: <FileText className="h-3 w-3" />,
      variant: 'outline' as const
    },
    {
      keywords: ['dokumentasjon', 'arbeidspapirer', 'dokumenter'],
      text: 'Last opp dokumenter',
      path: '/data-import',
      icon: <FileText className="h-3 w-3" />,
      variant: 'outline' as const
    },
    {
      keywords: ['kunnskapsbase', 'fagstoff', 'veiledning'],
      text: 'Utforsk kunnskapsbase',
      path: '/kunnskap',
      icon: <Book className="h-3 w-3" />,
      variant: 'outline' as const
    }
  ];

  // Add relevant navigation links based on content
  navigationPatterns.forEach(pattern => {
    if (pattern.keywords.some(keyword => content.toLowerCase().includes(keyword))) {
      // Only add if not already present
      if (!links.some(link => link.path === pattern.path)) {
        links.push({
          type: 'navigation' as const,
          text: pattern.text,
          path: pattern.path,
          icon: pattern.icon,
          variant: pattern.variant
        });
      }
    }
  });

  // Context-specific enhancements
  if (context === 'risk-assessment') {
    links.push({
      type: 'action',
      text: 'Start risikovurdering',
      path: `/klienter/${clientData?.id}/risk-assessment`,
      icon: <AlertCircle className="h-3 w-3" />,
      variant: 'default'
    });
  }

  if (context === 'client-detail' && clientData) {
    links.push({
      type: 'navigation',
      text: 'Se fremdrift',
      path: `/klienter/${clientData.id}?tab=progress`,
      icon: <TrendingUp className="h-3 w-3" />,
      variant: 'secondary'
    });
  }

  return {
    content,
    links: links.slice(0, 4), // Limit to 4 most relevant links
    sources: [...new Set(sources.map(s => JSON.stringify(s)))].map(s => JSON.parse(s)) // Remove duplicates
  };
};

// Helper function to generate proactive actions based on client data
export const generateProactiveActions = (
  clientData: any,
  context: RevyContext
): ProactiveAction[] => {
  const actions: ProactiveAction[] = [];
  
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
export const getContextualSuggestions = (
  context: RevyContext,
  clientData?: any
): ProactiveAction[] => {
  const suggestions: ProactiveAction[] = [];

  switch (context) {
    case 'risk-assessment':
      suggestions.push({ type: 'knowledge', text: 'Vurder materialitetsnivå basert på klientens størrelse' });
      suggestions.push({ type: 'knowledge', text: 'Identifiser bransjespecifikke risikoer' });
      break;
    case 'client-detail':
      if (clientData?.industry) {
        suggestions.push({ type: 'knowledge', text: `Sammenlign med andre ${clientData.industry}-klienter` });
      }
      suggestions.push({ type: 'knowledge', text: 'Sjekk fremdrift på revisjonshandlinger' });
      break;
    case 'documentation':
      suggestions.push({ type: 'knowledge', text: 'Følg ISA 230 for dokumentasjonskrav' });
      suggestions.push({ type: 'knowledge', text: 'Strukturer arbeidspapirer systematisk' });
      break;
  }

  return suggestions;
};
