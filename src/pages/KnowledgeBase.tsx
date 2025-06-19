
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
import KnowledgeAdminPanel from '@/components/Knowledge/KnowledgeAdminPanel';
import SecretTrainingArea from '@/components/Knowledge/SecretTrainingArea';

const KnowledgeBase = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Routes>
        <Route path="/" element={<KnowledgeOverview />} />
        <Route path="/kategori/:categoryId" element={<CategoryView />} />
        <Route path="/artikkel/:slug" element={<ArticleView />} />
        <Route path="/ny" element={<ArticleEditor />} />
        <Route path="/ny-artikkel" element={<ArticleEditor />} />
        <Route path="/rediger/:articleId" element={<ArticleEditor />} />
        <Route path="/mine" element={<MyArticles />} />
        <Route path="/favoritter" element={<MyFavorites />} />
        <Route path="/sok" element={<SearchResults />} />
        <Route path="/upload" element={<PDFUploadManager />} />
        <Route path="/admin" element={<KnowledgeAdminPanel />} />
        <Route path="/hemmelig-ai-trening" element={<SecretTrainingArea />} />
      </Routes>
    </div>
  );
};

export default KnowledgeBase;
