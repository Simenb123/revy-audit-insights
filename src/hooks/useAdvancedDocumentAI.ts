
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AICategorizationResult {
  suggestedCategory: string;
  subjectArea: string;
  confidence: number;
  reasoning: string;
  extractedKeywords: string[];
  documentType: string;
}

export const useAdvancedDocumentAI = () => {
  const { toast } = useToast();

  const analyzeDocument = useMutation({
    mutationFn: async (data: {
      fileName: string;
      fileContent?: string;
      mimeType: string;
      fileSize: number;
    }): Promise<AICategorizationResult> => {
      console.log('=== STARTING ADVANCED AI ANALYSIS ===');
      console.log('File:', data.fileName, 'Type:', data.mimeType);

      try {
        const { data: result, error } = await supabase.functions.invoke('document-ai-categorizer', {
          body: {
            fileName: data.fileName,
            fileContent: data.fileContent,
            mimeType: data.mimeType,
            fileSize: data.fileSize
          }
        });

        if (error) {
          console.error('AI categorization error:', error);
          // Fallback til filnavn-basert kategorisering
          return analyzeByFilename(data);
        }

        console.log('AI analysis result:', result);
        return result as AICategorizationResult;
      } catch (error) {
        console.error('AI analysis failed:', error);
        return analyzeByFilename(data);
      }
    },
    onError: (error) => {
      console.error('Document analysis error:', error);
      toast({
        title: "AI-analyse feilet",
        description: "Bruker fallback kategorisering basert på filnavn",
        variant: "destructive"
      });
    }
  });

  const analyzeByFilename = (data: { fileName: string; mimeType: string }): AICategorizationResult => {
    const fileName = data.fileName.toLowerCase();
    
    // Utvidede filnavn-mønstre
    const patterns = {
      regnskap: {
        patterns: ['regnskap', 'årsregnskap', 'quarterly', 'kvartal', 'balance', 'resultat', 'årsresultat'],
        category: 'Årsregnskap',
        subjectArea: 'regnskap',
        confidence: 0.8
      },
      revisjon: {
        patterns: ['revisjon', 'audit', 'revisjonsberetning', 'management letter', 'kontroll'],
        category: 'Revisjonsrapport',
        subjectArea: 'revisjon', 
        confidence: 0.75
      },
      skatt: {
        patterns: ['skatt', 'tax', 'mva', 'vat', 'skattemelding', 'selvangivelse'],
        category: 'Skattemelding',
        subjectArea: 'skatt',
        confidence: 0.85
      },
      lønn: {
        patterns: ['lønn', 'lnn', 'payroll', 'salary', 'lønnsslipp', 'a-melding', 'arbeidsgiveravgift'],
        category: 'Lønnsrapport',
        subjectArea: 'lnn',
        confidence: 0.8
      },
      kontrakt: {
        patterns: ['kontrakt', 'contract', 'avtale', 'agreement', 'abonnement'],
        category: 'Kontrakter',
        subjectArea: 'annet',
        confidence: 0.7
      },
      faktura: {
        patterns: ['faktura', 'invoice', 'receipt', 'kvittering', 'bon'],
        category: 'Fakturaer',
        subjectArea: 'regnskap',
        confidence: 0.75
      }
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      if (pattern.patterns.some(p => fileName.includes(p))) {
        return {
          suggestedCategory: pattern.category,
          subjectArea: pattern.subjectArea,
          confidence: pattern.confidence,
          reasoning: `Kategorisert basert på filnavn som inneholder "${pattern.patterns.find(p => fileName.includes(p))}"`,
          extractedKeywords: [key],
          documentType: data.mimeType
        };
      }
    }

    return {
      suggestedCategory: 'Diverse',
      subjectArea: 'annet',
      confidence: 0.3,
      reasoning: 'Kunne ikke kategorisere basert på filnavn',
      extractedKeywords: [],
      documentType: data.mimeType
    };
  };

  return {
    analyzeDocument,
    isAnalyzing: analyzeDocument.isPending
  };
};
