
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
  category?: KnowledgeCategory;
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
