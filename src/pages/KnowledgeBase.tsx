
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ExpandedKnowledgeOverview from '@/components/Knowledge/ExpandedKnowledgeOverview';
import CategoryView from '@/components/Knowledge/CategoryView';
import ArticleView from '@/components/Knowledge/ArticleView';
import ArticleEditor from '@/components/Knowledge/ArticleEditor';
import MyArticles from '@/components/Knowledge/MyArticles';
import MyFavorites from '@/components/Knowledge/MyFavorites';
import SearchResults from '@/components/Knowledge/SearchResults';
import PDFConversionWorkflow from '@/components/Knowledge/PDFConversionWorkflow';

// Legacy route mappings for old kategori names to new UUIDs from database
const legacyRouteMap: Record<string, string> = {
  'lover': 'c43b5a1f-8b63-4a6d-9c15-3e7d8f9a2b4c', // Jus
  'standarder': '4f1f9ada-01f3-48c3-b97c-54b4f02d5808', // Revisjon
  'revisjonsstandarder': '4f1f9ada-01f3-48c3-b97c-54b4f02d5808', // Revisjon
  'regnskap': 'd087be8d-522b-4e3f-9ac2-2a13975cbf42', // Regnskap
  'regnskapsstandarder': 'd087be8d-522b-4e3f-9ac2-2a13975cbf42', // Regnskap
  'prosedyrer': '8a2d5f1c-4e7b-4a9c-8d3f-1b6e9c2a5d8f', // Kvalitetssikring
  'sjekklister-og-prosedyrer': '8a2d5f1c-4e7b-4a9c-8d3f-1b6e9c2a5d8f', // Kvalitetssikring
  'app': '7c9f2e5a-1d4b-4f8c-9a6e-3b7d1f5a8c2e', // App
  'app-funksjonalitet': '7c9f2e5a-1d4b-4f8c-9a6e-3b7d1f5a8c2e', // App
  'klienter': '2b8a5d1f-7e4c-4b9a-8f2d-6c1e9a4b7d5f', // Klienter
  'klienthandtering': '2b8a5d1f-7e4c-4b9a-8f2d-6c1e9a4b7d5f', // Klienter
  'revisjon': '9e3b7a2f-5d8c-4a1b-7f9e-4c6a2d8b5f1c', // Revisjon
  'revisjonshandlinger': '9e3b7a2f-5d8c-4a1b-7f9e-4c6a2d8b5f1c', // Revisjon
  'faq': '1f5a8c2e-9d6b-4e7a-8c3f-5b9d2a7e4f1c' // FAQ
};

const KnowledgeBase = () => {
  const location = useLocation();
  
  // Handle legacy routes by redirecting to proper category IDs
  const handleLegacyRoute = (path: string) => {
    const segments = path.split('/');
    const lastSegment = segments[segments.length - 1];
    
    if (legacyRouteMap[lastSegment]) {
      return `/fag/kategori/${legacyRouteMap[lastSegment]}`;
    }
    
    return null;
  };

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
        <Route path="pdf-konvertering" element={<PDFConversionWorkflow />} />
        
        {/* Legacy route handlers with correct UUIDs */}
        <Route 
          path="lover" 
          element={<Navigate to="/fag/kategori/c43b5a1f-8b63-4a6d-9c15-3e7d8f9a2b4c" replace />} 
        />
        <Route 
          path="standarder" 
          element={<Navigate to="/fag/kategori/4f1f9ada-01f3-48c3-b97c-54b4f02d5808" replace />} 
        />
        <Route 
          path="revisjonsstandarder" 
          element={<Navigate to="/fag/kategori/4f1f9ada-01f3-48c3-b97c-54b4f02d5808" replace />} 
        />
        <Route 
          path="regnskap" 
          element={<Navigate to="/fag/kategori/d087be8d-522b-4e3f-9ac2-2a13975cbf42" replace />} 
        />
        <Route 
          path="regnskapsstandarder" 
          element={<Navigate to="/fag/kategori/d087be8d-522b-4e3f-9ac2-2a13975cbf42" replace />} 
        />
        <Route 
          path="prosedyrer" 
          element={<Navigate to="/fag/kategori/8a2d5f1c-4e7b-4a9c-8d3f-1b6e9c2a5d8f" replace />} 
        />
        <Route 
          path="sjekklister-og-prosedyrer" 
          element={<Navigate to="/fag/kategori/8a2d5f1c-4e7b-4a9c-8d3f-1b6e9c2a5d8f" replace />} 
        />
        <Route 
          path="app" 
          element={<Navigate to="/fag/kategori/7c9f2e5a-1d4b-4f8c-9a6e-3b7d1f5a8c2e" replace />} 
        />
        <Route 
          path="app-funksjonalitet" 
          element={<Navigate to="/fag/kategori/7c9f2e5a-1d4b-4f8c-9a6e-3b7d1f5a8c2e" replace />} 
        />
        <Route 
          path="klienter" 
          element={<Navigate to="/fag/kategori/2b8a5d1f-7e4c-4b9a-8f2d-6c1e9a4b7d5f" replace />} 
        />
        <Route 
          path="klienthandtering" 
          element={<Navigate to="/fag/kategori/2b8a5d1f-7e4c-4b9a-8f2d-6c1e9a4b7d5f" replace />} 
        />
        <Route 
          path="revisjon" 
          element={<Navigate to="/fag/kategori/9e3b7a2f-5d8c-4a1b-7f9e-4c6a2d8b5f1c" replace />} 
        />
        <Route 
          path="revisjonshandlinger" 
          element={<Navigate to="/fag/kategori/9e3b7a2f-5d8c-4a1b-7f9e-4c6a2d8b5f1c" replace />} 
        />
        <Route 
          path="faq" 
          element={<Navigate to="/fag/kategori/1f5a8c2e-9d6b-4e7a-8c3f-5b9d2a7e4f1c" replace />} 
        />
        
        {/* Fallback for any unmatched routes */}
        <Route path="*" element={<Navigate to="/fag" replace />} />
      </Routes>
    </div>
  );
};

export default KnowledgeBase;
