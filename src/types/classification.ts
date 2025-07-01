
export interface Tag {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  category?: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_category_id?: string;
  display_order: number;
  icon?: string;
  applicable_phases?: string[];
  created_at: string;
  updated_at: string;
  children?: Category[];
}

export interface DocumentType {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  file_pattern_hints?: string[];
  is_standard: boolean;
  sort_order: number;
  validation_rules?: Record<string, any>;
  expected_structure?: Record<string, any>;
  created_at: string;
  updated_at: string;
}
