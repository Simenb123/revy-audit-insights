
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

// Legacy route mappings for old kategori names to new IDs
const legacyRouteMap: Record<string, string> = {
  'lover': 'lover-og-forskrifter',
  'standarder': 'revisjonsstandarder',
  'regnskap': 'regnskapsstandarder',
  'prosedyrer': 'sjekklister-og-prosedyrer',
  'app': 'app-funksjonalitet',
  'klienter': 'klienthandtering',
  'revisjon': 'revisjonshandlinger',
  'faq': 'faq'
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
        
        {/* Legacy route handlers */}
        <Route 
          path="lover" 
          element={<Navigate to="/fag/kategori/1" replace />} 
        />
        <Route 
          path="standarder" 
          element={<Navigate to="/fag/kategori/2" replace />} 
        />
        <Route 
          path="regnskap" 
          element={<Navigate to="/fag/kategori/3" replace />} 
        />
        <Route 
          path="prosedyrer" 
          element={<Navigate to="/fag/kategori/4" replace />} 
        />
        <Route 
          path="app" 
          element={<Navigate to="/fag/kategori/5" replace />} 
        />
        <Route 
          path="klienter" 
          element={<Navigate to="/fag/kategori/6" replace />} 
        />
        <Route 
          path="revisjon" 
          element={<Navigate to="/fag/kategori/7" replace />} 
        />
        <Route 
          path="faq" 
          element={<Navigate to="/fag/kategori/8" replace />} 
        />
      </Routes>
    </div>
  );
};

export default KnowledgeBase;
