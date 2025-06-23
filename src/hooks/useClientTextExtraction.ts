
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';

// Set up PDF.js worker with local path to avoid CORS issues
pdfjsLib.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.min.js';

interface TextExtractionResult {
  text: string;
  method: string;
  aiAnalysis?: string;
}

export const useClientTextExtraction = () => {
  const [isExtracting, setIsExtracting] = useState<Record<string, boolean>>({});

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      console.log('🔄 Starting PDF text extraction for:', file.name);
      const arrayBuffer = await file.arrayBuffer();
      
      // Create loading task with better error handling
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0 // Reduce console noise
      });
      
      const pdf = await loadingTask.promise;
      console.log('📄 PDF loaded successfully, pages:', pdf.numPages);
      
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .filter(item => 'str' in item)
            .map(item => (item as any).str)
            .join(' ');
          
          if (pageText.trim()) {
            fullText += pageText + '\n\n';
          }
          
          console.log(`📖 Extracted text from page ${i}: ${pageText.length} characters`);
        } catch (pageError) {
          console.warn(`⚠️ Could not extract text from page ${i}:`, pageError);
          // Continue with other pages
        }
      }

      const cleanText = fullText.trim();
      
      if (cleanText.length < 10) {
        throw new Error('PDF ser ut til å være scannet eller inneholder lite tekst. Prøv backend-prosessering for bedre resultater.');
      }
      
      console.log('✅ PDF text extraction completed:', cleanText.length, 'characters');
      return cleanText;
      
    } catch (error) {
      console.error('❌ PDF extraction error:', error);
      
      // More specific error messages
      if (error.message?.includes('Invalid PDF')) {
        throw new Error('Filen ser ikke ut til å være en gyldig PDF');
      } else if (error.message?.includes('worker')) {
        throw new Error('PDF-prosessering utilgjengelig. Dokumentet vil bli sendt til backend for analyse.');
      } else if (error.message?.includes('scannet')) {
        throw error; // Re-throw our custom message
      } else {
        throw new Error('Kunne ikke lese PDF-innhold. Prøver backend-prosessering...');
      }
    }
  };

  const extractTextFromExcel = async (file: File): Promise<string> => {
    try {
      console.log('📊 Starting Excel text extraction for:', file.name);
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      let fullText = '';

      workbook.SheetNames.forEach(sheetName => {
        const worksheet = workbook.Sheets[sheetName];
        const csvData = XLSX.utils.sheet_to_csv(worksheet);
        if (csvData.trim()) {
          fullText += `--- ${sheetName} ---\n${csvData}\n\n`;
        }
      });

      const cleanText = fullText.trim();
      console.log('✅ Excel extraction completed:', cleanText.length, 'characters');
      return cleanText;
      
    } catch (error) {
      console.error('❌ Excel extraction error:', error);
      throw new Error('Kunne ikke lese Excel-innhold');
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    console.log('🔍 Extracting text from file:', file.name, 'type:', file.type);
    
    if (file.type === 'application/pdf') {
      return await extractTextFromPDF(file);
    } else if (
      file.type.includes('spreadsheet') || 
      file.type.includes('excel') ||
      file.type === 'text/csv'
    ) {
      return await extractTextFromExcel(file);
    } else if (file.type.startsWith('text/')) {
      const text = await file.text();
      console.log('📝 Text file extracted:', text.length, 'characters');
      return text;
    } else {
      throw new Error('Filtype støttes ikke for tekstekstraksjon');
    }
  };

  const fallbackToBackendExtraction = async (documentId: string): Promise<boolean> => {
    try {
      console.log('🔄 Falling back to backend extraction for document:', documentId);
      
      // Update status to indicate backend processing
      await supabase
        .from('client_documents_files')
        .update({ 
          text_extraction_status: 'processing',
          extracted_text: '[Backend prosessering startet...]'
        })
        .eq('id', documentId);

      // Call the enhanced PDF text extractor edge function
      const { error } = await supabase.functions.invoke('enhanced-pdf-text-extractor', {
        body: { documentId }
      });

      if (error) {
        console.error('❌ Backend extraction failed:', error);
        throw new Error(`Backend-prosessering feilet: ${error.message}`);
      }

      console.log('✅ Backend extraction initiated successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Fallback extraction error:', error);
      
      // Update with failed status
      await supabase
        .from('client_documents_files')
        .update({ 
          text_extraction_status: 'failed',
          extracted_text: `[Både frontend og backend ekstrasjon feilet: ${error.message}]`
        })
        .eq('id', documentId);
      
      return false;
    }
  };

  const generateAIAnalysis = async (text: string, fileName: string): Promise<string> => {
    try {
      // For now, we'll use a placeholder since we don't have access to the OpenAI key via RPC
      // In a real implementation, this would be handled via an edge function
      console.log('AI analysis skipped - OpenAI key not available in frontend');
      return '';
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

      console.log('📋 Processing document:', document.file_name, 'type:', document.mime_type);

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

      // Convert Blob to File
      const file = new File([fileData], document.file_name, {
        type: document.mime_type,
        lastModified: Date.now(),
      });

      let extractedText = '';
      let extractionMethod = 'Frontend ekstrasjon';
      let shouldFallbackToBackend = false;

      try {
        // Try frontend extraction first
        extractedText = await extractTextFromFile(file);
        
        if (!extractedText || extractedText.trim().length < 10) {
          console.log('⚠️ Frontend extraction produced minimal text, trying backend...');
          shouldFallbackToBackend = true;
        }
        
      } catch (frontendError) {
        console.log('⚠️ Frontend extraction failed:', frontendError.message);
        
        // For PDFs, try backend extraction
        if (document.mime_type === 'application/pdf') {
          console.log('🔄 PDF frontend failed, switching to backend extraction...');
          shouldFallbackToBackend = true;
        } else {
          // For non-PDFs, fail immediately
          throw frontendError;
        }
      }

      // If we need to fallback to backend (especially for PDFs)
      if (shouldFallbackToBackend && document.mime_type === 'application/pdf') {
        console.log('🔄 Initiating backend fallback for PDF...');
        const success = await fallbackToBackendExtraction(documentId);
        
        if (success) {
          toast({
            title: "Backend-prosessering startet",
            description: `PDF-en "${document.file_name}" sendes til backend for avansert tekstekstraksjon`,
          });
        } else {
          toast({
            title: "Prosessering feilet",
            description: `Kunne ikke prosessere "${document.file_name}"`,
            variant: "destructive"
          });
        }
        
        return success;
      }

      // If we have text from frontend extraction
      if (extractedText && extractedText.trim().length >= 10) {
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
      } else {
        throw new Error('Ingen tekst ekstraktert fra dokument');
      }

    } catch (error) {
      console.error('❌ Text extraction error:', error);
      
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
