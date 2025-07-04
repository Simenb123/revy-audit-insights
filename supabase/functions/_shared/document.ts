import type { SupabaseClient } from '../deps.ts';

export async function fetchDocumentMetadata(
  supabase: SupabaseClient,
  documentId: string
) {
  return supabase
    .from('client_documents_files')
    .select('file_path, file_name, mime_type')
    .eq('id', documentId)
    .single();
}

export async function updateExtractionStatus(
  supabase: SupabaseClient,
  documentId: string,
  status: string,
  extractedText?: string
) {
  const update: Record<string, unknown> = {
    text_extraction_status: status,
    updated_at: new Date().toISOString(),
  };
  if (extractedText !== undefined) {
    update.extracted_text = extractedText;
  }
  return supabase
    .from('client_documents_files')
    .update(update)
    .eq('id', documentId);
}
