
import { supabase } from '@/integrations/supabase/client';
import { ClientDocument } from '@/hooks/useClientDocuments';

export interface DocumentInsight {
  type: 'category_suggestion' | 'quality_check' | 'missing_info' | 'workflow_tip';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  suggestedAction?: string;
}

export interface DocumentAnalysisContext {
  documents: ClientDocument[];
  clientId: string;
  currentCategory?: string;
  userContext: string;
}

export interface ClientData {
  company_name?: string;
  industry?: string;
}

export const generateDocumentInsights = async (context: DocumentAnalysisContext): Promise<DocumentInsight[]> => {
  const insights: DocumentInsight[] = [];
  
  // Analyze document categorization quality
  const uncategorizedDocs = context.documents.filter(doc => !doc.category || doc.category === 'uncategorized');
  if (uncategorizedDocs.length > 0) {
    insights.push({
      type: 'category_suggestion',
      title: 'Ukategoriserte dokumenter funnet',
      description: `${uncategorizedDocs.length} dokumenter mangler kategorisering. AI-Revy kan hjelpe med automatisk kategorisering.`,
      confidence: 0.9,
      actionable: true,
      suggestedAction: 'Analyser dokumenter med AI for å foreslå kategorier'
    });
  }

  // Check for low confidence AI suggestions
  const lowConfidenceDocs = context.documents.filter(
    doc =>
      typeof doc.ai_confidence_score === 'number' &&
      doc.ai_confidence_score < 0.6
  );
  if (lowConfidenceDocs.length > 0) {
    insights.push({
      type: 'quality_check',
      title: 'Dokumenter med lav AI-sikkerhet',
      description: `${lowConfidenceDocs.length} dokumenter har lav kategoriseringssikkerhet og bør gjennomgås manuelt.`,
      confidence: 0.8,
      actionable: true,
      suggestedAction: 'Gjennomgå og bekreft kategoriseringer manuelt'
    });
  }

  // Workflow optimization tips
  if (context.documents.length > 20) {
    insights.push({
      type: 'workflow_tip',
      title: 'Optimalisering av arbeidsflyt',
      description: 'Med mange dokumenter kan bulk-operasjoner spare tid. Bruk bulk-endring fanen for effektiv håndtering.',
      confidence: 0.7,
      actionable: true,
      suggestedAction: 'Utforsk bulk-endring funksjoner'
    });
  }

  // Subject area distribution analysis
  const subjectAreas = [...new Set(context.documents.map(d => d.subject_area).filter(Boolean))];
  if (subjectAreas.length > 5) {
    insights.push({
      type: 'workflow_tip',
      title: 'Mange fagområder identifisert',
      description: `Dokumentene dekker ${subjectAreas.length} ulike fagområder. Vurder å organisere revisjonsarbeidet etter fagområde.`,
      confidence: 0.6,
      actionable: true,
      suggestedAction: 'Organiser revisjonshandlinger etter fagområde'
    });
  }

  return insights.sort((a, b) => b.confidence - a.confidence);
};

export const getContextualDocumentSuggestions = async (
  userQuestion: string,
  documents: ClientDocument[],
  context: string
): Promise<string[]> => {
  const suggestions: string[] = [];
  
  // Context-specific suggestions
  switch (context) {
    case 'documentation':
      suggestions.push(
        'Hvilke dokumenter mangler for en komplett revisjon?',
        'Kan du analysere kvaliteten på de opplastede dokumentene?',
        'Foreslå kategorisering for ukategoriserte dokumenter',
        'Hvilke fagområder er best dekket av dokumentene?'
      );
      break;
      
    case 'audit-actions':
      suggestions.push(
        'Hvilke revisjonshandlinger passer til de opplastede dokumentene?',
        'Foreslå handlinger basert på dokumentkategoriene',
        'Hvilke ISA-standarder er relevante for disse dokumentene?'
      );
      break;
      
    default:
      suggestions.push(
        'Hjelp meg med å organisere dokumentene',
        'Analyser dokumentkvaliteten',
        'Foreslå neste steg i dokumentbehandlingen'
      );
  }

  // Add document-specific suggestions
  if (documents.length === 0) {
    suggestions.unshift('Hvilke dokumenter bør jeg laste opp først?');
  } else {
    const uncategorized = documents.filter(d => !d.category).length;
    if (uncategorized > 0) {
      suggestions.unshift(`Kategoriser ${uncategorized} ukategoriserte dokumenter`);
    }
  }

  // Use user question to tailor suggestions
  if (userQuestion) {
    const lowerQuestion = userQuestion.toLowerCase();

    // Insert keyword-based suggestions related to the question
    const keywordSuggestions: string[] = [];
    if (lowerQuestion.includes('kategori')) {
      keywordSuggestions.push('Foreslå kategorisering for ukategoriserte dokumenter');
    }
    if (lowerQuestion.includes('mangel')) {
      keywordSuggestions.push('Hvilke dokumenter mangler for en komplett revisjon?');
    }
    if (lowerQuestion.includes('kvalitet')) {
      keywordSuggestions.push('Kan du analysere kvaliteten på de opplastede dokumentene?');
    }

    keywordSuggestions.forEach(suggestion => {
      if (!suggestions.includes(suggestion)) {
        suggestions.unshift(suggestion);
      }
    });

    // Rank suggestions by keyword overlap with the question
    const keywords = lowerQuestion.split(/\s+/).filter(word => word.length > 2);
    const ranked = suggestions
      .map(text => ({
        text,
        score: keywords.reduce(
          (acc, kw) => acc + (text.toLowerCase().includes(kw) ? 1 : 0),
          0
        )
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.text);

    return [...new Set(ranked)].slice(0, 4);
  }

  return suggestions.slice(0, 4); // Limit to 4 suggestions
};

export const generateSmartDocumentPrompt = (
  userMessage: string,
  documents: ClientDocument[],
  context: string,
  clientData?: ClientData
): string => {
  const documentStats = {
    total: documents.length,
    categorized: documents.filter(d => d.category && d.category !== 'uncategorized').length,
    highConfidence: documents.filter(d => d.ai_confidence_score && d.ai_confidence_score >= 0.8).length,
    categories: [...new Set(documents.map(d => d.category).filter(Boolean))],
    subjectAreas: [...new Set(documents.map(d => d.subject_area).filter(Boolean))]
  };

  return `Som AI-Revy, en ekspert på revisjon og dokumentanalyse, skal du hjelpe med følgende forespørsel:

BRUKERFORESPØRSEL: "${userMessage}"

KONTEKST: ${context}

DOKUMENTOVERSIKT:
- Totalt dokumenter: ${documentStats.total}
- Kategoriserte: ${documentStats.categorized}
- Høy AI-sikkerhet: ${documentStats.highConfidence}
- Kategorier: ${documentStats.categories.join(', ') || 'Ingen'}
- Fagområder: ${documentStats.subjectAreas.join(', ') || 'Ingen'}

${clientData?.company_name ? `KLIENT: ${clientData.company_name} (${clientData.industry ?? 'Ukjent bransje'})` : ''}

Gi et konkret, praktisk svar som hjelper brukeren med dokumenthåndtering og revisjon. Fokuser på handlingsrettede råd.`;
};
