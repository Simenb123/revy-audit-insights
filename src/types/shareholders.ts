export interface ShareCompany {
  id: string
  orgnr: string
  name: string
  total_shares: number
  year: number
  user_id: string
  created_at: string
  share_classes?: Record<string, number>
  calculated_total?: number
}

export interface ShareEntity {
  id: string
  entity_type: 'person' | 'company'
  name: string
  country_code?: string
  birth_year?: number
  orgnr?: string
  user_id: string
  created_at: string
}

export interface ShareHolding {
  id: string
  company_orgnr: string
  holder_id: string
  share_class: string
  shares: number
  year: number
  user_id: string
  created_at: string
  share_entities?: ShareEntity
}

export interface ShareholderSearchResult {
  companies: (ShareCompany & { 
    share_classes: Record<string, number>
    calculated_total: number 
  })[]
  entities: ShareEntity[]
}

export interface GraphNode {
  id: string
  type: 'company' | 'person'
  label: string
  orgnr?: string
  data: {
    name: string
    orgnr?: string
    entity_type?: string
    country_code?: string
    birth_year?: number
    total_shares?: number
  }
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  label: string
  data: {
    shares: number
    share_class: string
    percentage: number
  }
}

export interface OwnershipGraph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface ImportRequest {
  storagePath: string
  year: number
  delimiter?: ';' | ','
  encoding?: 'AUTO' | 'UTF-8' | 'CP1252'
  mode?: 'full' | 'clients-only'
}

export interface ImportResult {
  success: boolean
  processedRows: number
  skippedRows: number
  errorRows: number
  totalRows: number
}