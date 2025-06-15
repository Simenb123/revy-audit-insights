
export interface PDFDocument {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  title: string;
  description?: string;
  category: string;
  isa_number?: string;
  nrs_number?: string;
  tags?: string[];
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
  extracted_text?: { page: number; content: string }[] | { error: string };
  text_extraction_status?: 'pending' | 'processing' | 'completed' | 'failed' | null;
}
