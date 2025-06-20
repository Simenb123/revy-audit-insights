
import { supabase } from '@/integrations/supabase/client';

export interface DocumentReference {
  id: string;
  fileName: string;
  category?: string;
  summary?: string;
  confidence?: number;
  textPreview?: string;
  uploadDate: string;
  relevantText?: string;
  fullContent?: string;
}

export const searchClientDocuments = async (
  clientId: string, 
  query: string
): Promise<DocumentReference[]> => {
  try {
    console.log('🔍 Searching client documents for:', { clientId, query });

    const { data, error } = await supabase
      .from('client_documents_files')
      .select('id, file_name, category, ai_analysis_summary, extracted_text, ai_confidence_score, created_at')
      .eq('client_id', clientId)
      .or(`extracted_text.ilike.%${query}%,ai_analysis_summary.ilike.%${query}%,file_name.ilike.%${query}%`)
      .limit(10);

    if (error) {
      console.error('❌ Error searching documents:', error);
      return [];
    }

    return (data || []).map(doc => ({
      id: doc.id,
      fileName: doc.file_name,
      category: doc.category,
      summary: doc.ai_analysis_summary,
      confidence: doc.ai_confidence_score,
      textPreview: doc.extracted_text ? doc.extracted_text.substring(0, 200) + '...' : undefined,
      uploadDate: doc.created_at,
      relevantText: extractRelevantText(doc.extracted_text, query),
      fullContent: doc.extracted_text
    }));

  } catch (error) {
    console.error('💥 Failed to search client documents:', error);
    return [];
  }
};

export const findDocumentByReference = async (
  clientId: string,
  reference: string
): Promise<DocumentReference | null> => {
  try {
    console.log('🔍 Finding document by reference:', { clientId, reference });
    
    // Extract potential document identifiers from reference
    const referencePatterns = extractDocumentIdentifiers(reference);
    
    const { data, error } = await supabase
      .from('client_documents_files')
      .select('id, file_name, category, ai_analysis_summary, extracted_text, ai_confidence_score, created_at')
      .eq('client_id', clientId);

    if (error) {
      console.error('❌ Error finding document:', error);
      return null;
    }

    // Find best matching document
    const bestMatch = findBestDocumentMatch(data || [], referencePatterns);
    
    if (bestMatch) {
      return {
        id: bestMatch.id,
        fileName: bestMatch.file_name,
        category: bestMatch.category,
        summary: bestMatch.ai_analysis_summary,
        confidence: bestMatch.ai_confidence_score,
        textPreview: bestMatch.extracted_text ? bestMatch.extracted_text.substring(0, 500) + '...' : undefined,
        uploadDate: bestMatch.created_at,
        fullContent: bestMatch.extracted_text
      };
    }

    return null;
  } catch (error) {
    console.error('💥 Failed to find document by reference:', error);
    return null;
  }
};

export const getDocumentById = async (documentId: string): Promise<DocumentReference | null> => {
  try {
    const { data, error } = await supabase
      .from('client_documents_files')
      .select('id, file_name, category, ai_analysis_summary, extracted_text, ai_confidence_score, created_at')
      .eq('id', documentId)
      .single();

    if (error || !data) {
      console.error('❌ Error fetching document:', error);
      return null;
    }

    return {
      id: data.id,
      fileName: data.file_name,
      category: data.category,
      summary: data.ai_analysis_summary,
      confidence: data.ai_confidence_score,
      textPreview: data.extracted_text ? data.extracted_text.substring(0, 500) + '...' : undefined,
      uploadDate: data.created_at,
      fullContent: data.extracted_text
    };

  } catch (error) {
    console.error('💥 Failed to fetch document:', error);
    return null;
  }
};

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
    term.length > 2 && !['på', 'i', 'av', 'til', 'fra', 'med', 'for', 'som', 'hva', 'står'].includes(term)
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
    
    for (const identifier of identifiers) {
      if (searchText.includes(identifier.toLowerCase())) {
        // Boost score for exact filename matches
        if (doc.file_name.toLowerCase().includes(identifier.toLowerCase())) {
          score += 10;
        }
        // Medium score for summary matches
        else if (doc.ai_analysis_summary?.toLowerCase().includes(identifier.toLowerCase())) {
          score += 5;
        }
        // Lower score for content matches
        else {
          score += 1;
        }
      }
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = doc;
    }
  }
  
  return bestScore > 0 ? bestMatch : null;
}

export const analyzeDocumentRelevance = (
  document: any,
  userMessage: string
): { isRelevant: boolean; relevanceScore: number; reason: string } => {
  const messageLower = userMessage.toLowerCase();
  const fileName = document.file_name?.toLowerCase() || '';
  const summary = document.ai_analysis_summary?.toLowerCase() || '';
  const extractedText = document.extracted_text?.toLowerCase() || '';

  let relevanceScore = 0;
  const reasons = [];

  // Check filename relevance
  if (fileName.includes(messageLower.substring(0, 5))) {
    relevanceScore += 0.3;
    reasons.push('filnavn matcher');
  }

  // Check summary relevance
  const messageWords = messageLower.split(' ').filter(word => word.length > 3);
  for (const word of messageWords) {
    if (summary.includes(word)) {
      relevanceScore += 0.2;
      reasons.push(`innhold matcher "${word}"`);
    }
    if (extractedText.includes(word)) {
      relevanceScore += 0.1;
      reasons.push(`tekst matcher "${word}"`);
    }
  }

  // Boost for high AI confidence
  if (document.ai_confidence_score > 0.8) {
    relevanceScore += 0.1;
    reasons.push('høy AI-sikkerhet');
  }

  return {
    isRelevant: relevanceScore > 0.3,
    relevanceScore,
    reason: reasons.join(', ')
  };
};

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
