
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
import SmartRevyAssistant from '@/components/Revy/SmartRevyAssistant';

const KnowledgeBase = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 bg-background min-h-screen">
      <aside className="lg:col-span-4 xl:col-span-3 flex-shrink-0">
        <KnowledgeCategoryTree />
      </aside>
      <main className="lg:col-span-8 xl:col-span-6 overflow-auto">
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
      <aside className="hidden xl:block xl:col-span-3 flex-shrink-0">
        <div className="sticky top-24 h-[calc(100vh-8rem)]">
          <SmartRevyAssistant embedded />
        </div>
      </aside>
    </div>
  );
};

export default KnowledgeBase;
