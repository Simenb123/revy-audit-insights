export interface Client {
  id: string;
  name: string;
  company_name?: string;
  org_number?: string;
  industry?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  phase?: 'engagement' | 'planning' | 'execution' | 'completion' | 'reporting';
  tags?: string[];
  is_test_data?: boolean;
}

export interface RevyMessage {
  sender: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  metadata?: {
    context?: string;
    variant?: string;
    tokens?: number;
  };
}
