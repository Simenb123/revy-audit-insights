
export type ArticleStatus = 'draft' | 'published' | 'archived';

import type { AuditPhase } from './revio';

export interface KnowledgeCategory {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  parent_category_id?: string;
  display_order: number;
  icon?: string;
  created_at: string;
  updated_at: string;
  children?: KnowledgeCategory[];
  applicable_phases?: AuditPhase[];
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
  parent_subject_area_id?: string;
  created_at: string;
  updated_at: string;
  children?: SubjectArea[];
  parent?: SubjectArea;
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

export interface ArticleSubjectArea {
  id: string;
  article_id: string;
  subject_area_id: string;
  created_at: string;
}

export interface ArticleTag {
  id: string;
  article_id: string;
  tag_id: string;
  created_at: string;
}

export interface AuditActionSubjectArea {
  id: string;
  action_template_id: string;
  subject_area_id: string;
  created_at: string;
}

export interface AuditActionTag {
  id: string;
  action_template_id: string;
  tag_id: string;
  created_at: string;
}

export interface DocumentTypeSubjectArea {
  id: string;
  document_type_id: string;
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
  content_type_id: string;
  status: ArticleStatus;
  author_id: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  category?: Partial<KnowledgeCategory>;
  content_type_entity?: Partial<ContentTypeEntity>;
  subject_areas?: SubjectArea[];
  article_tags?: Tag[];
  embedding?: any;
  reference_code?: string;
  valid_from?: string;
  valid_until?: string;
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

// Export ContentType for external usage
export type ContentType = ContentTypeEntity;
