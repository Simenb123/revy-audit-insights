export type ArticleStatus = 'draft' | 'published' | 'archived';

export type ContentType = 'fagartikkel' | 'isa-standard' | 'nrs-standard' | 'lov' | 'forskrift' | 'forarbeider' | 'dom' | 'revisjonshandlinger';

export interface KnowledgeCategory {
  id: string;
  name: string;
  description?: string;
  parent_category_id?: string;
  display_order: number;
  icon?: string;
  created_at: string;
  updated_at: string;
  children?: KnowledgeCategory[];
  applicable_phases?: string[];
}

export interface ContentTypeEntity {
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
  created_at: string;
  updated_at: string;
}

export interface ArticleSubjectArea {
  id: string;
  article_id: string;
  subject_area_id: string;
  created_at: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  category_id: string;
  content_type_id?: string;
  status: ArticleStatus;
  author_id: string;
  tags?: string[];
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  category?: Partial<KnowledgeCategory>;
  content_type_entity?: Partial<ContentTypeEntity>;
  subject_areas?: SubjectArea[];
  embedding?: any;
  reference_code?: string;
  content_type?: ContentType; // Legacy field for backward compatibility
}

export interface KnowledgeFavorite {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
  article?: KnowledgeArticle;
}

export interface KnowledgeReadingHistory {
  id: string;
  user_id: string;
  article_id: string;
  read_at: string;
  article?: KnowledgeArticle;
}

export interface ArticleMedia {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  alt_text?: string;
  created_at: string;
}
