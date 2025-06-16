
export type ArticleStatus = 'draft' | 'published' | 'archived';

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

export interface KnowledgeArticle {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  category_id: string;
  status: ArticleStatus;
  author_id: string;
  tags?: string[];
  view_count: number;
  created_at: string;
  updated_at: string;
  published_at?: string;
  category?: Partial<KnowledgeCategory>;
  embedding?: any;
  reference_code?: string;
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
