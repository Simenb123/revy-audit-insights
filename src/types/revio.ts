
export interface RevyMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  links?: Array<{
    type: 'navigation' | 'action' | 'external' | 'knowledge';
    text: string;
    path?: string;
    url?: string;
    action?: () => void;
    icon?: React.ReactNode;
    variant?: 'default' | 'secondary' | 'outline';
  }>;
  sources?: Array<{
    title: string;
    type: 'isa' | 'regulation' | 'knowledge' | 'client';
    reference?: string;
    url?: string;
  }>;
}

export type RevyContext = 
  | 'dashboard'
  | 'client-overview'
  | 'client-detail'
  | 'audit-actions'
  | 'risk-assessment'
  | 'documentation'
  | 'collaboration'
  | 'communication'
  | 'team-management'
  | 'drill-down'
  | 'mapping'
  | 'general'
  | 'accounting-data'
  | 'analysis'
  | 'data-upload'
  | 'knowledge-base'
  | 'knowledge'
  | 'fag';

export interface RevyChatMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'revy';
  content: string;
  metadata?: any;
  created_at: string;
}

export interface ProactiveAction {
  type: 'action' | 'navigation' | 'knowledge';
  text: string;
  path?: string;
  action?: () => void;
  variant?: 'default' | 'secondary' | 'outline';
}
