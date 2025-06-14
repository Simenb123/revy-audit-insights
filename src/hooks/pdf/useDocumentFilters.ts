
import { useState, useMemo } from 'react';
import { PDFDocument } from '@/types/pdf';

export const useDocumentFilters = (documents: PDFDocument[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = doc.title.toLowerCase().includes(searchTermLower) ||
                           doc.description?.toLowerCase().includes(searchTermLower) ||
                           doc.isa_number?.toLowerCase().includes(searchTermLower) ||
                           doc.nrs_number?.toLowerCase().includes(searchTermLower);
      const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
      const matchesFavorites = !favoritesOnly || doc.is_favorite;
      
      return matchesSearch && matchesCategory && matchesFavorites;
    });
  }, [documents, searchTerm, categoryFilter, favoritesOnly]);

  return {
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    favoritesOnly,
    setFavoritesOnly,
    filteredDocuments,
  };
};
