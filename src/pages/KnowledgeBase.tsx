import React from 'react';
import { Routes, Route } from 'react-router-dom';
import GlobalLayoutContainer from '@/components/Layout/GlobalLayoutContainer';
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
import { LegalKnowledgeManager } from '@/components/Knowledge/LegalKnowledge/LegalKnowledgeManager';

const KnowledgeBase = () => {
  const showAdvanced = import.meta.env.VITE_KNOWLEDGE_ADMIN_ADVANCED === 'true';
  return (
    <GlobalLayoutContainer className="h-full" maxWidth="full">
      <Routes>
        <Route index element={<KnowledgeOverview />} />
        <Route path="kategori/:categoryId" element={<CategoryView />} />
        <Route path="artikkel/:slug" element={<ArticleView />} />
        <Route path="ny" element={<ArticleEditor />} />
        <Route path="ny-artikkel" element={<ArticleEditor />} />
        <Route path="rediger/:articleId" element={<ArticleEditor />} />
        <Route path="mine" element={<MyArticles />} />
        <Route path="favoritter" element={<MyFavorites />} />
        <Route path="sok" element={<SearchResults />} />
        <Route path="upload" element={<PDFUploadManager />} />
        <Route path="admin" element={<KnowledgeAdminPanel showAdvanced={showAdvanced} />} />
        <Route path="juridisk" element={<LegalKnowledgeManager />} />
        <Route path="hemmelig-ai-trening" element={<SecretTrainingArea />} />
      </Routes>
    </GlobalLayoutContainer>
  );
};

export default KnowledgeBase;
