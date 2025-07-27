export interface AIAction {
  id: string;
  type: 'inventory' | 'documents' | 'wine_cellar' | 'guestbook' | 'checklist' | 'custom';
  title: string;
  description?: string;
  icon?: string;
  handler: () => Promise<void> | void;
  data?: any;
}

export interface EnhancedRevyMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  image?: {
    url: string;
    alt?: string;
    analysis?: ImageAnalysis;
  };
  actions?: AIAction[];
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

export interface ImageAnalysis {
  type: 'inventory' | 'document' | 'wine' | 'activity' | 'receipt' | 'other';
  confidence: number;
  description: string;
  suggestedActions: AIAction[];
  extractedText?: string;
  detectedObjects?: Array<{
    label: string;
    confidence: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}

export interface ChatSuggestion {
  type: 'checklist_item' | 'action' | 'follow_up';
  text: string;
  context: string;
  handler?: () => void;
}