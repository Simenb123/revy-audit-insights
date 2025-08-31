import { logger } from '@/utils/logger';
import { supabase } from '@/integrations/supabase/client';

export interface LegalDocumentUpload {
  title: string;
  content: string;
  document_number?: string;
  summary?: string;
  document_type_id?: string;
  is_active: boolean;
}

export interface LegalProvisionUpload {
  title: string;
  content: string;
  provision_number: string;
  law_identifier: string;
  provision_type: string;
  parent_provision_id?: string;
  is_active: boolean;
}

export const uploadLegalDocuments = async (documents: LegalDocumentUpload[]) => {
  try {
    logger.log('Starting legal documents upload', { count: documents.length });

    const { data, error } = await supabase
      .from('legal_documents')
      .insert(documents)
      .select();

    if (error) {
      logger.error('Error uploading legal documents:', error);
      throw error;
    }

    logger.log('Legal documents uploaded successfully', { count: data?.length });
    return data;
  } catch (error) {
    logger.error('Legal documents upload failed:', error);
    throw error;
  }
};

export const uploadLegalProvisions = async (provisions: LegalProvisionUpload[]) => {
  try {
    logger.log('Starting legal provisions upload', { count: provisions.length });

    const { data, error } = await supabase
      .from('legal_provisions')
      .insert(provisions)
      .select();

    if (error) {
      logger.error('Error uploading legal provisions:', error);
      throw error;
    }

    logger.log('Legal provisions uploaded successfully', { count: data?.length });
    return data;
  } catch (error) {
    logger.error('Legal provisions upload failed:', error);
    throw error;
  }
};

export const batchUploadFromExcel = async (
  excelData: any[],
  type: 'documents' | 'provisions'
) => {
  try {
    logger.log('Starting batch upload from Excel', { type, count: excelData.length });

    if (type === 'documents') {
      const documents: LegalDocumentUpload[] = excelData.map(row => ({
        title: row.title || row.navn || '',
        content: row.content || row.innhold || '',
        document_number: row.document_number || row.dokumentnummer || '',
        summary: row.summary || row.sammendrag || '',
        is_active: true
      }));
      
      return await uploadLegalDocuments(documents);
    } else {
      const provisions: LegalProvisionUpload[] = excelData.map(row => ({
        title: row.title || row.navn || '',
        content: row.content || row.innhold || '',
        provision_number: row.provision_number || row.paragraf || '',
        law_identifier: row.law_identifier || row.lov || '',
        provision_type: row.provision_type || row.type || 'paragraph',
        is_active: true
      }));
      
      return await uploadLegalProvisions(provisions);
    }
  } catch (error) {
    logger.error('Batch upload from Excel failed:', error);
    throw error;
  }
};

export const getLegalDocumentTypes = async () => {
  try {
    const { data, error } = await supabase
      .from('legal_document_types')
      .select('*')
      .eq('is_active', true)
      .order('hierarchy_level');

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Error fetching legal document types:', error);
    throw error;
  }
};