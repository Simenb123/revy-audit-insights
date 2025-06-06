
import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import KnowledgeOverview from '@/components/Knowledge/KnowledgeOverview';
import CategoryView from '@/components/Knowledge/CategoryView';
import ArticleView from '@/components/Knowledge/ArticleView';
import ArticleEditor from '@/components/Knowledge/ArticleEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book } from 'lucide-react';

const KnowledgeBase = () => {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Book className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Fagområder</h1>
      </div>
      
      <Routes>
        <Route path="/" element={<KnowledgeOverview />} />
        <Route path="/kategori/:categoryId" element={<CategoryView />} />
        <Route path="/artikkel/:slug" element={<ArticleView />} />
        <Route path="/ny-artikkel" element={<ArticleEditor />} />
        <Route path="/rediger/:articleId" element={<ArticleEditor />} />
      </Routes>
    </div>
  );
};

export default KnowledgeBase;
