
import { useState, useEffect, useMemo } from 'react';
import { useClientDocuments } from './useClientDocuments';

export interface EnhancedClientDocument {
  id: string;
  file_name: string;
  category?: string;
  ai_confidence_score?: number;
  ai_analysis_summary?: string;
  ai_suggested_subject_areas?: string[];
  ai_isa_standard_references?: string[];
  extracted_text?: string;
  created_at: string;
}

export interface DocumentStats {
  total: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  uncategorized: number;
  byCategory: Record<string, number>;
  qualityScore: number;
}

export const useEnhancedClientDocuments = (clientId: string) => {
  const { documents: rawDocuments, isLoading, refetch } = useClientDocuments(clientId);
  
  const documents = useMemo((): EnhancedClientDocument[] => {
    return (rawDocuments || []).map(doc => ({
      id: doc.id,
      file_name: doc.file_name,
      category: doc.category,
      ai_confidence_score: doc.ai_confidence_score,
      ai_analysis_summary: doc.ai_analysis_summary,
      // These fields might not exist on ClientDocument, so we'll provide fallbacks
      ai_suggested_subject_areas: (doc as any).ai_suggested_subject_areas || [],
      ai_isa_standard_references: (doc as any).ai_isa_standard_references || [],
      extracted_text: doc.extracted_text,
      created_at: doc.created_at
    }));
  }, [rawDocuments]);

  const getCategorizeionStats = (): DocumentStats => {
    const total = documents.length;
    let highConfidence = 0;
    let mediumConfidence = 0;
    let lowConfidence = 0;
    let uncategorized = 0;
    const byCategory: Record<string, number> = {};

    documents.forEach(doc => {
      // Confidence scoring
      const confidence = doc.ai_confidence_score || 0;
      if (confidence >= 0.8) highConfidence++;
      else if (confidence >= 0.6) mediumConfidence++;
      else if (confidence > 0) lowConfidence++;
      
      // Category counting
      const category = doc.category || 'uncategorized';
      if (category === 'uncategorized') uncategorized++;
      byCategory[category] = (byCategory[category] || 0) + 1;
    });

    const qualityScore = total > 0 ? Math.round(((highConfidence + mediumConfidence * 0.7) / total) * 100) : 0;

    return {
      total,
      highConfidence,
      mediumConfidence,
      lowConfidence,
      uncategorized,
      byCategory,
      qualityScore
    };
  };

  const getDocumentsByConfidence = (level: 'high' | 'medium' | 'low' | 'uncategorized') => {
    return documents.filter(doc => {
      const confidence = doc.ai_confidence_score || 0;
      switch (level) {
        case 'high':
          return confidence >= 0.8;
        case 'medium':
          return confidence >= 0.6 && confidence < 0.8;
        case 'low':
          return confidence > 0 && confidence < 0.6;
        case 'uncategorized':
          return !doc.category || doc.category === 'uncategorized';
        default:
          return false;
      }
    });
  };

  const getDocumentContext = () => {
    const stats = getCategorizeionStats();
    const categories = Array.from(new Set(documents.map(d => d.category).filter(Boolean)));
    const subjectAreas = Array.from(new Set(
      documents.flatMap(d => d.ai_suggested_subject_areas || [])
    ));
    const isaStandards = Array.from(new Set(
      documents.flatMap(d => d.ai_isa_standard_references || [])
    ));

    return {
      categories,
      subjectAreas,
      isaStandards,
      riskLevel: stats.qualityScore >= 80 ? 'low' : stats.qualityScore >= 60 ? 'medium' : 'high',
      auditPhase: 'execution', // Could be derived from client data
      documentStats: stats
    };
  };

  return {
    documents,
    isLoading,
    refetch,
    getCategorizeionStats,
    getDocumentsByConfidence,
    getDocumentContext
  };
};
