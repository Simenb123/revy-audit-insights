
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeArticle, KnowledgeCategory } from '@/types/knowledge';
import { AuditPhase, AuditSubjectArea } from '@/types/revio';

export interface KnowledgeSearchResult {
  article: KnowledgeArticle;
  relevanceScore: number;
  matchedTerms: string[];
}

export interface RelevantKnowledge {
  articles: KnowledgeSearchResult[];
  isaStandards: string[];
  procedures: string[];
  riskFactors: string[];
}

// Search knowledge base for relevant articles based on context and query
export const searchRelevantKnowledge = async (
  query: string,
  context: string,
  subjectArea?: AuditSubjectArea,
  phase?: AuditPhase
): Promise<RelevantKnowledge> => {
  try {
    // Extract key terms for semantic search
    const searchTerms = extractSearchTerms(query, context, subjectArea, phase);
    
    // Search published articles
    const { data: articles, error } = await supabase
      .from('knowledge_articles')
      .select(`
        *,
        category:knowledge_categories(*)
      `)
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error searching knowledge base:', error);
      return getEmptyKnowledge();
    }

    // Filter and score articles for relevance
    const relevantArticles = scoreArticleRelevance(articles || [], searchTerms, subjectArea);
    
    // Extract ISA standards mentioned in relevant articles
    const isaStandards = extractISAStandards(relevantArticles);
    
    // Get relevant procedures based on context
    const procedures = getRelevantProcedures(context, subjectArea, phase);
    
    // Identify risk factors
    const riskFactors = identifyRiskFactors(query, context, subjectArea);

    return {
      articles: relevantArticles.slice(0, 5), // Top 5 most relevant
      isaStandards,
      procedures,
      riskFactors
    };
  } catch (error) {
    console.error('Error in searchRelevantKnowledge:', error);
    return getEmptyKnowledge();
  }
};

// Extract search terms from query and context
const extractSearchTerms = (
  query: string, 
  context: string, 
  subjectArea?: AuditSubjectArea, 
  phase?: AuditPhase
): string[] => {
  const terms = [];
  
  // Add query terms
  terms.push(...query.toLowerCase().split(/\s+/).filter(term => term.length > 2));
  
  // Add context-specific terms
  const contextTerms = {
    'risk-assessment': ['risiko', 'vurdering', 'materialitet', 'vesentlighet'],
    'client-detail': ['klient', 'selskap', 'bransje', 'regnskap'],
    'documentation': ['dokumentasjon', 'arbeidspapir', 'bevis', 'ISA 230'],
    'audit-actions': ['handlinger', 'prosedyrer', 'testing', 'kontroll']
  };
  
  if (contextTerms[context as keyof typeof contextTerms]) {
    terms.push(...contextTerms[context as keyof typeof contextTerms]);
  }
  
  // Add subject area terms
  if (subjectArea) {
    const subjectTerms = {
      'revenue': ['omsetning', 'inntekt', 'salg', 'fakturering'],
      'expenses': ['kostnader', 'utgifter', 'lønn', 'innkjøp'],
      'assets': ['eiendeler', 'anleggsmidler', 'varelager', 'fordringer'],
      'liabilities': ['gjeld', 'forpliktelser', 'leverandørgjeld'],
      'equity': ['egenkapital', 'aksjekapital', 'opptjent kapital'],
      'cash': ['kontanter', 'bank', 'likviditet', 'kontantstrøm']
    };
    
    if (subjectTerms[subjectArea as keyof typeof subjectTerms]) {
      terms.push(...subjectTerms[subjectArea as keyof typeof subjectTerms]);
    }
  }
  
  // Add phase-specific terms
  if (phase) {
    const phaseTerms = {
      'planning': ['planlegging', 'strategi', 'tilnærming', 'teamsammensetting'],
      'risk_assessment': ['risiko', 'materialitet', 'kontrollmiljø', 'IT-kontroller'],
      'execution': ['testing', 'utvalg', 'prosedyrer', 'bevis'],
      'completion': ['konklusjon', 'rapportering', 'oppfølging', 'representasjonsbrev']
    };
    
    if (phaseTerms[phase as keyof typeof phaseTerms]) {
      terms.push(...phaseTerms[phase as keyof typeof phaseTerms]);
    }
  }
  
  return [...new Set(terms)]; // Remove duplicates
};

// Score articles for relevance based on search terms and subject area
const scoreArticleRelevance = (
  articles: any[], 
  searchTerms: string[], 
  subjectArea?: AuditSubjectArea
): KnowledgeSearchResult[] => {
  return articles
    .map(article => {
      let score = 0;
      const matchedTerms: string[] = [];
      
      const searchText = `${article.title} ${article.summary || ''} ${article.content} ${(article.tags || []).join(' ')}`.toLowerCase();
      
      // Score based on term matches
      searchTerms.forEach(term => {
        const termCount = (searchText.match(new RegExp(term, 'gi')) || []).length;
        if (termCount > 0) {
          score += termCount * (term.length > 4 ? 2 : 1); // Longer terms get higher weight
          matchedTerms.push(term);
        }
      });
      
      // Boost score for title matches
      searchTerms.forEach(term => {
        if (article.title.toLowerCase().includes(term)) {
          score += 5;
        }
      });
      
      // Boost score for high view count
      score += Math.min(article.view_count / 10, 10);
      
      // Boost score for subject area relevance
      if (subjectArea && article.category?.name.toLowerCase().includes(subjectArea)) {
        score += 10;
      }
      
      return {
        article,
        relevanceScore: score,
        matchedTerms
      };
    })
    .filter(result => result.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
};

// Extract ISA standards from article content
const extractISAStandards = (articles: KnowledgeSearchResult[]): string[] => {
  const isaPattern = /ISA\s+(\d+)/gi;
  const standards = new Set<string>();
  
  articles.forEach(({ article }) => {
    const content = `${article.title} ${article.content}`;
    const matches = content.match(isaPattern);
    if (matches) {
      matches.forEach(match => standards.add(match.toUpperCase()));
    }
  });
  
  return Array.from(standards).sort();
};

// Get relevant procedures based on context and phase
const getRelevantProcedures = (
  context: string, 
  subjectArea?: AuditSubjectArea, 
  phase?: AuditPhase
): string[] => {
  const procedures: string[] = [];
  
  // Context-specific procedures
  if (context === 'risk-assessment') {
    procedures.push(
      'Identifiser og vurder risiko for vesentlig feilinformasjon',
      'Fastsett materialitetsnivå for regnskapet som helhet',
      'Vurder kontrollmiljøet hos klienten',
      'Identifiser betydningsfulle kontoklasser og transaksjonstyper'
    );
  }
  
  // Subject area procedures
  if (subjectArea === 'revenue') {
    procedures.push(
      'Test inntektsføring i henhold til IFRS 15',
      'Verifiser fullstendighet av omsetning',
      'Test cut-off av salgstransaksjoner',
      'Bekreft kundefordringer'
    );
  }
  
  // Phase-specific procedures
  if (phase === 'execution') {
    procedures.push(
      'Utfør detaljert testing av utvalgte transaksjoner',
      'Gjennomfør substansielle analytiske handlinger',
      'Test kontroller der dette er planlagt',
      'Innhent tilstrekkelig og hensiktsmessig revisjonsbevis'
    );
  }
  
  return procedures;
};

// Identify risk factors based on query and context
const identifyRiskFactors = (
  query: string, 
  context: string, 
  subjectArea?: AuditSubjectArea
): string[] => {
  const riskFactors: string[] = [];
  const queryLower = query.toLowerCase();
  
  // General risk indicators
  const riskKeywords = {
    'omsetning': ['Risiko for for tidlig inntektsføring', 'Cut-off risiko', 'Fullstendighetsrisiko'],
    'kontanter': ['Mislighetsrisiko', 'Likviditetsrisiko', 'Kontrollrisiko'],
    'lager': ['Verdsettelsesrisiko', 'Tilstedeværelsesrisiko', 'Foreldelsesrisiko'],
    'gjeld': ['Fullstendighetsrisiko', 'Cut-off risiko', 'Verdsettelserisiko']
  };
  
  Object.entries(riskKeywords).forEach(([keyword, risks]) => {
    if (queryLower.includes(keyword)) {
      riskFactors.push(...risks);
    }
  });
  
  // Subject area specific risks
  if (subjectArea === 'revenue') {
    riskFactors.push('Inntektsføring', 'Kundefordringer', 'Returer og kreditnotaer');
  }
  
  return [...new Set(riskFactors)]; // Remove duplicates
};

// Get empty knowledge result
const getEmptyKnowledge = (): RelevantKnowledge => ({
  articles: [],
  isaStandards: [],
  procedures: [],
  riskFactors: []
});

// Get procedure templates for specific subject areas
export const getProcedureTemplates = async (subjectArea: AuditSubjectArea): Promise<string[]> => {
  try {
    const { data: templates, error } = await supabase
      .from('audit_action_templates')
      .select('procedures, name')
      .eq('subject_area', subjectArea)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching procedure templates:', error);
      return [];
    }

    return templates?.map(t => `${t.name}: ${t.procedures}`) || [];
  } catch (error) {
    console.error('Error in getProcedureTemplates:', error);
    return [];
  }
};
