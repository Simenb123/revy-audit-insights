
export async function fetchEnhancedClientContext(clientId: string) {
  console.log('🔍 Fetching enhanced client context for:', clientId);
  
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.49.4');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch client with detailed context including documents
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select(`
        *,
        risk_areas(*),
        client_audit_actions!client_audit_actions_client_id_fkey(
          name,
          description,
          status,
          phase,
          subject_area,
          risk_level,
          due_date,
          assigned_to,
          findings,
          conclusion
        ),
        client_documents_files(
          id,
          file_name,
          category,
          subject_area,
          ai_suggested_category,
          ai_analysis_summary,
          ai_confidence_score,
          extracted_text,
          created_at,
          file_size,
          mime_type
        ),
        trial_balances(
          period_end_date,
          closing_balance,
          client_account_id
        )
      `)
      .eq('id', clientId)
      .single();

    if (clientError) {
      console.error('Error fetching client context:', clientError);
      return null;
    }

    // Process and enrich document data
    const processedDocuments = (client.client_documents_files || []).map((doc: any) => {
      const textPreview = doc.extracted_text 
        ? doc.extracted_text.substring(0, 500) + '...'
        : null;

      return {
        id: doc.id,
        fileName: doc.file_name,
        category: doc.category || doc.ai_suggested_category,
        subjectArea: doc.subject_area,
        summary: doc.ai_analysis_summary,
        confidence: doc.ai_confidence_score,
        textPreview,
        fullContent: doc.extracted_text, // Include full content for AI analysis
        hasText: !!doc.extracted_text,
        size: doc.file_size,
        type: doc.mime_type,
        uploadDate: doc.created_at
      };
    });

    // Build document insights
    const documentInsights = {
      totalDocuments: processedDocuments.length,
      categorized: processedDocuments.filter(d => d.category).length,
      withText: processedDocuments.filter(d => d.hasText).length,
      categories: [...new Set(processedDocuments.map(d => d.category).filter(Boolean))],
      subjectAreas: [...new Set(processedDocuments.map(d => d.subjectArea).filter(Boolean))],
      recentUploads: processedDocuments
        .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
        .slice(0, 5),
      highConfidenceAnalysis: processedDocuments.filter(d => (d.confidence || 0) > 0.8)
    };

    console.log('✅ Enhanced client context built:', {
      clientName: client.company_name,
      documentsProcessed: processedDocuments.length,
      withText: documentInsights.withText,
      categories: documentInsights.categories.length
    });

    return {
      client: {
        ...client,
        client_documents_files: undefined // Remove raw data
      },
      documents: processedDocuments,
      documentInsights,
      auditActions: client.client_audit_actions || [],
      riskAreas: client.risk_areas || [],
      trialBalances: client.trial_balances || []
    };

  } catch (error) {
    console.error('Failed to fetch enhanced client context:', error);
    return null;
  }
}

export async function searchDocumentContent(clientId: string, query: string) {
  console.log('🔍 Searching document content for client:', clientId, 'query:', query);
  
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.49.4');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Search in document text and summaries with intelligent pattern matching
    const searchTerms = extractSearchTerms(query);
    let searchPattern = '';
    
    // Build search pattern for multiple terms
    if (searchTerms.length > 0) {
      const patterns = searchTerms.map(term => 
        `extracted_text.ilike.%${term}%,ai_analysis_summary.ilike.%${term}%,file_name.ilike.%${term}%`
      );
      searchPattern = patterns.join(',');
    } else {
      searchPattern = `extracted_text.ilike.%${query}%,ai_analysis_summary.ilike.%${query}%,file_name.ilike.%${query}%`;
    }

    const { data: documents, error } = await supabase
      .from('client_documents_files')
      .select('id, file_name, category, ai_analysis_summary, extracted_text, ai_confidence_score, created_at')
      .eq('client_id', clientId)
      .or(searchPattern)
      .limit(10);

    if (error) {
      console.error('Error searching documents:', error);
      return [];
    }

    return (documents || []).map(doc => ({
      id: doc.id,
      fileName: doc.file_name,
      category: doc.category,
      summary: doc.ai_analysis_summary,
      confidence: doc.ai_confidence_score,
      relevantText: doc.extracted_text 
        ? extractRelevantText(doc.extracted_text, query)
        : null,
      fullContent: doc.extracted_text, // Include full content for detailed analysis
      uploadDate: doc.created_at
    }));

  } catch (error) {
    console.error('Failed to search document content:', error);
    return [];
  }
}

export async function findDocumentByReference(clientId: string, reference: string) {
  console.log('🔍 Finding document by reference in edge function:', clientId, reference);
  
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.49.4');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Extract potential identifiers from reference
    const identifiers = extractDocumentIdentifiers(reference);
    
    // Get all documents for this client
    const { data: documents, error } = await supabase
      .from('client_documents_files')
      .select('id, file_name, category, ai_analysis_summary, extracted_text, ai_confidence_score, created_at')
      .eq('client_id', clientId);

    if (error) {
      console.error('Error fetching documents:', error);
      return null;
    }

    // Find best matching document using enhanced scoring
    const bestMatch = findBestDocumentMatch(documents || [], identifiers, reference);
    
    if (bestMatch) {
      console.log('✅ Found specific document match:', bestMatch.file_name);
      return {
        id: bestMatch.id,
        fileName: bestMatch.file_name,
        category: bestMatch.category,
        summary: bestMatch.ai_analysis_summary,
        confidence: bestMatch.ai_confidence_score,
        fullContent: bestMatch.extracted_text,
        uploadDate: bestMatch.created_at
      };
    }

    console.log('❌ No specific document found for reference:', reference);
    return null;
  } catch (error) {
    console.error('Failed to find document by reference:', error);
    return null;
  }
}

// Helper functions
function extractSearchTerms(query: string): string[] {
  // Extract meaningful search terms from the query
  const words = query.toLowerCase().split(/\s+/);
  return words.filter(word => 
    word.length > 2 && 
    !['hva', 'står', 'på', 'i', 'av', 'til', 'fra', 'med', 'for', 'som', 'det', 'er', 'den', 'kan', 'jeg', 'du'].includes(word)
  );
}

function extractDocumentIdentifiers(reference: string): string[] {
  const identifiers = [];
  
  // Extract numbers (like invoice numbers, document numbers)
  const numbers = reference.match(/\d+/g);
  if (numbers) {
    identifiers.push(...numbers);
  }
  
  // Extract key terms
  const terms = reference.toLowerCase().split(/\s+/).filter(term => 
    term.length > 2 && !['på', 'i', 'av', 'til', 'fra', 'med', 'for', 'som', 'hva', 'står', 'det', 'er', 'den'].includes(term)
  );
  identifiers.push(...terms);
  
  return identifiers;
}

function findBestDocumentMatch(documents: any[], identifiers: string[], originalQuery: string): any | null {
  let bestMatch = null;
  let bestScore = 0;
  
  for (const doc of documents) {
    let score = 0;
    const fileName = doc.file_name?.toLowerCase() || '';
    const summary = doc.ai_analysis_summary?.toLowerCase() || '';
    const extractedText = doc.extracted_text?.toLowerCase() || '';
    
    // Score for identifier matches
    for (const identifier of identifiers) {
      const id = identifier.toLowerCase();
      
      // High score for exact filename matches
      if (fileName.includes(id)) {
        score += 15;
      }
      // Medium score for summary matches
      if (summary.includes(id)) {
        score += 8;
      }
      // Lower score for content matches
      if (extractedText.includes(id)) {
        score += 3;
      }
    }
    
    // Bonus for document types mentioned in query
    if (originalQuery.toLowerCase().includes('faktura') && fileName.includes('faktura')) {
      score += 10;
    }
    if (originalQuery.toLowerCase().includes('rapport') && fileName.includes('rapport')) {
      score += 10;
    }
    
    // Boost for documents with extracted text
    if (extractedText.length > 0) {
      score += 2;
    }
    
    console.log(`📊 Document ${fileName} scored: ${score}`);
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = doc;
    }
  }
  
  console.log(`🎯 Best match: ${bestMatch?.file_name} with score: ${bestScore}`);
  return bestScore > 5 ? bestMatch : null; // Minimum threshold for matches
}

function extractRelevantText(text: string, query: string): string {
  if (!text || !query) return '';
  
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Try to find the query terms in the text
  const searchTerms = extractSearchTerms(query);
  let bestIndex = -1;
  let bestTerm = '';
  
  for (const term of searchTerms) {
    const index = textLower.indexOf(term.toLowerCase());
    if (index !== -1) {
      bestIndex = index;
      bestTerm = term;
      break;
    }
  }
  
  if (bestIndex === -1) {
    // If no specific terms found, return beginning of text
    return text.substring(0, 200) + '...';
  }
  
  // Extract context around the found term
  const start = Math.max(0, bestIndex - 100);
  const end = Math.min(text.length, bestIndex + bestTerm.length + 100);
  
  let result = text.substring(start, end);
  if (start > 0) result = '...' + result;
  if (end < text.length) result = result + '...';
  
  return result;
}
