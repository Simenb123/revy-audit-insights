import { supabase } from '@/integrations/supabase/client'
import type { 
  ImportRequest, 
  ImportResult, 
  ShareholderSearchResult, 
  OwnershipGraph,
  ShareHolding,
  ShareEntity 
} from '@/types/shareholders'

/**
 * Starter en ny aksjonær import session
 */
export async function startImportSession(year: number): Promise<{ session_id: string; user_id: string; year: number }> {
  const { data, error } = await supabase.functions.invoke('shareholders-import-start', {
    body: { year }
  })
  
  if (error) {
    console.error('Start import session error:', error)
    
    // Parse error details if available
    let errorMessage = error.message
    if (error.details?.error_type) {
      switch (error.details.error_type) {
        case 'AUTH_ERROR':
          errorMessage = 'Autentisering feilet. Vennligst logg inn på nytt.'
          break
        case 'PERMISSION_DENIED':
          errorMessage = 'Du har ikke tilgang til å starte en import session.'
          break
        default:
          errorMessage = error.details.error || error.message
      }
    }
    
    throw new Error(`Kunne ikke starte import session: ${errorMessage}`)
  }
  
  return data
}

/**
 * Prosesserer en batch med aksjonærdata
 */
export async function ingestBatch(
  sessionId: string, 
  year: number, 
  rows: any[], 
  isGlobal = false
): Promise<{ companies: number; entities: number; holdings: number; duration_ms: number }> {
  const { data, error } = await supabase.functions.invoke('shareholders-ingest-batch', {
    body: { session_id: sessionId, year, rows, isGlobal }
  })
  
  if (error) {
    console.error('Batch processing error:', error)
    
    // Parse error details if available
    let errorMessage = error.message
    if (error.details?.error_type) {
      switch (error.details.error_type) {
        case 'DUPLICATE_DATA':
          errorMessage = 'Noen av dataene eksisterer allerede i systemet. Dette kan skje ved gjentatt import av samme data.'
          break
        case 'PERMISSION_DENIED':
          errorMessage = 'Du har ikke tilgang til å importere disse dataene.'
          break
        case 'AUTH_ERROR':
          errorMessage = 'Autentisering feilet. Vennligst logg inn på nytt.'
          break
        default:
          errorMessage = error.details.error || error.message
      }
    }
    
    throw new Error(`Batch prosessering feilet: ${errorMessage}`)
  }
  
  return data
}

/**
 * Avslutter en import session og oppdaterer totaler
 */
export async function finishImport(
  sessionId: string, 
  year: number, 
  isGlobal = false
): Promise<{ success: boolean; summary: any }> {
  const { data, error } = await supabase.functions.invoke('shareholders-import-finish', {
    body: { session_id: sessionId, year, isGlobal }
  })
  
  if (error) {
    console.error('Finish import error:', error)
    
    // Parse error details if available
    let errorMessage = error.message
    if (error.details?.error_type) {
      switch (error.details.error_type) {
        case 'AUTH_ERROR':
          errorMessage = 'Autentisering feilet. Vennligst logg inn på nytt.'
          break
        case 'PERMISSION_DENIED':
          errorMessage = 'Du har ikke tilgang til å fullføre importen.'
          break
        default:
          errorMessage = error.details.error || error.message
      }
    }
    
    throw new Error(`Kunne ikke fullføre import: ${errorMessage}`)
  }
  
  return data
}

/**
 * Avslutter import i batches for store datasett
 */
export async function finishImportBatch(
  sessionId: string, 
  year: number, 
  isGlobal = false,
  batchSize = 1000,
  offset = 0
): Promise<{ success: boolean; batch_result: any; summary?: any; completed: boolean }> {
  const { data, error } = await supabase.functions.invoke('shareholders-import-finish-batch', {
    body: { session_id: sessionId, year, isGlobal, batch_size: batchSize, offset }
  })
  
  if (error) {
    console.error('Batch finish import error:', error)
    throw new Error(`Kunne ikke fullføre batch import: ${error.message}`)
  }
  
  return data
}

/**
 * Sjekker status på en import session for recovery
 */
export async function checkImportRecovery(
  sessionId: string,
  year: number,
  isGlobal = false
): Promise<{ success: boolean; status: any; can_recover: boolean; needs_aggregation: boolean }> {
  const { data, error } = await supabase.functions.invoke('shareholders-import-recover', {
    body: { session_id: sessionId, year, isGlobal }
  })
  
  if (error) {
    console.error('Recovery check error:', error)
    throw new Error(`Kunne ikke sjekke recovery status: ${error.message}`)
  }
  
  return data
}

/**
 * Legacy function - kept for compatibility
 */
export async function importShareholders(formData: FormData): Promise<ImportResult> {
  const { data, error } = await supabase.functions.invoke('shareholders-import', {
    body: formData
  })
  
  if (error) {
    throw new Error(`Import failed: ${error.message}`)
  }
  
  return data
}

/**
 * Søker i aksjonærregisteret
 */
export async function searchShareholders(query: string): Promise<ShareholderSearchResult> {
  if (!query || query.length < 2) {
    return { companies: [], entities: [] }
  }

  // Kall edge function med query parameter
  const { data, error } = await supabase.functions.invoke('shareholders-search', {
    body: { q: query }
  })
  
  if (error) {
    throw new Error(`Search failed: ${error.message}`)
  }
  
  return data || { companies: [], entities: [] }
}

/**
 * Henter eierstruktur-graf for et selskap
 */
export async function fetchOwnershipGraph(params: {
  orgnr: string
  year?: number
  direction?: 'up' | 'down' | 'both'
  depth?: number
}): Promise<OwnershipGraph> {
  // Kall edge function med parametere i body
  const { data, error } = await supabase.functions.invoke('ownership-graph', {
    body: {
      orgnr: params.orgnr,
      year: params.year || 2024,
      direction: params.direction || 'both',
      depth: params.depth || 3
    }
  })
  
  if (error) {
    throw new Error(`Failed to fetch ownership graph: ${error.message}`)
  }
  
  return data || { nodes: [], edges: [] }
}

/**
 * Henter aksjonærer for et spesifikt selskap (for drilldown/pivot)
 */
export async function getCompanyShareholders(
  orgnr: string, 
  year: number
): Promise<Array<ShareHolding & { share_entities: ShareEntity }>> {
  // First, get the share holdings
  const { data: holdings, error: holdingsError } = await supabase
    .from('share_holdings')
    .select('*')
    .eq('company_orgnr', orgnr)
    .eq('year', year)
    .order('shares', { ascending: false })
  
  if (holdingsError) {
    throw new Error(`Failed to fetch shareholders: ${holdingsError.message}`)
  }
  
  if (!holdings || holdings.length === 0) {
    return []
  }
  
  // Get unique holder IDs
  const holderIds = [...new Set(holdings.map(h => h.holder_id))]
  
  // Get the corresponding entities
  const { data: entities, error: entitiesError } = await supabase
    .from('share_entities')
    .select('*')
    .in('id', holderIds)
  
  if (entitiesError) {
    throw new Error(`Failed to fetch entities: ${entitiesError.message}`)
  }
  
  // Create a map for quick lookup
  const entitiesMap = new Map(
    (entities || []).map(entity => [entity.id, entity])
  )
  
  // Join the data manually
  const result = holdings.map(holding => ({
    ...holding,
    share_entities: entitiesMap.get(holding.holder_id) || {
      id: holding.holder_id,
      name: 'Unknown Entity',
      entity_type: 'unknown',
      orgnr: null,
      birth_year: null,
      country_code: null,
      user_id: null,
      created_at: null,
      entity_key: null
    }
  }))
  
  return result as Array<ShareHolding & { share_entities: ShareEntity }>
}

/**
 * Laster opp fil til storage bucket
 */
export async function uploadFileToStorage(file: File, fileName: string, isGlobal = false): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const uploadPath = isGlobal ? `global/raw/${fileName}` : `${user.id}/raw/${fileName}`;

  const { data, error } = await supabase.storage
    .from('shareholders')
    .upload(uploadPath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  return data.path;
}

/**
 * Eksporterer aksjonærliste til CSV
 */
export function exportShareholdersToCSV(
  shareholders: Array<ShareHolding & { share_entities: ShareEntity }>,
  companyName: string
): void {
  const headers = [
    'Navn',
    'Org/Født',
    'Type', 
    'Land',
    'Aksjeklasse',
    'Aksjer',
    'Andel %'
  ]
  
  const csvContent = [
    headers.join(';'),
    ...shareholders.map(holding => [
      holding.share_entities.name,
      holding.share_entities.orgnr || holding.share_entities.birth_year?.toString() || '',
      holding.share_entities.entity_type === 'company' ? 'Selskap' : 'Person',
      holding.share_entities.country_code || 'NO',
      holding.share_class,
      holding.shares.toString(),
      '' // Andel % beregnes i frontend
    ].join(';'))
  ].join('\n')
  
  // Last ned fil
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', `aksjonaerer_${companyName}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}