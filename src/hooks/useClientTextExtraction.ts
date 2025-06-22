
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface TextExtractionResult {
  text: string;
  method: string;
  aiAnalysis?: string;
}

export const useClientTextExtraction = () => {
  const [isExtracting, setIsExtracting] = useState<Record<string, boolean>>({});

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .filter(item => 'str' in item)
          .map(item => (item as any).str)
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error('Kunne ikke lese PDF-innhold');
    }
  };

  const extractTextFromExcel = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      let fullText = '';

      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const csvData = XLSX.utils.sheet_to_csv(worksheet);
        fullText += `--- ${sheetName} ---\n${csvData}\n\n`;
      });

      return fullText.trim();
    } catch (error) {
      console.error('Excel extraction error:', error);
      throw new Error('Kunne ikke lese Excel-innhold');
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.type === 'application/pdf') {
      return await extractTextFromPDF(file);
    } else if (
      file.type.includes('spreadsheet') || 
      file.type.includes('excel') ||
      file.type === 'text/csv'
    ) {
      return await extractTextFromExcel(file);
    } else if (file.type.startsWith('text/')) {
      return await file.text();
    } else {
      throw new Error('Filtype støttes ikke for tekstekstraksjon');
    }
  };

  const generateAIAnalysis = async (text: string, fileName: string): Promise<string> => {
    try {
      const openaiApiKey = await supabase.rpc('get_secret', { secret_name: 'OPENAI_API_KEY' });
      
      if (!openaiApiKey.data) {
        console.log('OpenAI API key not available, skipping AI analysis');
        return '';
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey.data}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Du er en norsk revisjonsekspert. Analyser dokumentet og gi et kort, presist sammendrag på norsk (max 300 ord) som fokuserer på revisjonsrelevant innhold som: beløp, datoer, transaksjoner, regnskapsposter, kontrakter, eller andre revisjonsrelevante detaljer.'
            },
            {
              role: 'user',
              content: `Analyser dette dokumentet og gi et detaljert sammendrag:\n\nFilnavn: ${fileName}\n\nInnhold:\n${text.substring(0, 4000)}`
            }
          ],
          max_tokens: 400,
          temperature: 0.2
        }),
      });

      if (response.ok) {
        const result = await response.json();
        return result.choices[0]?.message?.content || '';
      } else {
        console.error('OpenAI API error:', response.status);
        return '';
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      return '';
    }
  };

  const extractAndAnalyzeDocument = async (documentId: string): Promise<boolean> => {
    if (isExtracting[documentId]) return false;
    
    setIsExtracting(prev => ({ ...prev, [documentId]: true }));

    try {
      // Get document info
      const { data: document, error: docError } = await supabase
        .from('client_documents_files')
        .select('*')
        .eq('id', documentId)
        .single();

      if (docError || !document) {
        throw new Error('Kunne ikke finne dokument');
      }

      // Update status to processing
      await supabase
        .from('client_documents_files')
        .update({ text_extraction_status: 'processing' })
        .eq('id', documentId);

      // Download file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('client-documents')
        .download(document.file_path);

      if (downloadError || !fileData) {
        throw new Error('Kunne ikke laste ned fil');
      }

      // Extract text
      const extractedText = await extractTextFromFile(fileData);
      let extractionMethod = 'Frontend ekstrasjon';

      if (!extractedText || extractedText.trim().length < 10) {
        throw new Error('Kunne ikke ekstraktere tekst fra filen');
      }

      // Generate AI analysis
      const aiAnalysis = await generateAIAnalysis(extractedText, document.file_name);

      // Update document with results
      const { error: updateError } = await supabase
        .from('client_documents_files')
        .update({
          extracted_text: extractedText,
          text_extraction_status: 'completed',
          ai_analysis_summary: aiAnalysis || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) {
        throw new Error('Kunne ikke lagre resultater');
      }

      toast({
        title: "Tekstekstraksjon fullført!",
        description: `${extractedText.length} tegn ekstraktert fra ${document.file_name}`,
      });

      return true;

    } catch (error) {
      console.error('Text extraction error:', error);
      
      // Update status to failed
      await supabase
        .from('client_documents_files')
        .update({ 
          text_extraction_status: 'failed',
          extracted_text: `[Tekstekstraksjon feilet: ${error.message}]`
        })
        .eq('id', documentId);

      toast({
        title: "Tekstekstraksjon feilet",
        description: error.message,
        variant: "destructive"
      });

      return false;
    } finally {
      setIsExtracting(prev => ({ ...prev, [documentId]: false }));
    }
  };

  return {
    extractAndAnalyzeDocument,
    isExtracting
  };
};
