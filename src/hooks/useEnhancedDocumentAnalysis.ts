
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  analyzeDocumentWithAI,
  updateDocumentWithAnalysis,
  DocumentAnalysisInput,
  DocumentAnalysisResult
} from '@/services/documentAnalysisService';
import { useAIRevyVariants } from './useAIRevyVariants';

export const useEnhancedDocumentAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<DocumentAnalysisResult[]>([]);
  const { selectedVariant } = useAIRevyVariants('documentation');
  const { toast } = useToast();

  const analyzeDocument = async (input: Omit<DocumentAnalysisInput, 'variant'>) => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeDocumentWithAI({
        ...input,
        variant: selectedVariant
      });
      
      // Update document in database
      await updateDocumentWithAnalysis(result);
      
      // Add to results
      setAnalysisResults(prev => [...prev, result]);
      
      toast({
        title: "Dokumentanalyse fullført",
        description: `${result.aiSuggestedCategory} med ${Math.round(result.aiConfidenceScore * 100)}% sikkerhet`,
      });
      
      return result;
      
    } catch (error) {
      console.error('Document analysis failed:', error);
      toast({
        title: "Analyse feilet",
        description: "Kunne ikke analysere dokumentet",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeBatch = async (inputs: Omit<DocumentAnalysisInput, 'variant'>[]) => {
    setIsAnalyzing(true);
    const results = [];
    
    try {
      for (const input of inputs) {
        const result = await analyzeDocumentWithAI({
          ...input,
          variant: selectedVariant
        });
        
        await updateDocumentWithAnalysis(result);
        results.push(result);
      }
      
      setAnalysisResults(prev => [...prev, ...results]);
      
      toast({
        title: "Batch-analyse fullført",
        description: `${results.length} dokumenter analysert`,
      });
      
      return results;
      
    } catch (error) {
      console.error('Batch analysis failed:', error);
      toast({
        title: "Batch-analyse feilet",
        description: "En eller flere dokumenter kunne ikke analyseres",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearResults = () => {
    setAnalysisResults([]);
  };

  return {
    isAnalyzing,
    analysisResults,
    analyzeDocument,
    analyzeBatch,
    clearResults,
    selectedVariant
  };
};
