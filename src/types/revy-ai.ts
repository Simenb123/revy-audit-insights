export interface AIClientData {
  id?: string;
  company_name?: string;
  org_number?: string;
  industry?: string;
  [key: string]: unknown;
}

export interface AIClientDocument {
  id?: string;
  filename?: string;
  file_type?: string;
  status?: string;
  [key: string]: unknown;
}

export interface AIHistoryMessage {
  sender: 'user' | 'assistant' | 'revy';
  content: string;
  id?: string;
  timestamp?: string;
  [key: string]: unknown;
}
