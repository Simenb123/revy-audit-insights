export interface Client {
  id: string;
  name: string;
  companyName: string;
  orgNumber: string;
  industry: string;
  createdAt: string;
  updatedAt: string;
  phase: string;
  progress: number;
  riskAreas: string[];
}

export interface RevyMessage {
  id: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'revy';
  enhanced?: {
    content: string;
    links: Array<{
      type: 'navigation' | 'action' | 'external' | 'knowledge';
      text: string;
      path?: string;
      url?: string;
      action?: () => void;
      icon?: React.ReactNode;
      variant?: 'default' | 'secondary' | 'outline';
    }>;
    sources: Array<{
      title: string;
      type: 'isa' | 'regulation' | 'knowledge' | 'client';
      reference?: string;
      url?: string;
    }>;
  };
}
