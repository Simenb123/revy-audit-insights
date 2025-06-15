
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ExpandedKnowledgeOverview from '@/components/Knowledge/ExpandedKnowledgeOverview';
import CategoryView from '@/components/Knowledge/CategoryView';
import ArticleView from '@/components/Knowledge/ArticleView';
import ArticleEditor from '@/components/Knowledge/ArticleEditor';
import MyArticles from '@/components/Knowledge/MyArticles';
import MyFavorites from '@/components/Knowledge/MyFavorites';
import SearchResults from '@/components/Knowledge/SearchResults';
import PDFConversionWorkflow from '@/components/Knowledge/PDFConversionWorkflow';
import { KnowledgeCategoryTree } from '@/components/Knowledge/KnowledgeCategoryTree';

const KnowledgeBase = () => {
  return (
    <div className="flex flex-col md:flex-row gap-6 p-6 bg-background min-h-screen">
      <aside className="w-full md:w-1/4 md:max-w-xs flex-shrink-0">
        <KnowledgeCategoryTree />
      </aside>
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route index element={<ExpandedKnowledgeOverview />} />
          <Route path="kategori/:categoryId" element={<CategoryView />} />
          <Route path="artikkel/:slug" element={<ArticleView />} />
          <Route path="ny-artikkel" element={<ArticleEditor />} />
          <Route path="rediger/:articleId" element={<ArticleEditor />} />
          <Route path="mine-artikler" element={<MyArticles />} />
          <Route path="favoritter" element={<MyFavorites />} />
          <Route path="sok" element={<SearchResults />} />
          <Route path="pdf-konvertering" element={<PDFConversionWorkflow />} />
          
          {/* Fallback for any unmatched routes */}
          <Route path="*" element={<Navigate to="/fag" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default KnowledgeBase;
