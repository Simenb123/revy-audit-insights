
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';

// Use a CDN that actually works for PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';

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
      
      const loadingTask = pdfjsLib.getDocument({ 
        data: arrayBuffer,
        verbosity: 0,
        isOffscreenCanvasSupported: false // Disable offscreen canvas for better compatibility
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
        throw new Error('PDF ser ut til å være scannet eller inneholder lite tekst. Prøver backend-prosessering...');
      }
      
      console.log('✅ PDF text extraction completed:', cleanText.length, 'characters');
      return cleanText;
      
    } catch (error) {
      console.error('❌ PDF extraction error:', error);
      throw new Error('Frontend PDF-lesing feilet. Sender til backend for avansert prosessering...');
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
      file.type === 'text/csv' ||
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls')
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

  const callBackendExtraction = async (documentId: string): Promise<boolean> => {
    try {
      console.log('🔄 Calling backend extraction for document:', documentId);
      
      // Update status to indicate backend processing
      await supabase
        .from('client_documents_files')
        .update({ 
          text_extraction_status: 'processing',
          extracted_text: '[Backend prosessering startet...]'
        })
        .eq('id', documentId);

      // Call the enhanced PDF text extractor edge function
      const { data, error } = await supabase.functions.invoke('enhanced-pdf-text-extractor', {
        body: { documentId }
      });

      if (error) {
        console.error('❌ Backend extraction failed:', error);
        throw new Error(`Backend-prosessering feilet: ${error.message}`);
      }

      console.log('✅ Backend extraction completed successfully:', data);
      return true;
      
    } catch (error) {
      console.error('❌ Backend extraction error:', error);
      
      // Update with failed status
      await supabase
        .from('client_documents_files')
        .update({ 
          text_extraction_status: 'failed',
          extracted_text: `[Backend ekstrasjon feilet: ${error.message}]`
        })
        .eq('id', documentId);
      
      return false;
    }
  };

  const generateAIAnalysis = async (text: string, fileName: string, documentId: string): Promise<string> => {
    try {
      console.log('🤖 Generating AI analysis for document:', fileName);
      
      // Call our new AI analyzer edge function
      const { data, error } = await supabase.functions.invoke('document-ai-analyzer', {
        body: { 
          documentId,
          text,
          fileName 
        }
      });

      if (error) {
        console.error('AI analysis error:', error);
        return '';
      }

      console.log('✅ AI analysis completed:', data?.analysis?.substring(0, 100) + '...');
      return data?.analysis || '';
      
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

      // Check if document already has error text and needs re-processing
      const hasErrorText = document.extracted_text?.includes('[OpenAI Vision feilet') || 
                          document.extracted_text?.includes('[Kunne ikke') ||
                          document.extracted_text?.includes('Maximum call stack size');

      if (hasErrorText) {
        console.log('🔄 Document has error text, re-processing with improved method...');
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
        
        // For PDFs and other supported files, try backend extraction
        if (document.mime_type === 'application/pdf' || 
            document.mime_type.includes('excel') || 
            document.mime_type.includes('spreadsheet')) {
          console.log('🔄 Switching to backend extraction...');
          shouldFallbackToBackend = true;
        } else {
          // For non-supported files, fail immediately
          throw frontendError;
        }
      }

      // If we need to fallback to backend
      if (shouldFallbackToBackend) {
        console.log('🔄 Initiating backend fallback...');
        const success = await callBackendExtraction(documentId);
        
        if (success) {
          toast({
            title: "Backend-prosessering startet",
            description: `Dokumentet "${document.file_name}" sendes til backend for avansert tekstekstraksjon`,
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
        // Generate AI analysis using our new edge function
        const aiAnalysis = await generateAIAnalysis(extractedText, document.file_name, documentId);

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
