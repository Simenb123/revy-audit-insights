
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
}
