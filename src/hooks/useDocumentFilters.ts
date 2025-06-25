import { useState, useMemo } from 'react';

interface BaseDocument {
  file_name: string;
  category?: string | null;
  subject_area?: string | null;
  text_extraction_status?: string | null;
}

interface Options {
  enableSubjectArea?: boolean;
  enableStatus?: boolean;
}

export const useDocumentFilters = <T extends BaseDocument>(
  documents: T[],
  { enableSubjectArea = false, enableStatus = false }: Options = {}
) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subjectAreaFilter, setSubjectAreaFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const categories = useMemo(
    () => [...new Set(documents.map(d => d.category).filter(Boolean))],
    [documents]
  );
  const subjectAreas = useMemo(
    () => [...new Set(documents.map(d => d.subject_area).filter(Boolean))],
    [documents]
  );

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const searchMatch = doc.file_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const categoryMatch =
        categoryFilter === 'all' || doc.category === categoryFilter;
      const subjectMatch =
        !enableSubjectArea ||
        subjectAreaFilter === 'all' ||
        doc.subject_area === subjectAreaFilter;
      const statusMatch =
        !enableStatus ||
        statusFilter === 'all' ||
        doc.text_extraction_status === statusFilter;

      return searchMatch && categoryMatch && subjectMatch && statusMatch;
    });
  }, [
    documents,
    searchTerm,
    categoryFilter,
    subjectAreaFilter,
    statusFilter,
    enableSubjectArea,
    enableStatus,
  ]);

  return {
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    subjectAreaFilter,
    setSubjectAreaFilter,
    statusFilter,
    setStatusFilter,
    categories,
    subjectAreas,
    filteredDocuments,
  };
};
