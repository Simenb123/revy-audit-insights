
export interface ISAStandard {
  id: string;
  isa_number: string;
  title: string;
  description?: string;
  category?: string;
  effective_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentRequirement {
  id: string;
  name: string;
  description?: string;
  document_type: string;
  is_mandatory: boolean;
  subject_area?: string;
  audit_phases: string[];
  file_pattern_hints?: string[];
  created_at: string;
  updated_at: string;
}

export interface WorkingPaperTemplate {
  id: string;
  name: string;
  description?: string;
  template_structure: Record<string, any>;
  subject_area: string;
  action_type: string;
  is_system_template: boolean;
  created_by?: string;
  audit_firm_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditActionISAMapping {
  id: string;
  action_template_id: string;
  isa_standard_id: string;
  relevance_level: 'primary' | 'secondary' | 'reference';
  created_at: string;
  isa_standard?: ISAStandard;
}

export interface AuditActionDocumentMapping {
  id: string;
  action_template_id: string;
  document_requirement_id: string;
  is_mandatory: boolean;
  timing: 'before' | 'during' | 'after';
  created_at: string;
  document_requirement?: DocumentRequirement;
}

export interface ActionAIMetadata {
  id: string;
  action_template_id: string;
  ai_variant_id?: string;
  specialized_prompt?: string;
  common_issues: any[];
  typical_documents: any[];
  risk_indicators: any[];
  quality_checkpoints: any[];
  estimated_complexity: number;
  created_at: string;
  updated_at: string;
}

export interface EnhancedAuditActionTemplate {
  id: string;
  name: string;
  description?: string;
  subject_area: string;
  action_type: string;
  objective?: string;
  procedures: string;
  documentation_requirements?: string;
  estimated_hours?: number;
  risk_level: string;
  applicable_phases: string[];
  sort_order: number;
  is_system_template: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Enhanced relations
  isa_mappings?: AuditActionISAMapping[];
  document_mappings?: AuditActionDocumentMapping[];
  ai_metadata?: ActionAIMetadata;
  working_paper_template?: WorkingPaperTemplate;
}
