
export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface KnowledgeCategory {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string;
  displayOrder: number;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  children?: KnowledgeCategory[];
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  slug: string;
  summary?: string;
  content: string;
  categoryId: string;
  status: ArticleStatus;
  authorId: string;
  tags?: string[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  category?: KnowledgeCategory;
}

export interface KnowledgeFavorite {
  id: string;
  userId: string;
  articleId: string;
  createdAt: string;
  article?: KnowledgeArticle;
}

export interface KnowledgeReadingHistory {
  id: string;
  userId: string;
  articleId: string;
  readAt: string;
  article?: KnowledgeArticle;
}
