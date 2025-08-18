import type { AuditPhase } from './revio';

// Enhanced Client interface with all fields from database
export interface ExtendedClient {
  id: string;
  name: string;
  company_name: string;
  org_number: string;
  phase: AuditPhase;
  progress: number;
  engagement_type: 'revisjon' | 'regnskap' | 'annet';
  industry?: string;
  registration_date?: string;
  department_id?: string;
  client_group?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  chair?: string;
  ceo?: string;
  address_line1?: string;
  address_line2?: string;
  postal_code?: string;
  city?: string;
  country?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  
  // Custom fields will be loaded separately
  custom_fields?: ClientCustomFieldValue[];
  shareholders?: ClientShareholder[];
}

// Custom field system types
export interface ClientCustomField {
  id: string;
  field_name: string;
  field_label: string;
  field_type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
  field_options: string[]; // For select options
  is_required: boolean;
  display_order: number;
  is_active: boolean;
  audit_firm_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  validation_rules: Record<string, any>;
  help_text?: string;
}

export interface ClientCustomFieldValue {
  id: string;
  client_id: string;
  custom_field_id: string;
  field_value?: string;
  created_at: string;
  updated_at: string;
  
  // Populated from joins
  custom_field?: ClientCustomField;
}

// Shareholder types
export interface ClientShareholder {
  id: string;
  client_id: string;
  shareholder_name: string;
  shareholder_org_number?: string;
  shareholder_type: 'person' | 'company' | 'trust' | 'other';
  ownership_percentage?: number;
  number_of_shares?: number;
  share_class: string;
  voting_rights_percentage?: number;
  registered_date?: string;
  is_active: boolean;
  address_line1?: string;
  address_line2?: string;
  postal_code?: string;
  city?: string;
  country: string;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
  last_brreg_sync_at?: string;
  brreg_data: Record<string, any>;
}

// Filter and view configuration types
export interface ClientFilter {
  id: string;
  filter_name: string;
  filter_config: ClientFilterConfig;
  is_default: boolean;
  is_public: boolean;
  created_by?: string;
  audit_firm_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ClientFilterConfig {
  fields: ClientFilterField[];
  logic: 'AND' | 'OR';
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export interface ClientFilterField {
  field: string; // field name
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
  value: any;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
}

export interface ClientViewConfiguration {
  id: string;
  user_id: string;
  view_name: string;
  visible_columns: string[];
  column_order: string[];
  column_widths: Record<string, number>;
  sort_config: {
    field: string;
    direction: 'asc' | 'desc';
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Form and validation types
export interface ClientFormData extends Omit<ExtendedClient, 'id' | 'created_at' | 'updated_at'> {
  custom_field_values?: Record<string, string>;
}

export interface ClientValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'range' | 'custom';
}

// Search and pagination types
export interface ClientSearchParams {
  search?: string;
  filters?: ClientFilterField[];
  sort_by?: string;
  sort_direction?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  include_custom_fields?: boolean;
  include_shareholders?: boolean;
}

export interface ClientSearchResult {
  clients: ExtendedClient[];
  total_count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Column configuration for flexible display
export interface ClientColumnConfig {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select' | 'custom';
  sortable: boolean;
  filterable: boolean;
  width?: number;
  visible: boolean;
  order: number;
  format?: (value: any) => string;
  custom_field_id?: string; // For custom fields
}

// Predefined column configurations
export const DEFAULT_CLIENT_COLUMNS: ClientColumnConfig[] = [
  {
    key: 'company_name',
    label: 'Firmanavn',
    type: 'string',
    sortable: true,
    filterable: true,
    visible: true,
    order: 1,
  },
  {
    key: 'org_number',
    label: 'Org.nummer',
    type: 'string',
    sortable: true,
    filterable: true,
    visible: true,
    order: 2,
  },
  {
    key: 'engagement_type',
    label: 'Oppdragstype',
    type: 'select',
    sortable: true,
    filterable: true,
    visible: true,
    order: 3,
  },
  {
    key: 'phase',
    label: 'Fase',
    type: 'select',
    sortable: true,
    filterable: true,
    visible: true,
    order: 4,
  },
  {
    key: 'progress',
    label: 'Fremdrift (%)',
    type: 'number',
    sortable: true,
    filterable: true,
    visible: true,
    order: 5,
  },
  {
    key: 'industry',
    label: 'Bransje',
    type: 'string',
    sortable: true,
    filterable: true,
    visible: false,
    order: 6,
  },
  {
    key: 'contact_person',
    label: 'Kontaktperson',
    type: 'string',
    sortable: true,
    filterable: true,
    visible: false,
    order: 7,
  },
  {
    key: 'created_at',
    label: 'Opprettet',
    type: 'date',
    sortable: true,
    filterable: true,
    visible: false,
    order: 8,
  },
];