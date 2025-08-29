export type AgentRoleKey =
  | 'moderator'
  | 'optimist'
  | 'devils_advocate'
  | 'lawyer'
  | 'auditor'
  | 'engineer'
  | 'creative'
  | 'user_rep'
  | 'strategist'
  | 'notetaker'
  | `custom_${number}`;

export interface AgentConfig {
  key: AgentRoleKey;
  name: string;
  systemPrompt: string;
  icon?: React.ReactNode;
  model?: string;
  temperature?: number | null;
  dataScopes?: string[];
  dataTopics?: string[];
  allowedSources?: string[];
}

export interface DiscussionSettings {
  rounds: number;
  maxTokensPerTurn: number;
  temperature: number | null;
  autoSummarize: boolean;
  allowBackgroundDocs: boolean;
  moderatorControlsOrder: boolean;
  moderatorKey: AgentRoleKey;
  noteTakerKey: AgentRoleKey;
}

export interface TranscriptMessage {
  id: string;
  role: 'user' | 'assistant';
  agentKey?: AgentRoleKey;
  agentName?: string;
  content: string;
  turnIndex?: number;
  createdAt: string;
  modelUsed?: string;
  fallbackUsed?: boolean;
  sources?: string[];
}