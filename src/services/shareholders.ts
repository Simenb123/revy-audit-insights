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
 * Importerer aksjonærdata fra CSV fil direkte
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
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
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
  // Kall edge function med parametere via query string
  const { data, error } = await supabase.functions.invoke('ownership-graph', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
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
  const { data, error } = await supabase
    .from('share_holdings')
    .select(`
      *,
      share_entities (*)
    `)
    .eq('company_orgnr', orgnr)
    .eq('year', year)
    .order('shares', { ascending: false })
  
  if (error) {
    throw new Error(`Failed to fetch shareholders: ${error.message}`)
  }
  
  // Type assertion siden Supabase returnerer entity_type som string
  return (data || []) as Array<ShareHolding & { share_entities: ShareEntity }>
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