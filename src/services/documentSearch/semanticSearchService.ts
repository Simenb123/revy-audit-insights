
import { supabase } from '@/integrations/supabase/client';
import { ClientDocument } from '@/hooks/useClientDocuments';

export interface SearchQuery {
  term: string;
  filters?: {
    category?: string;
    subjectArea?: string;
    confidenceLevel?: 'high' | 'medium' | 'low' | 'uncategorized';
    dateRange?: {
      start: string;
      end: string;
    };
    aiValidated?: boolean;
  };
  clientId: string;
}

export interface SearchResult {
  document: ClientDocument;
  relevanceScore: number;
  matchReasons: string[];
  suggestedActions?: string[];
}

export interface SearchSuggestion {
  query: string;
  description: string;
  category: string;
  icon: string;
  estimatedResults: number;
}

// Smart search that understands context and meaning
export const performSemanticSearch = async (query: SearchQuery): Promise<SearchResult[]> => {
  console.log('🔍 Performing semantic search:', query);
  
  const { data: documents, error } = await supabase
    .from('client_documents_files')
    .select('*')
    .eq('client_id', query.clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Search error:', error);
    throw error;
  }

  if (!documents || documents.length === 0) {
    return [];
  }

  // Apply filters first
  let filteredDocs = documents;

  if (query.filters?.category) {
    filteredDocs = filteredDocs.filter(doc => doc.category === query.filters?.category);
  }

  if (query.filters?.subjectArea) {
    filteredDocs = filteredDocs.filter(doc => doc.subject_area === query.filters?.subjectArea);
  }

  if (query.filters?.confidenceLevel) {
    filteredDocs = filteredDocs.filter(doc => {
      const score = doc.ai_confidence_score;
      switch (query.filters?.confidenceLevel) {
        case 'high': return score && score >= 0.8;
        case 'medium': return score && score >= 0.6 && score < 0.8;
        case 'low': return score && score < 0.6;
        case 'uncategorized': return !score;
        default: return true;
      }
    });
  }

  if (query.filters?.aiValidated) {
    filteredDocs = filteredDocs.filter(doc => 
      doc.ai_confidence_score && doc.ai_confidence_score >= 0.8
    );
  }

  if (query.filters?.dateRange) {
    const start = new Date(query.filters.dateRange.start);
    const end = new Date(query.filters.dateRange.end);
    filteredDocs = filteredDocs.filter(doc => {
      const docDate = new Date(doc.created_at);
      return docDate >= start && docDate <= end;
    });
  }

  // Perform semantic matching
  const results: SearchResult[] = [];
  const searchTerms = query.term.toLowerCase().split(/\s+/);

  for (const doc of filteredDocs) {
    const matchReasons: string[] = [];
    let relevanceScore = 0;

    // Filename matching
    const fileNameLower = doc.file_name.toLowerCase();
    for (const term of searchTerms) {
      if (fileNameLower.includes(term)) {
        relevanceScore += 0.3;
        matchReasons.push(`Filnavn inneholder "${term}"`);
      }
    }

    // Category matching
    if (doc.category) {
      const categoryLower = doc.category.toLowerCase();
      for (const term of searchTerms) {
        if (categoryLower.includes(term)) {
          relevanceScore += 0.2;
          matchReasons.push(`Kategori matcher "${term}"`);
        }
      }
    }

    // AI analysis matching
    if (doc.ai_analysis_summary) {
      const analysisLower = doc.ai_analysis_summary.toLowerCase();
      for (const term of searchTerms) {
        if (analysisLower.includes(term)) {
          relevanceScore += 0.4;
          matchReasons.push(`AI-analyse inneholder "${term}"`);
        }
      }
    }

    // Semantic concept matching
    const conceptScore = calculateConceptScore(query.term, doc);
    relevanceScore += conceptScore.score;
    matchReasons.push(...conceptScore.reasons);

    // AI confidence boost
    if (doc.ai_confidence_score && doc.ai_confidence_score >= 0.8) {
      relevanceScore += 0.1;
      matchReasons.push('Høy AI-sikkerhet');
    }

    if (relevanceScore > 0.1) {
      const suggestedActions = generateSuggestedActions(doc, query.term);
      
      results.push({
        document: doc,
        relevanceScore,
        matchReasons,
        suggestedActions
      });
    }
  }

  // Sort by relevance score
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  console.log(`✅ Found ${results.length} semantic search results`);
  return results.slice(0, 20); // Top 20 results
};

// Calculate concept-based matching scores
const calculateConceptScore = (searchTerm: string, doc: ClientDocument) => {
  const term = searchTerm.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  // Financial concepts
  const financialTerms = ['regnskap', 'økonomi', 'balanse', 'resultat', 'hovedbok'];
  const payrollTerms = ['lønn', 'lønnslipp', 'ansatt', 'pensjon', 'feriepenger'];
  const taxTerms = ['skatt', 'mva', 'avgift', 'selvangivelse'];
  const auditTerms = ['revisjon', 'kontroll', 'gjennomgang', 'validering'];

  if (financialTerms.some(ft => term.includes(ft)) && 
      (doc.category?.toLowerCase().includes('hovedbok') || 
       doc.category?.toLowerCase().includes('balanse'))) {
    score += 0.3;
    reasons.push('Finansielt konsept match');
  }

  if (payrollTerms.some(pt => term.includes(pt)) && 
      doc.category?.toLowerCase().includes('lønn')) {
    score += 0.3;
    reasons.push('Lønn konsept match');
  }

  if (taxTerms.some(tt => term.includes(tt)) && 
      (doc.file_name.toLowerCase().includes('mva') || 
       doc.file_name.toLowerCase().includes('skatt'))) {
    score += 0.3;
    reasons.push('Skatt konsept match');
  }

  if (auditTerms.some(at => term.includes(at))) {
    score += 0.2;
    reasons.push('Revisjons konsept match');
  }

  return { score, reasons };
};

// Generate AI-powered suggested actions
const generateSuggestedActions = (doc: ClientDocument, searchTerm: string): string[] => {
  const actions: string[] = [];

  if (doc.ai_confidence_score && doc.ai_confidence_score < 0.6) {
    actions.push('Gjennomgå og validér dokumentet');
  }

  if (doc.category === 'hovedbok') {
    actions.push('Analyser kontotransaksjoner');
    actions.push('Kontrollér kontoavstemming');
  }

  if (doc.category === 'lønn') {
    actions.push('Verifiser lønnsberegninger');
    actions.push('Kontrollér feriepenger');
  }

  if (searchTerm.includes('årsoppgjør') || searchTerm.includes('årsslutt')) {
    actions.push('Inkluder i årsoppgjørsdokumentasjon');
  }

  return actions;
};

// Generate intelligent search suggestions
export const generateSearchSuggestions = async (clientId: string): Promise<SearchSuggestion[]> => {
  const { data: documents, error } = await supabase
    .from('client_documents_files')
    .select('category, ai_confidence_score, created_at')
    .eq('client_id', clientId);

  if (error || !documents) {
    return defaultSearchSuggestions;
  }

  const suggestions: SearchSuggestion[] = [...defaultSearchSuggestions];

  // Dynamic suggestions based on client data
  const lowConfidenceDocs = documents.filter(d => d.ai_confidence_score && d.ai_confidence_score < 0.6);
  if (lowConfidenceDocs.length > 0) {
    suggestions.unshift({
      query: 'ai_confidence:low',
      description: `${lowConfidenceDocs.length} dokumenter trenger gjennomgang`,
      category: 'Kvalitet',
      icon: '⚠️',
      estimatedResults: lowConfidenceDocs.length
    });
  }

  const recentDocs = documents.filter(d => {
    const docDate = new Date(d.created_at);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return docDate > oneWeekAgo;
  });

  if (recentDocs.length > 0) {
    suggestions.unshift({
      query: 'recent:7days',
      description: `${recentDocs.length} dokumenter siste uke`,
      category: 'Nylige',
      icon: '📅',
      estimatedResults: recentDocs.length
    });
  }

  return suggestions;
};

const defaultSearchSuggestions: SearchSuggestion[] = [
  {
    query: 'hovedbok 2024',
    description: 'Hovedbok for 2024',
    category: 'Regnskap',
    icon: '📊',
    estimatedResults: 0
  },
  {
    query: 'lønn desember',
    description: 'Lønnsdokumenter desember',
    category: 'Lønn',
    icon: '💰',
    estimatedResults: 0
  },
  {
    query: 'saldobalanse q4',
    description: 'Saldobalanser Q4',
    category: 'Rapporter',
    icon: '📈',
    estimatedResults: 0
  },
  {
    query: 'category:faktura',
    description: 'Alle fakturaer',
    category: 'Transaksjoner',
    icon: '🧾',
    estimatedResults: 0
  },
  {
    query: 'ai_confidence:high',
    description: 'AI-validerte dokumenter',
    category: 'Kvalitet',
    icon: '✅',
    estimatedResults: 0
  }
];
