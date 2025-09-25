import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnhancedSearchRequest {
  query?: string;
  clientId: string;
  action?: 'search' | 'generate_insights' | 'find_similar' | 'analyze_relationships' | 'generate_suggestions' | 'cross_client_analysis';
  filters?: {
    categories?: string[];
    confidenceThreshold?: number;
    semanticSimilarityThreshold?: number;
    includeAuditImplications?: boolean;
    dateRange?: {
      from: string;
      to: string;
    };
  };
  documentId?: string;
  limit?: number;
  analysisTypes?: string[];
  baseClientId?: string;
  compareClientIds?: string[];
  analysisType?: 'patterns' | 'anomalies' | 'benchmarking';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const requestBody: EnhancedSearchRequest = await req.json();
    const { action = 'search', clientId } = requestBody;

    console.log('Enhanced semantic search request:', { action, clientId });

    switch (action) {
      case 'search':
        return await handleSearch(supabase, openAIApiKey, requestBody);
      case 'generate_insights':
        return await handleGenerateInsights(supabase, openAIApiKey, requestBody);
      case 'find_similar':
        return await handleFindSimilar(supabase, openAIApiKey, requestBody);
      case 'analyze_relationships':
        return await handleAnalyzeRelationships(supabase, openAIApiKey, requestBody);
      case 'generate_suggestions':
        return await handleGenerateSuggestions(supabase, openAIApiKey, requestBody);
      case 'cross_client_analysis':
        return await handleCrossClientAnalysis(supabase, openAIApiKey, requestBody);
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Enhanced semantic search error:', error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function handleSearch(supabase: any, openAIApiKey: string, request: EnhancedSearchRequest) {
  const { query, clientId, filters } = request;
  
  if (!query) {
    throw new Error('Search query is required');
  }

  console.log('Performing enhanced semantic search:', { query, clientId, filters });

  // Get documents for the client
  const { data: documents, error: docsError } = await supabase
    .from('client_documents_files')
    .select('*')
    .eq('client_id', clientId);

  if (docsError) {
    throw new Error(`Failed to fetch documents: ${docsError.message}`);
  }

  // Generate embedding for the search query
  const queryEmbedding = await generateEmbedding(openAIApiKey, query);

  // Perform semantic search and ranking
  const results = await performSemanticRanking(
    documents,
    query,
    queryEmbedding,
    filters
  );

  return new Response(
    JSON.stringify({ results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGenerateInsights(supabase: any, openAIApiKey: string, request: EnhancedSearchRequest) {
  const { clientId, analysisTypes = ['patterns', 'anomalies'] } = request;

  console.log('Generating semantic insights:', { clientId, analysisTypes });

  // Get all documents with AI analysis
  const { data: documents, error: docsError } = await supabase
    .from('client_documents_files')
    .select('*')
    .eq('client_id', clientId)
    .not('ai_analysis_summary', 'is', null);

  if (docsError) {
    throw new Error(`Failed to fetch documents: ${docsError.message}`);
  }

  const insights = await generateAIInsights(openAIApiKey, documents, analysisTypes);

  return new Response(
    JSON.stringify({ insights }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleFindSimilar(supabase: any, openAIApiKey: string, request: EnhancedSearchRequest) {
  const { documentId, clientId, limit = 5 } = request;

  if (!documentId) {
    throw new Error('Document ID is required');
  }

  console.log('Finding similar documents:', { documentId, clientId, limit });

  // Get the reference document
  const { data: refDoc, error: refError } = await supabase
    .from('client_documents_files')
    .select('*')
    .eq('id', documentId)
    .single();

  if (refError) {
    throw new Error(`Failed to fetch reference document: ${refError.message}`);
  }

  // Get all other documents for comparison
  const { data: documents, error: docsError } = await supabase
    .from('client_documents_files')
    .select('*')
    .eq('client_id', clientId)
    .neq('id', documentId);

  if (docsError) {
    throw new Error(`Failed to fetch documents: ${docsError.message}`);
  }

  const similarDocuments = await findSimilarDocuments(
    openAIApiKey, 
    refDoc, 
    documents, 
    limit
  );

  return new Response(
    JSON.stringify({ similarDocuments }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleAnalyzeRelationships(supabase: any, openAIApiKey: string, request: EnhancedSearchRequest) {
  const { clientId } = request;

  console.log('Analyzing document relationships:', { clientId });

  // Get all documents with categories
  const { data: documents, error: docsError } = await supabase
    .from('client_documents_files')
    .select('*')
    .eq('client_id', clientId)
    .not('ai_suggested_category', 'is', null);

  if (docsError) {
    throw new Error(`Failed to fetch documents: ${docsError.message}`);
  }

  const relationshipGraph = await analyzeDocumentRelationships(openAIApiKey, documents);

  return new Response(
    JSON.stringify({ relationshipGraph }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGenerateSuggestions(supabase: any, openAIApiKey: string, request: EnhancedSearchRequest) {
  const { clientId } = request;

  console.log('Generating advanced search suggestions:', { clientId });

  // Get document categories and analysis summaries
  const { data: documents, error: docsError } = await supabase
    .from('client_documents_files')
    .select('ai_suggested_category, ai_analysis_summary, ai_extracted_keywords')
    .eq('client_id', clientId)
    .not('ai_suggested_category', 'is', null);

  if (docsError) {
    throw new Error(`Failed to fetch documents: ${docsError.message}`);
  }

  const suggestions = await generateAdvancedSuggestions(openAIApiKey, documents);

  return new Response(
    JSON.stringify({ suggestions }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleCrossClientAnalysis(supabase: any, openAIApiKey: string, request: EnhancedSearchRequest) {
  const { baseClientId, compareClientIds = [], analysisType = 'patterns' } = request;

  if (!baseClientId) {
    throw new Error('baseClientId is required for cross-client analysis');
  }

  console.log('Performing cross-client analysis:', { baseClientId, compareClientIds, analysisType });

  // Get documents for all clients
  const clientIds = [baseClientId, ...compareClientIds];
  const { data: documents, error: docsError } = await supabase
    .from('client_documents_files')
    .select('*')
    .in('client_id', clientIds)
    .not('ai_analysis_summary', 'is', null);

  if (docsError) {
    throw new Error(`Failed to fetch documents: ${docsError.message}`);
  }

  const analysis = await performCrossClientAnalysis(
    openAIApiKey, 
    documents, 
    baseClientId, 
    compareClientIds, 
    analysisType
  );

  return new Response(
    JSON.stringify({ analysis }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Helper functions

async function generateEmbedding(apiKey: string, text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function performSemanticRanking(
  documents: any[],
  query: string,
  queryEmbedding: number[],
  filters: any
) {
  // Simple ranking based on text matching and AI confidence
  // In a real implementation, you would use vector similarity
  return documents
    .filter(doc => {
      if (filters?.categories && filters.categories.length > 0) {
        return filters.categories.includes(doc.ai_suggested_category);
      }
      if (filters?.confidenceThreshold) {
        return (doc.ai_categorization_confidence || 0) >= filters.confidenceThreshold;
      }
      return true;
    })
    .map(doc => ({
      documentId: doc.id,
      fileName: doc.file_name,
      category: doc.ai_suggested_category || 'Ukategorisert',
      confidence: doc.ai_categorization_confidence || 0,
      semanticSimilarity: calculateTextSimilarity(query, doc.ai_analysis_summary || ''),
      relevanceScore: (doc.ai_categorization_confidence || 0) * 0.6 + 
                     calculateTextSimilarity(query, doc.ai_analysis_summary || '') * 0.4,
      matchType: 'semantic' as const,
      excerpts: extractRelevantExcerpts(query, doc.ai_analysis_summary || ''),
      auditImplications: doc.ai_audit_implications || [],
      keywords: doc.ai_extracted_keywords || [],
      riskLevel: determineRiskLevel(doc)
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function calculateTextSimilarity(query: string, text: string): number {
  const queryWords = query.toLowerCase().split(/\s+/);
  const textWords = text.toLowerCase().split(/\s+/);
  
  const intersection = queryWords.filter(word => textWords.includes(word));
  const union = [...new Set([...queryWords, ...textWords])];
  
  return intersection.length / union.length;
}

function extractRelevantExcerpts(query: string, text: string): string[] {
  const sentences = text.split(/[.!?]+/);
  const queryWords = query.toLowerCase().split(/\s+/);
  
  return sentences
    .filter(sentence => 
      queryWords.some(word => sentence.toLowerCase().includes(word))
    )
    .slice(0, 3)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function determineRiskLevel(doc: any): 'low' | 'medium' | 'high' {
  const implications = doc.ai_audit_implications || [];
  const hasRiskKeywords = implications.some((impl: string) => 
    impl.toLowerCase().includes('risk') || 
    impl.toLowerCase().includes('compliance') ||
    impl.toLowerCase().includes('critical')
  );
  
  if (hasRiskKeywords && (doc.ai_categorization_confidence || 0) > 0.8) {
    return 'high';
  } else if (hasRiskKeywords || (doc.ai_categorization_confidence || 0) > 0.6) {
    return 'medium';
  }
  return 'low';
}

async function generateAIInsights(apiKey: string, documents: any[], analysisTypes: string[]) {
  const prompt = `Analyze the following document corpus and generate semantic insights for audit purposes.

Documents summary:
${documents.map(doc => `- ${doc.file_name}: ${doc.ai_suggested_category} (${doc.ai_analysis_summary})`).join('\n')}

Analysis types requested: ${analysisTypes.join(', ')}

Generate insights as JSON array with format:
[{
  "type": "pattern|anomaly|relationship|trend",
  "title": "Brief title",
  "description": "Detailed description",
  "confidence": 0.0-1.0,
  "relatedDocuments": ["doc1", "doc2"],
  "actionable": true/false,
  "severity": "low|medium|high"
}]

Focus on audit-relevant patterns, compliance issues, and risk indicators.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
    model: 'gpt-5',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1000,
    temperature: 0.7
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI insights error: ${response.status}`);
  }

  const data = await response.json();
  try {
    return JSON.parse(data.choices[0].message.content);
  } catch {
    return []; // Return empty array if parsing fails
  }
}

async function findSimilarDocuments(
  apiKey: string, 
  refDoc: any, 
  documents: any[], 
  limit: number
) {
  // Simple similarity based on category and keywords
  const refKeywords = refDoc.ai_extracted_keywords || [];
  const refCategory = refDoc.ai_suggested_category;
  
  return documents
    .map(doc => {
      const keywordSimilarity = calculateArraySimilarity(
        refKeywords, 
        doc.ai_extracted_keywords || []
      );
      const categorySimilarity = doc.ai_suggested_category === refCategory ? 1 : 0;
      
      return {
        documentId: doc.id,
        fileName: doc.file_name,
        category: doc.ai_suggested_category || 'Ukategorisert',
        confidence: doc.ai_categorization_confidence || 0,
        semanticSimilarity: (keywordSimilarity * 0.7 + categorySimilarity * 0.3),
        relevanceScore: (keywordSimilarity * 0.7 + categorySimilarity * 0.3),
        matchType: 'semantic' as const,
        excerpts: [doc.ai_analysis_summary || ''].slice(0, 100),
        auditImplications: doc.ai_audit_implications || [],
        keywords: doc.ai_extracted_keywords || [],
        riskLevel: determineRiskLevel(doc)
      };
    })
    .sort((a, b) => b.semanticSimilarity - a.semanticSimilarity)
    .slice(0, limit);
}

function calculateArraySimilarity(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 && arr2.length === 0) return 1;
  if (arr1.length === 0 || arr2.length === 0) return 0;
  
  const intersection = arr1.filter(item => arr2.includes(item));
  const union = [...new Set([...arr1, ...arr2])];
  
  return intersection.length / union.length;
}

async function analyzeDocumentRelationships(apiKey: string, documents: any[]) {
  // Create a simple relationship graph based on categories and keywords
  const nodes = documents.map(doc => ({
    id: doc.id,
    label: doc.file_name,
    type: doc.ai_suggested_category || 'Unknown',
    weight: doc.ai_categorization_confidence || 0.5
  }));

  const edges = [];
  for (let i = 0; i < documents.length; i++) {
    for (let j = i + 1; j < documents.length; j++) {
      const doc1 = documents[i];
      const doc2 = documents[j];
      
      const similarity = calculateArraySimilarity(
        doc1.ai_extracted_keywords || [],
        doc2.ai_extracted_keywords || []
      );
      
      if (similarity > 0.3) {
        edges.push({
          source: doc1.id,
          target: doc2.id,
          weight: similarity,
          type: 'semantic'
        });
      }
    }
  }

  return { nodes, edges };
}

async function generateAdvancedSuggestions(apiKey: string, documents: any[]) {
  const categories = [...new Set(documents.map(doc => doc.ai_suggested_category))];
  const keywords = [...new Set(documents.flatMap(doc => doc.ai_extracted_keywords || []))];
  
  const suggestions = [];
  
  // Category-based suggestions
  for (const category of categories) {
    if (category) {
      suggestions.push({
        query: `dokumenter i kategorien "${category}"`,
        description: `Finn alle dokumenter kategorisert som ${category}`,
        expectedResults: documents.filter(doc => doc.ai_suggested_category === category).length,
        auditRelevance: 'medium' as const,
        category: category
      });
    }
  }
  
  // Keyword-based suggestions
  for (const keyword of keywords.slice(0, 5)) {
    if (keyword) {
      suggestions.push({
        query: keyword,
        description: `Søk etter dokumenter relatert til ${keyword}`,
        expectedResults: documents.filter(doc => 
          (doc.ai_extracted_keywords || []).includes(keyword)
        ).length,
        auditRelevance: 'high' as const,
        category: 'Nøkkelord'
      });
    }
  }
  
  return suggestions.slice(0, 10);
}

async function performCrossClientAnalysis(
  apiKey: string,
  documents: any[],
  baseClientId: string,
  compareClientIds: string[],
  analysisType: string
) {
  const baseDocuments = documents.filter(doc => doc.client_id === baseClientId);
  const compareDocuments = documents.filter(doc => compareClientIds.includes(doc.client_id));
  
  const baseCategories = [...new Set(baseDocuments.map(doc => doc.ai_suggested_category))];
  const baseKeywords = [...new Set(baseDocuments.flatMap(doc => doc.ai_extracted_keywords || []))];
  
  const comparisons = compareClientIds.map(clientId => {
    const clientDocs = documents.filter(doc => doc.client_id === clientId);
    const clientCategories = [...new Set(clientDocs.map(doc => doc.ai_suggested_category))];
    const clientKeywords = [...new Set(clientDocs.flatMap(doc => doc.ai_extracted_keywords || []))];
    
    const categorySimilarity = calculateArraySimilarity(baseCategories, clientCategories);
    const keywordSimilarity = calculateArraySimilarity(baseKeywords, clientKeywords);
    
    return {
      clientId,
      similarity: (categorySimilarity + keywordSimilarity) / 2,
      distinctPatterns: clientCategories.filter(cat => !baseCategories.includes(cat)),
      commonPatterns: clientCategories.filter(cat => baseCategories.includes(cat))
    };
  });
  
  const insights = [{
    type: 'pattern' as const,
    title: 'Cross-client analysis completed',
    description: `Analyzed ${baseDocuments.length} base documents against ${compareDocuments.length} comparison documents`,
    confidence: 0.8,
    relatedDocuments: [baseClientId, ...compareClientIds],
    actionable: true,
    severity: 'medium' as const
  }];
  
  return { insights, comparisons };
}