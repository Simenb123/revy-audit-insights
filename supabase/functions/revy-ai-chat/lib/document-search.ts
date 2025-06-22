
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

  console.log('📄 Searching client documents for relevant content...');

  try {
    // Fetch all documents for the client
    const { data: documents, error } = await supabase
      .from('client_documents_files')
      .select('*')
      .eq('client_id', clientData.id)
      .not('extracted_text', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching documents:', error);
      return null;
    }

    if (!documents || documents.length === 0) {
      console.log('📄 No documents with extracted text found');
      return null;
    }

    console.log(`📄 Found ${documents.length} documents to search`);

    // Simple keyword matching for now - could be enhanced with semantic search
    const messageWords = message.toLowerCase().split(/\s+/);
    const searchTerms = messageWords.filter(word => word.length > 3);

    const scoredDocuments = documents.map(doc => {
      const text = (doc.extracted_text || '').toLowerCase();
      const fileName = (doc.file_name || '').toLowerCase();
      const category = (doc.category || '').toLowerCase();
      const summary = (doc.ai_analysis_summary || '').toLowerCase();

      let score = 0;
      let relevantText = '';

      // Score based on keyword matches
      for (const term of searchTerms) {
        // File name matches (high weight)
        if (fileName.includes(term)) score += 10;
        
        // Category matches (medium weight)
        if (category.includes(term)) score += 5;
        
        // Summary matches (medium weight)
        if (summary.includes(term)) score += 3;
        
        // Text content matches (lower weight but captures context)
        const textMatches = (text.match(new RegExp(term, 'g')) || []).length;
        score += textMatches * 1;

        // Find relevant text snippets
        if (textMatches > 0) {
          const sentences = text.split(/[.!?]+/);
          for (const sentence of sentences) {
            if (sentence.includes(term) && sentence.length > 20) {
              relevantText += sentence.trim() + '. ';
              if (relevantText.length > 300) break;
            }
          }
        }
      }

      return {
        ...doc,
        score,
        relevantText: relevantText.substring(0, 500)
      };
    }).filter(doc => doc.score > 0)
      .sort((a, b) => b.score - a.score);

    if (scoredDocuments.length === 0) {
      console.log('📄 No relevant documents found');
      return null;
    }

    console.log(`📄 Found ${scoredDocuments.length} relevant documents`);

    const result: DocumentSearchResult = {};

    // Best match as specific document
    if (scoredDocuments.length > 0 && scoredDocuments[0].score >= 5) {
      const top = scoredDocuments[0];
      result.specificDocument = {
        id: top.id,
        fileName: top.file_name,
        category: top.category,
        summary: top.ai_analysis_summary,
        confidence: Math.min(top.score / 20, 1), // Normalize to 0-1
        uploadDate: top.created_at,
        extractedText: top.extracted_text?.substring(0, 2000) // Limit for context
      };
    }

    // Additional relevant documents
    if (scoredDocuments.length > 1) {
      result.generalDocuments = scoredDocuments.slice(1, 4).map(doc => ({
        id: doc.id,
        fileName: doc.file_name,
        category: doc.category,
        summary: doc.ai_analysis_summary,
        confidence: Math.min(doc.score / 20, 1),
        relevantText: doc.relevantText,
        uploadDate: doc.created_at
      }));
    }

    console.log('✅ Document search completed successfully');
    return result;

  } catch (error) {
    console.error('❌ Error in document search:', error);
    return null;
  }
}
