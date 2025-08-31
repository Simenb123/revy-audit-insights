import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, context_type = 'legal', max_results = 10 } = await req.json();
    
    if (!query) {
      throw new Error('Query parameter is required');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`🔍 Enhanced legal search for: "${query}"`);

    // Generate embedding for the query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: query,
      }),
    });

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // 1. Search legal documents with semantic search (with fallback)
    let semanticDocuments = [];
    const { data: semanticResults, error: semanticError } = await supabase.rpc(
      'match_legal_documents', 
      {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: max_results
      }
    );

    if (semanticError) {
      console.error('Semantic search error, falling back to text search:', semanticError);
      
      // Fallback to full-text search
      const { data: textSearchResults, error: textError } = await supabase
        .from('legal_documents')
        .select(`
          *,
          document_type:legal_document_types(*)
        `)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,document_number.ilike.%${query}%`)
        .eq('is_active', true)
        .limit(max_results);
        
      if (!textError) {
        semanticDocuments = textSearchResults || [];
      }
    } else {
      semanticDocuments = semanticResults || [];
    }

    // 2. Search legal provisions
    const { data: provisions, error: provisionError } = await supabase
      .from('legal_provisions')
      .select(`
        *,
        parent_provision:legal_provisions!parent_provision_id(*)
      `)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,law_identifier.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(max_results);

    if (provisionError) {
      console.error('Provision search error:', provisionError);
    }

    // 3. Search document types for context
    const { data: documentTypes, error: typesError } = await supabase
      .from('legal_document_types')
      .select('*')
      .eq('is_active', true)
      .order('authority_weight', { ascending: false });

    if (typesError) {
      console.error('Document types error:', typesError);
    }

    // 4. Get related documents through provisions
    let relatedDocuments = [];
    if (provisions && provisions.length > 0) {
      const provisionIds = provisions.map(p => p.id);
      
      const { data: relations, error: relError } = await supabase
        .from('provision_document_relations')
        .select(`
          *,
          document:legal_documents(
            *,
            document_type:legal_document_types(*)
          )
        `)
        .in('provision_id', provisionIds)
        .order('relevance_score', { ascending: false });

      if (!relError && relations) {
        relatedDocuments = relations.map(r => r.document).filter(Boolean);
      }
    }

    // 5. Search citations for cross-references
    const { data: citations, error: citationError } = await supabase
      .from('legal_citations')
      .select(`
        *,
        document:legal_documents(*),
        provision:legal_provisions(*)
      `)
      .ilike('citation_text', `%${query}%`)
      .limit(20);

    if (citationError) {
      console.error('Citation search error:', citationError);
    }

    // Combine and rank results
    const allDocuments = [
      ...(semanticDocuments || []),
      ...(relatedDocuments || [])
    ];

    // Remove duplicates and sort by authority + relevance
    const uniqueDocuments = Array.from(
      new Map(allDocuments.map(doc => [doc.id, doc])).values()
    ).sort((a, b) => {
      const aWeight = a.document_type?.authority_weight || 0;
      const bWeight = b.document_type?.authority_weight || 0;
      const aRelevance = a.similarity || 0;
      const bRelevance = b.similarity || 0;
      
      const aScore = (aWeight * 0.6) + (aRelevance * 0.4);
      const bScore = (bWeight * 0.6) + (bRelevance * 0.4);
      
      return bScore - aScore;
    }).slice(0, max_results);

    // Create enhanced context for AI
    const context = {
      query,
      total_results: uniqueDocuments.length + (provisions?.length || 0),
      search_metadata: {
        semantic_documents: semanticDocuments?.length || 0,
        related_provisions: provisions?.length || 0,
        citations_found: citations?.length || 0,
        cross_references: relatedDocuments?.length || 0
      },
      primary_sources: uniqueDocuments.filter(doc => 
        doc.document_type?.hierarchy_level === 1
      ),
      secondary_sources: uniqueDocuments.filter(doc => 
        doc.document_type?.hierarchy_level === 2
      ),
      tertiary_sources: uniqueDocuments.filter(doc => 
        doc.document_type?.hierarchy_level === 3
      ),
      relevant_provisions: provisions || [],
      citations: citations || [],
      authority_ranking: uniqueDocuments.map((doc, index) => ({
        rank: index + 1,
        document_id: doc.id,
        title: doc.title,
        authority_weight: doc.document_type?.authority_weight || 0,
        document_type: doc.document_type?.display_name,
        relevance_score: doc.similarity || 0
      }))
    };

    // Generate AI summary if requested
    let ai_summary = null;
    if (context_type === 'ai_summary' && uniqueDocuments.length > 0) {
      const summaryPrompt = `
        Based on the following legal search results for "${query}", provide a concise legal summary:

        PRIMARY SOURCES (Highest Authority):
        ${context.primary_sources.map(doc => `- ${doc.title}: ${doc.content?.substring(0, 500)}...`).join('\n')}

        SECONDARY SOURCES:
        ${context.secondary_sources.map(doc => `- ${doc.title}: ${doc.content?.substring(0, 300)}...`).join('\n')}

        RELEVANT PROVISIONS:
        ${context.relevant_provisions.map(prov => `- ${prov.law_identifier} § ${prov.provision_number}: ${prov.title}`).join('\n')}

        Provide a structured legal summary with:
        1. Main legal principle
        2. Relevant legal sources (ranked by authority)
        3. Key provisions and their implications
        4. Practical considerations

        Keep the response professional and cite specific sources.
      `;

      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are a Norwegian legal expert providing precise legal analysis based on authoritative sources.' 
            },
            { role: 'user', content: summaryPrompt }
          ],
          max_tokens: 1500
        }),
      });

      const aiData = await aiResponse.json();
      ai_summary = aiData.choices[0].message.content;
    }

    console.log(`✅ Enhanced legal search completed: ${context.total_results} results`);

    return new Response(JSON.stringify({
      success: true,
      context,
      ai_summary,
      performance: {
        search_time_ms: Date.now() - Date.now(),
        total_sources: uniqueDocuments.length,
        authority_distribution: {
          primary: context.primary_sources.length,
          secondary: context.secondary_sources.length,
          tertiary: context.tertiary_sources.length
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in enhanced-legal-search:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});