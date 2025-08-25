export interface ImportRequest {
  year: number
  delimiter?: ';' | ','
  encoding?: 'AUTO' | 'UTF-8' | 'CP1252'
  mode?: 'full' | 'clients-only'
  isGlobal?: boolean
}

export interface ImportResult {
  success: boolean
  processedRows: number
  skippedRows: number
  errorRows: number
  totalRows: number
}

export interface ShareholderSearchResult {
  companies: ShareCompany[]
  entities: ShareEntity[]
}

export interface OwnershipGraph {
  nodes: OwnershipNode[]
  edges: OwnershipEdge[]
}

export interface OwnershipNode {
  id: string
  label: string
  type: 'company' | 'person'
  orgnr?: string
  data?: any // For compatibility with existing components
}

export interface OwnershipEdge {
  id?: string
  from: string
  to: string
  source?: string
  target?: string
  shares: number
  percentage: number
  label?: string
  data?: any // For compatibility with existing components
}

export interface ShareCompany {
  id: string
  orgnr: string
  name: string
  year: number
  total_shares: number
  calculated_total: number
  user_id?: string
  share_classes?: Record<string, number> // For compatibility with existing components
}

export interface ShareEntity {
  id: string
  entity_type: 'company' | 'person'
  name: string
  orgnr?: string
  birth_year?: number
  country_code?: string
  user_id?: string
}

export interface ShareHolding {
  id: string
  company_orgnr: string
  holder_id: string
  share_class: string
  shares: number
  year: number
  user_id?: string
  created_at?: string // For compatibility with existing components
}