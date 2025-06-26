import type { AuditPhase } from './revio';

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent_category_id?: string;
  display_order: number;
  icon?: string;
  created_at: string;
  updated_at: string;
  children?: Category[];
  applicable_phases?: AuditPhase[];
}

export interface ContentType {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubjectArea {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  icon?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  parent_subject_area_id?: string;
  created_at: string;
  updated_at: string;
  children?: SubjectArea[];
  parent?: Partial<SubjectArea>;
}

export interface Tag {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  color: string;
  category?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentType {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  file_pattern_hints: string[];
  expected_structure: any;
  validation_rules?: any;
  is_standard: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
