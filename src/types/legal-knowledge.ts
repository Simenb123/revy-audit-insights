// Legal Knowledge Structure Types

export interface LegalDocumentType {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  hierarchy_level: number; // 1=primary (laws), 2=secondary (regulations), 3=tertiary (articles)
  authority_weight: number; // For AI ranking (laws=1.0, regulations=0.8, articles=0.5)
  color: string;
  icon?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LegalProvision {
  id: string;
  provision_type: string;
  provision_number: string; // e.g., "3", "3-1", "3-1-a"
  title: string;
  content?: string;
  parent_provision_id?: string;
  law_identifier: string; // e.g., "regnskapsloven", "revisorloven"
  law_full_name?: string; // e.g., "Lov om årsregnskap m.v."
  anchor?: string; // Unique anchor for cross-references
  valid_from?: string;
  valid_until?: string;
  hierarchy_path?: string; // e.g., "regnskapsloven.kap1.§3.ledd1"
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  parent_provision?: LegalProvision;
  child_provisions?: LegalProvision[];
}

export interface LegalDocument {
  id: string;
  title: string;
  document_type_id: string;
  document_number?: string; // e.g., "LOV-1998-07-17-56"
  content: string;
  summary?: string;
  publication_date?: string;
  effective_date?: string;
  expiry_date?: string;
  issuing_authority?: string; // e.g., "Stortinget", "Regjeringen", "Høyesterett"
  source_url?: string;
  document_status: string;
  is_primary_source: boolean;
  embedding?: any;
  created_at: string;
  updated_at: string;
  document_type?: LegalDocumentType;
  related_provisions?: LegalProvision[];
  related_documents?: LegalDocument[];
}

export interface ProvisionDocumentRelation {
  id: string;
  provision_id: string;
  document_id: string;
  relation_type: string;
  relevance_score: number;
  context_description?: string;
  created_at: string;
  provision?: LegalProvision;
  document?: LegalDocument;
}

export interface DocumentCrossReference {
  id: string;
  source_document_id: string;
  target_document_id: string;
  reference_type: string;
  reference_text?: string; // Original reference text found in document
  confidence_score: number;
  created_at: string;
  source_document?: LegalDocument;
  target_document?: LegalDocument;
}

export interface LegalCitation {
  id: string;
  document_id: string;
  provision_id?: string;
  citation_text: string; // e.g., "regnskapsloven § 3-1"
  citation_context?: string; // Surrounding text for context
  position_start?: number; // Character position in document
  position_end?: number;
  is_verified: boolean;
  created_at: string;
  document?: LegalDocument;
  provision?: LegalProvision;
}

export interface LegalSubjectAreaMapping {
  id: string;
  provision_id?: string;
  document_id?: string;
  subject_area_id: string;
  relevance_level: 'primary' | 'secondary' | 'tangential';
  confidence_score: number;
  created_at: string;
  provision?: LegalProvision;
  document?: LegalDocument;
  subject_area?: any; // Reference to existing SubjectArea type
}

// Search and AI context types
export interface LegalSearchContext {
  query: string;
  provision_references?: string[];
  document_types?: string[];
  hierarchy_filters?: {
    law_identifier?: string;
    provision_type?: string;
    hierarchy_level?: number;
  };
  date_filters?: {
    from?: string;
    to?: string;
  };
  authority_threshold?: number; // Minimum authority weight
}

export interface LegalSearchResult {
  documents: LegalDocument[];
  provisions: LegalProvision[];
  citations: LegalCitation[];
  authority_ranking: {
    document_id: string;
    authority_score: number;
    relevance_score: number;
    combined_score: number;
  }[];
  search_metadata: {
    total_results: number;
    search_time_ms: number;
    query_type: 'structured' | 'semantic' | 'hybrid';
  };
}

// AI Context enhancement
export interface LegalAIContext {
  primary_sources: LegalDocument[]; // Laws and regulations
  secondary_sources: LegalDocument[]; // Court decisions, preparatory works
  tertiary_sources: LegalDocument[]; // Articles and commentaries
  relevant_provisions: LegalProvision[];
  cross_references: DocumentCrossReference[];
  source_hierarchy: string[]; // Ordered by authority weight
  legal_context_summary: string;
}

// Migration and data processing types
export interface LegalDocumentImport {
  title: string;
  content: string;
  document_type: string;
  metadata: {
    source?: string;
    document_number?: string;
    publication_date?: string;
    issuing_authority?: string;
  };
  provisions?: {
    provision_type: string;
    provision_number: string;
    title: string;
    content?: string;
  }[];
  citations?: {
    citation_text: string;
    target_provision?: string;
  }[];
}

export interface LegalReferenceParser {
  pattern: RegExp;
  extract: (text: string) => LegalCitation[];
}

// Legal Cross Reference for RAG Admin
export interface LegalCrossRef {
  id: number;
  from_provision_id: number;
  to_document_number: string;
  to_anchor?: string;
  ref_type: 'clarifies' | 'enabled_by' | 'implements' | 'cites' | 'interprets' | 'applies' | 'mentions';
  ref_text?: string;
  created_at: string;
  created_by?: string;
}

// Draft relation for UI state management
export interface DraftRelation {
  fromProvision: LegalProvision;
  toProvision: LegalProvision;
  fromDocument: LegalDocument;
  toDocument: LegalDocument;
  refType: LegalCrossRef['ref_type'];
  refText?: string;
  tempId: string;
}

// Node type for graph visualization
export type DocumentNodeType = 'lov' | 'forskrift' | 'dom' | 'rundskriv' | 'forarbeid' | 'ukjent';