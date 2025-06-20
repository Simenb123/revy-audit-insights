
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

export async function fetchEnhancedClientContext(clientId: string) {
  console.log('🔍 Fetching enhanced client context for:', clientId);
  
  try {
    // Get client basic info
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('company_name, organization_number, industry')
      .eq('id', clientId)
      .single();

    if (clientError) {
      console.error('Error fetching client:', clientError);
      return null;
    }

    // Get document insights
    const { data: documents, error: docsError } = await supabase
      .from('client_documents_files')
      .select('id, file_name, category, ai_analysis_summary, extracted_text, ai_confidence_score, created_at')
      .eq('client_id', clientId);

    if (docsError) {
      console.error('Error fetching documents:', docsError);
      return null;
    }

    const documentInsights = {
      totalDocuments: documents?.length || 0,
      withText: documents?.filter(d => d.extracted_text).length || 0,
      categories: [...new Set(documents?.map(d => d.category).filter(Boolean))] || [],
      avgConfidence: documents?.length ? 
        documents.reduce((sum, d) => sum + (d.ai_confidence_score || 0), 0) / documents.length : 0
    };

    const contextString = `Klient: ${client.company_name}
Org.nr: ${client.organization_number || 'Ikke oppgitt'}
Bransje: ${client.industry || 'Ikke oppgitt'}
Dokumenter: ${documentInsights.totalDocuments} totalt, ${documentInsights.withText} med tekstinnhold
Kategorier: ${documentInsights.categories.join(', ') || 'Ingen'}
Gjennomsnittlig AI-sikkerhet: ${Math.round(documentInsights.avgConfidence * 100)}%`;

    console.log('✅ Enhanced client context built:', { 
      clientName: client.company_name,
      documentsProcessed: documentInsights.totalDocuments,
      withText: documentInsights.withText,
      categories: documentInsights.categories.length
    });

    return {
      contextString,
      documentInsights,
      client
    };

  } catch (error) {
    console.error('Error building enhanced client context:', error);
    return null;
  }
}

export async function searchDocumentContent(clientId: string, query: string) {
  console.log('🔍 Searching document content for client:', clientId, 'query:', query);
  
  try {
    const { data: documents, error } = await supabase
      .from('client_documents_files')
      .select('id, file_name, category, ai_analysis_summary, extracted_text, ai_confidence_score, created_at')
      .eq('client_id', clientId)
      .or(`extracted_text.ilike.%${query}%,ai_analysis_summary.ilike.%${query}%,file_name.ilike.%${query}%`)
      .limit(5);

    if (error) {
      console.error('Error searching documents:', error);
      return [];
    }

    const results = (documents || []).map(doc => ({
      id: doc.id,
      fileName: doc.file_name,
      category: doc.category,
      summary: doc.ai_analysis_summary,
      confidence: doc.ai_confidence_score,
      textPreview: doc.extracted_text ? doc.extracted_text.substring(0, 300) + '...' : undefined,
      uploadDate: doc.created_at,
      relevantText: extractRelevantText(doc.extracted_text, query),
      fullContent: doc.extracted_text // Include full content for AI processing
    }));

    console.log('✅ Found', results.length, 'relevant documents');
    return results;

  } catch (error) {
    console.error('Error searching document content:', error);
    return [];
  }
}

export async function findDocumentByReference(clientId: string, reference: string) {
  console.log('🔍 Finding document by reference in edge function:', clientId, reference);
  
  try {
    // Extract potential identifiers from the reference
    const identifiers = extractDocumentIdentifiers(reference);
    
    const { data: documents, error } = await supabase
      .from('client_documents_files')
      .select('id, file_name, category, ai_analysis_summary, extracted_text, ai_confidence_score, created_at')
      .eq('client_id', clientId);

    if (error) {
      console.error('Error fetching documents:', error);
      return null;
    }

    // Find the best matching document
    const bestMatch = findBestDocumentMatch(documents || [], identifiers);
    
    if (bestMatch) {
      console.log('✅ Found specific document match:', bestMatch.file_name);
      return {
        id: bestMatch.id,
        fileName: bestMatch.file_name,
        category: bestMatch.category,
        summary: bestMatch.ai_analysis_summary,
        confidence: bestMatch.ai_confidence_score,
        textPreview: bestMatch.extracted_text ? bestMatch.extracted_text.substring(0, 500) + '...' : undefined,
        uploadDate: bestMatch.created_at,
        fullContent: bestMatch.extracted_text // IMPORTANT: Include full content for AI
      };
    }

    return null;
  } catch (error) {
    console.error('Error finding document by reference:', error);
    return null;
  }
}

// Helper functions
function extractDocumentIdentifiers(reference: string): string[] {
  const identifiers = [];
  
  // Extract numbers (like invoice numbers)
  const numbers = reference.match(/\d+/g);
  if (numbers) {
    identifiers.push(...numbers);
  }
  
  // Extract key terms
  const terms = reference.toLowerCase().split(/\s+/).filter(term => 
    term.length > 2 && !['på', 'i', 'av', 'til', 'fra', 'med', 'for', 'som', 'hva', 'står', 'kan', 'du', 'lese'].includes(term)
  );
  identifiers.push(...terms);
  
  return identifiers;
}

function findBestDocumentMatch(documents: any[], identifiers: string[]): any | null {
  let bestMatch = null;
  let bestScore = 0;
  
  for (const doc of documents) {
    let score = 0;
    const searchText = `${doc.file_name} ${doc.ai_analysis_summary || ''} ${doc.extracted_text || ''}`.toLowerCase();
    const fileName = doc.file_name.toLowerCase();
    
    console.log('📊 Document', fileName, 'scored:', 0);
    
    for (const identifier of identifiers) {
      const identifierLower = identifier.toLowerCase();
      
      if (fileName.includes(identifierLower)) {
        // Boost score significantly for filename matches
        score += 10;
      } else if (doc.ai_analysis_summary?.toLowerCase().includes(identifierLower)) {
        // Medium score for summary matches
        score += 5;
      } else if (searchText.includes(identifierLower)) {
        // Lower score for content matches
        score += 1;
      }
    }
    
    console.log('📊 Document', fileName, 'scored:', score);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = doc;
    }
  }
  
  if (bestMatch) {
    console.log('🎯 Best match:', bestMatch.file_name, 'with score:', bestScore);
  }
  
  return bestScore > 0 ? bestMatch : null;
}

function extractRelevantText(text: string, query: string): string | undefined {
  if (!text || !query) return undefined;
  
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const index = textLower.indexOf(queryLower);
  
  if (index === -1) return undefined;
  
  const start = Math.max(0, index - 100);
  const end = Math.min(text.length, index + query.length + 100);
  
  return text.substring(start, end);
}
