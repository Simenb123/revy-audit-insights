
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

// Updated legacy route mappings to correct database UUIDs
const legacyRouteMap: Record<string, string> = {
  'lover': 'c43b5a1f-8b63-4a6d-9c15-3e7d8f9a2b4c', // Jus
  'jus': 'c43b5a1f-8b63-4a6d-9c15-3e7d8f9a2b4c', // Jus
  'standarder': '4f1f9ada-01f3-48c3-b97c-54b4f02d5808', // Revisjon
  'revisjonsstandarder': '4f1f9ada-01f3-48c3-b97c-54b4f02d5808', // Revisjon
  'regnskap': 'd087be8d-522b-4e3f-9ac2-2a13975cbf42', // Regnskap
  'regnskapsstandarder': 'd087be8d-522b-4e3f-9ac2-2a13975cbf42', // Regnskap
  'prosedyrer': '8a2d5f1c-4e7b-4a9c-8d3f-1b6e9c2a5d8f', // Kvalitetssikring
  'sjekklister': '8a2d5f1c-4e7b-4a9c-8d3f-1b6e9c2a5d8f', // Kvalitetssikring
  'kvalitetssikring': '8a2d5f1c-4e7b-4a9c-8d3f-1b6e9c2a5d8f', // Kvalitetssikring
  'app': '7c9f2e5a-1d4b-4f8c-9a6e-3b7d1f5a8c2e', // App
  'app-funksjonalitet': '7c9f2e5a-1d4b-4f8c-9a6e-3b7d1f5a8c2e', // App
  'klienter': '2b8a5d1f-7e4c-4b9a-8f2d-6c1e9a4b7d5f', // Klienter
  'klienthandtering': '2b8a5d1f-7e4c-4b9a-8f2d-6c1e9a4b7d5f', // Klienter
  'revisjon': '9e3b7a2f-5d8c-4a1b-7f9e-4c6a2d8b5f1c', // Revisjon
  'revisjonshandlinger': '9e3b7a2f-5d8c-4a1b-7f9e-4c6a2d8b5f1c', // Revisjon
  'faq': '1f5a8c2e-9d6b-4e7a-8c3f-5b9d2a7e4f1c' // FAQ
};

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
          
          {/* Legacy route handlers with correct UUIDs */}
          {Object.entries(legacyRouteMap).map(([oldPath, categoryId]) => (
            <Route 
              key={oldPath}
              path={oldPath} 
              element={<Navigate to={`/fag/kategori/${categoryId}`} replace />} 
            />
          ))}
          
          {/* Fallback for any unmatched routes */}
          <Route path="*" element={<Navigate to="/fag" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default KnowledgeBase;
