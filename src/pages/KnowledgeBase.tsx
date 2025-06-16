
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import KnowledgeOverview from '@/components/Knowledge/KnowledgeOverview';
import CategoryView from '@/components/Knowledge/CategoryView';
import ArticleView from '@/components/Knowledge/ArticleView';
import ArticleEditor from '@/components/Knowledge/ArticleEditor';
import MyArticles from '@/components/Knowledge/MyArticles';
import MyFavorites from '@/components/Knowledge/MyFavorites';
import SearchResults from '@/components/Knowledge/SearchResults';
import PDFUploadManager from '@/components/Knowledge/PDFUploadManager';
import TestDataCreator from '@/components/Knowledge/TestDataCreator';

const KnowledgeBase = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Test Data Creator - midlertidig for testing */}
      <div className="flex justify-center">
        <TestDataCreator />
      </div>
      
      <Routes>
        <Route path="/" element={<KnowledgeOverview />} />
        <Route path="/kategori/:categoryId" element={<CategoryView />} />
        <Route path="/artikkel/:slug" element={<ArticleView />} />
        <Route path="/ny" element={<ArticleEditor />} />
        <Route path="/rediger/:articleId" element={<ArticleEditor />} />
        <Route path="/mine" element={<MyArticles />} />
        <Route path="/favoritter" element={<MyFavorites />} />
        <Route path="/sok" element={<SearchResults />} />
        <Route path="/upload" element={<PDFUploadManager />} />
      </Routes>
    </div>
  );
};

export default KnowledgeBase;
