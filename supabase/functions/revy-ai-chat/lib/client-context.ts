
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
        client_audit_actions(
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

    // Search in document text and summaries
    const { data: documents, error } = await supabase
      .from('client_documents_files')
      .select('id, file_name, category, ai_analysis_summary, extracted_text, ai_confidence_score')
      .eq('client_id', clientId)
      .or(`extracted_text.ilike.%${query}%,ai_analysis_summary.ilike.%${query}%,file_name.ilike.%${query}%`)
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
      fullContent: doc.extracted_text // Include full content for detailed analysis
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

    // Find best matching document
    const bestMatch = findBestDocumentMatch(documents || [], identifiers);
    
    if (bestMatch) {
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

    return null;
  } catch (error) {
    console.error('Failed to find document by reference:', error);
    return null;
  }
}

function extractDocumentIdentifiers(reference: string): string[] {
  const identifiers = [];
  
  // Extract numbers (like invoice numbers)
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

function extractRelevantText(text: string, query: string): string {
  if (!text || !query) return '';
  
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const index = textLower.indexOf(queryLower);
  
  if (index === -1) return text.substring(0, 200) + '...';
  
  const start = Math.max(0, index - 100);
  const end = Math.min(text.length, index + query.length + 100);
  
  return '...' + text.substring(start, end) + '...';
}
