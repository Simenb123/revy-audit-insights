
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ExpandedKnowledgeOverview from '@/components/Knowledge/ExpandedKnowledgeOverview';
import CategoryView from '@/components/Knowledge/CategoryView';
import ArticleView from '@/components/Knowledge/ArticleView';
import ArticleEditor from '@/components/Knowledge/ArticleEditor';
import MyArticles from '@/components/Knowledge/MyArticles';
import MyFavorites from '@/components/Knowledge/MyFavorites';
import SearchResults from '@/components/Knowledge/SearchResults';
import { Book } from 'lucide-react';

const KnowledgeBase = () => {
  return (
    <div className="space-y-6 p-6">
      <Routes>
        <Route index element={<ExpandedKnowledgeOverview />} />
        <Route path="kategori/:categoryId" element={<CategoryView />} />
        <Route path="artikkel/:slug" element={<ArticleView />} />
        <Route path="ny-artikkel" element={<ArticleEditor />} />
        <Route path="rediger/:articleId" element={<ArticleEditor />} />
        <Route path="mine-artikler" element={<MyArticles />} />
        <Route path="favoritter" element={<MyFavorites />} />
        <Route path="sok" element={<SearchResults />} />
      </Routes>
    </div>
  );
};

export default KnowledgeBase;
