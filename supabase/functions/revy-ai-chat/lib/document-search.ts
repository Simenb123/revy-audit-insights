
export interface DocumentSearchResult {
  specificDocument?: {
    id: string;
    fileName: string;
    category?: string;
    summary?: string;
    confidence: number;
    uploadDate: string;
    extractedText?: string;
  };
  generalDocuments?: Array<{
    id: string;
    fileName: string;
    category?: string;
    summary?: string;
    confidence: number;
    relevantText?: string;
    uploadDate: string;
  }>;
}

export async function searchClientDocuments(
  message: string,
  clientData: any,
  supabase: any
): Promise<DocumentSearchResult | null> {
  if (!clientData?.id) {
    console.log('🔍 No client data available for document search');
    return null;
  }

  console.log('📄 [DOCUMENT_SEARCH] Starting search for client:', clientData.id);
  console.log('📄 [DOCUMENT_SEARCH] Search query:', message.substring(0, 100) + '...');

  try {
    // Fetch all documents for the client with better filtering
    const { data: documents, error } = await supabase
      .from('client_documents_files')
      .select('id, file_name, category, ai_analysis_summary, extracted_text, created_at')
      .eq('client_id', clientData.id)
      .eq('text_extraction_status', 'completed')
      .not('extracted_text', 'is', null)
      .not('extracted_text', 'like', '[Kunne ikke ekstraktere%')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ [DOCUMENT_SEARCH] Error fetching documents:', error);
      return null;
    }

    if (!documents || documents.length === 0) {
      console.log('📄 [DOCUMENT_SEARCH] No documents with valid extracted text found');
      return null;
    }

    console.log(`📄 [DOCUMENT_SEARCH] Found ${documents.length} documents with extracted text to search`);

    // Enhanced keyword matching and content analysis
    const messageWords = message.toLowerCase().split(/\s+/);
    const searchTerms = messageWords.filter(word => word.length > 2);
    
    console.log('🔍 [DOCUMENT_SEARCH] Search terms:', searchTerms);

    const scoredDocuments = documents.map(doc => {
      const text = (doc.extracted_text || '').toLowerCase();
      const fileName = (doc.file_name || '').toLowerCase();
      const category = (doc.category || '').toLowerCase();
      const summary = (doc.ai_analysis_summary || '').toLowerCase();

      let score = 0;
      let relevantText = '';
      let matchedTerms = [];

      // Score based on keyword matches with improved weighting
      for (const term of searchTerms) {
        let termScore = 0;
        
        // File name matches (highest weight)
        const fileNameMatches = (fileName.match(new RegExp(term, 'g')) || []).length;
        if (fileNameMatches > 0) {
          termScore += fileNameMatches * 15;
          matchedTerms.push(`filename:${term}`);
        }
        
        // Category matches (high weight)
        const categoryMatches = (category.match(new RegExp(term, 'g')) || []).length;
        if (categoryMatches > 0) {
          termScore += categoryMatches * 10;
          matchedTerms.push(`category:${term}`);
        }
        
        // Summary matches (medium-high weight)
        const summaryMatches = (summary.match(new RegExp(term, 'g')) || []).length;
        if (summaryMatches > 0) {
          termScore += summaryMatches * 8;
          matchedTerms.push(`summary:${term}`);
        }
        
        // Text content matches (lower weight but important for content)
        const textMatches = (text.match(new RegExp(term, 'g')) || []).length;
        if (textMatches > 0) {
          termScore += Math.min(textMatches * 2, 20); // Cap to prevent spam
          matchedTerms.push(`content:${term}(${textMatches})`);
        }

        score += termScore;

        // Extract relevant text snippets with better context
        if (textMatches > 0) {
          const sentences = text.split(/[.!?]+/);
          for (const sentence of sentences) {
            if (sentence.includes(term) && sentence.trim().length > 20 && sentence.trim().length < 200) {
              const cleanSentence = sentence.trim().replace(/\s+/g, ' ');
              if (!relevantText.includes(cleanSentence.substring(0, 50))) {
                relevantText += cleanSentence + '. ';
                if (relevantText.length > 600) break;
              }
            }
          }
        }
      }

      // Bonus for documents with multiple term matches
      const uniqueMatchedTerms = [...new Set(matchedTerms.map(t => t.split(':')[1].split('(')[0]))];
      if (uniqueMatchedTerms.length > 1) {
        score += uniqueMatchedTerms.length * 5;
      }

      console.log(`📄 [DOCUMENT_SEARCH] Document "${doc.file_name}": score=${score}, matches=[${matchedTerms.join(', ')}]`);

      return {
        ...doc,
        score,
        relevantText: relevantText.substring(0, 800),
        matchedTerms
      };
    }).filter(doc => doc.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scoredDocuments.length === 0) {
      console.log('📄 [DOCUMENT_SEARCH] No relevant documents found based on search terms');
      return null;
    }

    console.log(`📄 [DOCUMENT_SEARCH] Found ${scoredDocuments.length} relevant documents`);
    console.log('🏆 [DOCUMENT_SEARCH] Top 3 matches:', scoredDocuments.slice(0, 3).map(d => ({
      name: d.file_name,
      score: d.score,
      matches: d.matchedTerms
    })));

    const result: DocumentSearchResult = {};

    // Best match as specific document (require higher threshold)
    if (scoredDocuments.length > 0 && scoredDocuments[0].score >= 8) {
      const top = scoredDocuments[0];
      result.specificDocument = {
        id: top.id,
        fileName: top.file_name,
        category: top.category,
        summary: top.ai_analysis_summary,
        confidence: Math.min(top.score / 30, 1), // Better normalized confidence
        uploadDate: top.created_at,
        extractedText: top.extracted_text?.substring(0, 3000) // More context for AI
      };
      
      console.log('🎯 [DOCUMENT_SEARCH] Specific document found:', {
        fileName: top.file_name,
        confidence: result.specificDocument.confidence,
        textLength: top.extracted_text?.length || 0
      });
    }

    // Additional relevant documents
    if (scoredDocuments.length > 1) {
      result.generalDocuments = scoredDocuments.slice(1, 4).map(doc => ({
        id: doc.id,
        fileName: doc.file_name,
        category: doc.category,
        summary: doc.ai_analysis_summary,
        confidence: Math.min(doc.score / 30, 1),
        relevantText: doc.relevantText,
        uploadDate: doc.created_at
      }));
      
      console.log('📚 [DOCUMENT_SEARCH] Additional documents:', result.generalDocuments.length);
    }

    console.log('✅ [DOCUMENT_SEARCH] Search completed successfully');
    return result;

  } catch (error) {
    console.error('❌ [DOCUMENT_SEARCH] Search error:', error);
    return null;
  }
}
