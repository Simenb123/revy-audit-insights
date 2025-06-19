
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface DocumentAnalysisRequest {
  documentId: string;
  fileContent?: string;
  fileName: string;
  mimeType: string;
}

interface AIAnalysisResult {
  documentType: {
    name: string;
    confidence: number;
  };
  detectedSystem?: string;
  extractedMetadata: {
    period_year?: number;
    period_month?: number;
    period_start?: string;
    period_end?: string;
    amount_fields?: any;
    column_mappings?: any;
  };
  suggestedTags: string[];
  qualityScore: number;
  processingNotes: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { documentId, fileName, mimeType, fileContent }: DocumentAnalysisRequest = await req.json()

    console.log(`Analyzing document: ${fileName} (${mimeType})`)

    // Fetch document types for pattern matching
    const { data: documentTypes } = await supabaseClient
      .from('document_types')
      .select('*')

    // AI Analysis Logic
    const analysisResult = await analyzeDocument(fileName, fileContent, documentTypes)

    // Store analysis results
    await supabaseClient
      .from('document_metadata')
      .upsert({
        document_id: documentId,
        document_type_id: await getDocumentTypeId(analysisResult.documentType.name, supabaseClient),
        detected_system: analysisResult.detectedSystem,
        period_year: analysisResult.extractedMetadata.period_year,
        period_month: analysisResult.extractedMetadata.period_month,
        period_start: analysisResult.extractedMetadata.period_start,
        period_end: analysisResult.extractedMetadata.period_end,
        amount_fields: analysisResult.extractedMetadata.amount_fields,
        column_mappings: analysisResult.extractedMetadata.column_mappings,
        validation_status: analysisResult.qualityScore > 0.8 ? 'validated' : 'pending',
        quality_score: analysisResult.qualityScore,
        processing_notes: analysisResult.processingNotes.join('; ')
      })

    // Auto-assign tags based on AI analysis
    for (const tagName of analysisResult.suggestedTags) {
      const { data: tag } = await supabaseClient
        .from('document_tags')
        .select('id')
        .eq('name', tagName)
        .single()

      if (tag) {
        await supabaseClient
          .from('document_tag_assignments')
          .upsert({
            document_id: documentId,
            tag_id: tag.id,
            assigned_by_ai: true,
            confidence_score: analysisResult.qualityScore
          })
      }
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in enhanced document AI:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

async function analyzeDocument(
  fileName: string, 
  fileContent: string | undefined, 
  documentTypes: any[]
): Promise<AIAnalysisResult> {
  const lowerFileName = fileName.toLowerCase()
  const processingNotes: string[] = []

  // Document Type Detection
  let bestMatch = { name: 'unknown', confidence: 0.3 }
  
  for (const docType of documentTypes) {
    let confidence = 0
    
    // Check file pattern hints
    for (const hint of docType.file_pattern_hints) {
      if (lowerFileName.includes(hint.toLowerCase())) {
        confidence += 0.3
      }
    }
    
    // Additional pattern matching
    if (docType.name === 'hovedbok' && (lowerFileName.includes('hovedbok') || lowerFileName.includes('general_ledger'))) {
      confidence += 0.4
    } else if (docType.name === 'saldobalanse' && (lowerFileName.includes('saldo') || lowerFileName.includes('trial_balance'))) {
      confidence += 0.4
    } else if (docType.name === 'lonnslipp' && (lowerFileName.includes('lonn') || lowerFileName.includes('payslip'))) {
      confidence += 0.4
    } else if (docType.name === 'faktura' && (lowerFileName.includes('faktura') || lowerFileName.includes('invoice'))) {
      confidence += 0.4
    }
    
    if (confidence > bestMatch.confidence) {
      bestMatch = { name: docType.name, confidence: Math.min(confidence, 0.95) }
    }
  }

  processingNotes.push(`Detected document type: ${bestMatch.name} with ${Math.round(bestMatch.confidence * 100)}% confidence`)

  // System Detection
  let detectedSystem: string | undefined
  if (lowerFileName.includes('visma')) {
    detectedSystem = 'visma_business'
  } else if (lowerFileName.includes('poweroffice')) {
    detectedSystem = 'poweroffice'
  } else if (lowerFileName.includes('tripletex')) {
    detectedSystem = 'tripletex'
  } else if (lowerFileName.includes('fiken')) {
    detectedSystem = 'fiken'
  }

  if (detectedSystem) {
    processingNotes.push(`Detected accounting system: ${detectedSystem}`)
  }

  // Period Extraction
  const currentYear = new Date().getFullYear()
  const yearMatch = fileName.match(/20\d{2}/)
  const monthMatch = fileName.match(/(?:jan|feb|mar|apr|mai|jun|jul|aug|sep|okt|nov|des|\d{1,2})/i)
  
  const extractedMetadata: AIAnalysisResult['extractedMetadata'] = {
    period_year: yearMatch ? parseInt(yearMatch[0]) : currentYear,
    period_month: monthMatch ? getMonthNumber(monthMatch[0]) : new Date().getMonth() + 1
  }

  // Tag Suggestions
  const suggestedTags: string[] = ['automated']
  
  if (bestMatch.confidence > 0.9) {
    suggestedTags.push('reviewed')
  } else if (bestMatch.confidence < 0.7) {
    suggestedTags.push('manual_review')
  }

  if (extractedMetadata.period_month === 12) {
    suggestedTags.push('year_end')
  }

  // Quality Score Calculation
  let qualityScore = bestMatch.confidence
  if (detectedSystem) qualityScore += 0.1
  if (extractedMetadata.period_year && extractedMetadata.period_month) qualityScore += 0.1
  qualityScore = Math.min(qualityScore, 1.0)

  return {
    documentType: bestMatch,
    detectedSystem,
    extractedMetadata,
    suggestedTags,
    qualityScore,
    processingNotes
  }
}

async function getDocumentTypeId(typeName: string, supabaseClient: any): Promise<string | null> {
  const { data } = await supabaseClient
    .from('document_types')
    .select('id')
    .eq('name', typeName)
    .single()
  
  return data?.id || null
}

function getMonthNumber(monthStr: string): number {
  const monthMap: { [key: string]: number } = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'mai': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'okt': 10, 'nov': 11, 'des': 12
  }
  
  const month = monthMap[monthStr.toLowerCase()]
  if (month) return month
  
  const numMonth = parseInt(monthStr)
  return (numMonth >= 1 && numMonth <= 12) ? numMonth : new Date().getMonth() + 1
}
