/**
 * Types for working paper data stored in client_audit_actions
 * Replaces `any` types with proper interfaces
 */

export interface WorkingPaperResponseData {
  [fieldId: string]: string | number | boolean | string[] | null;
}

export interface WorkingPaperData {
  /** Response data from response fields in the template */
  response_data?: WorkingPaperResponseData;
  /** Free-form notes added by the user */
  notes?: string;
  /** Linked document IDs */
  linked_documents?: string[];
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

export interface AutoMetrics {
  /** When the action was first viewed */
  first_viewed_at?: string;
  /** Total time spent on the action in seconds */
  time_spent_seconds?: number;
  /** Number of times the action was edited */
  edit_count?: number;
  /** Last activity timestamp */
  last_activity_at?: string;
}
