# Database Tables Reference

> **Note:** Dette dokumentet gir en komplett oversikt over alle databasetabeller i Revio. For ERD og arkitektur, se [Database README](./README.md).

## Table of Contents

1. [Audit Firm & User Management](#audit-firm--user-management)
2. [Client Management](#client-management)
3. [Accounting Data](#accounting-data)
4. [SAFT Import](#saft-import)
5. [Audit Actions & Planning](#audit-actions--planning)
6. [Documents & AI](#documents--ai)
7. [Communication](#communication)
8. [AI & Analysis](#ai--analysis)
9. [Account Mappings](#account-mappings)
10. [Legal & Knowledge Base](#legal--knowledge-base)
11. [Shareholders](#shareholders)
12. [System & Admin](#system--admin)

---

## Audit Firm & User Management

### `audit_firms`

Revisjonsfirmaer - topp-nivå tenant i multi-tenant arkitektur.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, default gen_random_uuid() | Unique firm ID |
| `name` | text | NOT NULL | Firmanavn |
| `org_number` | text | UNIQUE | Organisasjonsnummer |
| `claimed_by` | uuid | FK → profiles.id | Admin som "claimet" firmaet |
| `claimed_at` | timestamptz | | Tidspunkt for claim |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view their own firm
- Super admins can view all firms

**Indexes:**
- `idx_audit_firms_org_number` on `org_number`

---

### `profiles`

Brukerprofiler - utvider `auth.users` med applikasjonsspesifikk data.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, FK → auth.users.id | Matches auth.users |
| `email` | text | | Email (synced from auth) |
| `first_name` | text | | Fornavn |
| `last_name` | text | | Etternavn |
| `audit_firm_id` | uuid | FK → audit_firms.id | Tilhørende firma |
| `user_role` | user_role_type | DEFAULT 'employee' | Rolle (admin, partner, manager, employee) |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view their own profile
- Users can view profiles in their firm
- Users can update their own profile

**Triggers:**
- `link_profile_to_firm_employee()` - Auto-link til firm_employees ved signup

---

### `firm_employees`

Pre-registrerte ansatte i firma (kan linkes til profiles når de logger inn).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `audit_firm_id` | uuid | NOT NULL, FK → audit_firms.id | |
| `department_id` | uuid | FK → departments.id | |
| `profile_id` | uuid | FK → profiles.id | Linked profile (nullable) |
| `email` | text | | Email for pre-registrering |
| `first_name` | text | | |
| `last_name` | text | | |
| `role` | user_role_type | DEFAULT 'employee' | |
| `status` | text | DEFAULT 'pre_registered' | pre_registered, active, inactive |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Firm members can view employees in their firm
- Admins can manage employees

**Triggers:**
- `link_firm_employee_to_profile()` - Auto-link når profile opprettes

---

### `departments`

Avdelinger innenfor et revisjonsfirma.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `audit_firm_id` | uuid | NOT NULL, FK → audit_firms.id | |
| `name` | text | NOT NULL | Avdelingsnavn |
| `description` | text | | |
| `partner_id` | uuid | FK → profiles.id | Ansvarlig partner |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view departments in their firm

---

### `firm_access_requests`

Forespørsler om tilgang til firma (for nye brukere).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `audit_firm_id` | uuid | NOT NULL, FK → audit_firms.id | |
| `requester_profile_id` | uuid | NOT NULL, FK → profiles.id | |
| `email` | text | | |
| `role_requested` | user_role_type | DEFAULT 'employee' | |
| `message` | text | | Begrunnelse |
| `status` | text | DEFAULT 'pending' | pending, approved, rejected, cancelled |
| `decided_by` | uuid | FK → profiles.id | |
| `decided_at` | timestamptz | | |
| `created_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view their own requests
- Firm admins can view requests for their firm

---

## Client Management

### `clients`

Klienter (foretak som revideres).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `user_id` | uuid | FK → profiles.id | Hovedansvarlig (deprecated, bruk teams) |
| `department_id` | uuid | FK → departments.id | |
| `name` | text | NOT NULL | Klientnavn |
| `company_name` | text | | Selskapsnavn |
| `org_number` | text | UNIQUE | Organisasjonsnummer |
| `client_group` | text | | Gruppering (f.eks. "Holding") |
| `address` | text | | |
| `postal_code` | text | | |
| `city` | text | | |
| `country` | text | DEFAULT 'Norway' | |
| `phone` | text | | |
| `email` | text | | |
| `website` | text | | |
| `industry` | text | | Bransje/næring |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view clients in their firm/department
- Team members can view their assigned clients

**Indexes:**
- `idx_clients_org_number` on `org_number`
- `idx_clients_department_id` on `department_id`

---

### `client_annual_data`

Årlige data per klient (regnskapsår, revisjonsbudsjett osv).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `fiscal_year` | integer | NOT NULL | Regnskapsår (f.eks. 2024) |
| `fiscal_year_start` | date | | Start dato |
| `fiscal_year_end` | date | | Slutt dato |
| `audit_budget_hours` | numeric | | Budsjetterte timer |
| `materiality_amount` | numeric | | Vesentlighetsgrense |
| `materiality_percentage` | numeric | | Vesentlighet i % |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage annual data for their clients

**Unique Constraint:**
- `(client_id, fiscal_year)` - Kun én rad per klient per år

---

### `client_teams`

Teams som er tildelt en klient.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `team_name` | text | NOT NULL | |
| `description` | text | | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view teams for their clients

---

### `team_members`

Medlemmer i et client team.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `team_id` | uuid | NOT NULL, FK → client_teams.id | |
| `profile_id` | uuid | NOT NULL, FK → profiles.id | |
| `role_in_team` | text | | F.eks. "Engagement Partner", "Senior" |
| `allocated_hours` | numeric | | Tildelte timer |
| `created_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view team members for their clients

---

### `client_roles`

Custom roller per klient (f.eks. "Daglig leder", "Styreleder").

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `role_type` | text | NOT NULL | F.eks. "board_chair", "ceo" |
| `person_name` | text | | |
| `contact_info` | jsonb | | Email, tlf osv. |
| `notes` | text | | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage roles for their clients

---

## Accounting Data

### `accounting_data_versions`

Versjoner av regnskapsdata (for å støtte flere datasett per klient).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `version_number` | integer | NOT NULL | Versjonsnummer (auto-increment per klient) |
| `file_name` | text | NOT NULL | Opprinnelig filnavn |
| `is_active` | boolean | DEFAULT false | Aktiv versjon? |
| `uploaded_by` | uuid | FK → profiles.id | |
| `uploaded_at` | timestamptz | DEFAULT now() | |
| `upload_batch_id` | uuid | | Batch ID for import |
| `total_transactions` | integer | DEFAULT 0 | |
| `total_debit_amount` | numeric | DEFAULT 0 | |
| `total_credit_amount` | numeric | DEFAULT 0 | |
| `balance_difference` | numeric | DEFAULT 0 | |
| `metadata` | jsonb | DEFAULT '{}' | Ekstra info fra import |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage versions for their clients

**Indexes:**
- `idx_versions_client_active` on `(client_id, is_active)`

---

### `client_chart_of_accounts`

Kontoplan per klient.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `account_number` | text | NOT NULL | Kontonummer (f.eks. "1000") |
| `account_name` | text | NOT NULL | Kontonavn |
| `account_type` | text | | Asset, Liability, Equity, Revenue, Expense |
| `parent_account_id` | uuid | FK → client_chart_of_accounts.id | Hierarki |
| `is_active` | boolean | DEFAULT true | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage chart of accounts for their clients

**Unique Constraint:**
- `(client_id, account_number)` - Unikt kontonummer per klient

**Indexes:**
- `idx_coa_client_account` on `(client_id, account_number)`

---

### `general_ledger_transactions`

Hovedboktransaksjoner.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `version_id` | uuid | NOT NULL, FK → accounting_data_versions.id | |
| `client_account_id` | uuid | FK → client_chart_of_accounts.id | |
| `transaction_date` | date | NOT NULL | |
| `voucher_number` | text | | Bilagsnummer |
| `description` | text | | |
| `debit_amount` | numeric | | |
| `credit_amount` | numeric | | |
| `balance_amount` | numeric | | Løpende saldo |
| `customer_id` | text | | For AR/AP tracking |
| `customer_name` | text | | |
| `supplier_id` | text | | |
| `supplier_name` | text | | |
| `reference` | text | | Ekstern referanse |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage transactions for their clients

**Indexes:**
- `idx_transactions_client_version` on `(client_id, version_id)`
- `idx_transactions_date` on `transaction_date DESC`
- `idx_transactions_account` on `client_account_id`

---

### `trial_balances`

Saldobalanse per konto per periode.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `client_account_id` | uuid | FK → client_chart_of_accounts.id | |
| `period_year` | integer | NOT NULL | |
| `period_month` | integer | | Null = årsbalanse |
| `opening_balance` | numeric | DEFAULT 0 | |
| `debit_amount` | numeric | DEFAULT 0 | |
| `credit_amount` | numeric | DEFAULT 0 | |
| `closing_balance` | numeric | DEFAULT 0 | |
| `version` | text | | Version string (kan matche version_id) |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage trial balances for their clients

**Indexes:**
- `idx_trial_balances_client_year` on `(client_id, period_year)`
- `idx_trial_balances_version` on `version`

---

### `ar_customer_balances`

Aggregerte kundesaldoer (Accounts Receivable).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `client_id` | uuid | NOT NULL | Composite PK |
| `version_id` | uuid | NOT NULL | Composite PK |
| `customer_id` | text | NOT NULL | Composite PK |
| `customer_name` | text | | |
| `saldo` | numeric | DEFAULT 0 | |
| `tx_count` | integer | DEFAULT 0 | Antall transaksjoner |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage AR balances for their clients

**Primary Key:** `(client_id, version_id, customer_id)`

---

### `ap_supplier_balances`

Aggregerte leverandørsaldoer (Accounts Payable).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `client_id` | uuid | NOT NULL | Composite PK |
| `version_id` | uuid | NOT NULL | Composite PK |
| `supplier_id` | text | NOT NULL | Composite PK |
| `supplier_name` | text | | |
| `saldo` | numeric | DEFAULT 0 | |
| `tx_count` | integer | DEFAULT 0 | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage AP balances for their clients

**Primary Key:** `(client_id, version_id, supplier_id)`

---

## SAFT Import

### `saft_import_sessions`

Import-sesjoner for SAF-T filer.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `file_name` | text | NOT NULL | |
| `file_size` | integer | | Bytes |
| `saft_version` | text | NOT NULL | F.eks. "Norwegian 1.30" |
| `import_status` | text | DEFAULT 'pending' | pending, processing, completed, failed |
| `processing_started_at` | timestamptz | | |
| `processing_completed_at` | timestamptz | | |
| `created_by` | uuid | FK → profiles.id | |
| `upload_batch_id` | uuid | | |
| `metadata` | jsonb | DEFAULT '{}' | Header, company info osv. |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage SAFT imports for their clients

---

### `saft_customers`

Kunder fra SAF-T import.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `customer_id` | text | NOT NULL | SAF-T Customer ID |
| `customer_name` | text | | |
| `org_number` | text | | |
| `address` | text | | |
| `postal_code` | text | | |
| `city` | text | | |
| `country` | text | | |
| `created_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view SAFT customers for their clients

---

### `saft_suppliers`

Leverandører fra SAF-T import.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `supplier_id` | text | NOT NULL | SAF-T Supplier ID |
| `supplier_name` | text | | |
| `org_number` | text | | |
| `address` | text | | |
| `postal_code` | text | | |
| `city` | text | | |
| `country` | text | | |
| `created_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view SAFT suppliers for their clients

---

## Audit Actions & Planning

### `audit_action_templates`

Maler for revisjonshandlinger (definert av firma eller system).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `audit_firm_id` | uuid | FK → audit_firms.id | Null = system template |
| `action_group_id` | uuid | FK → action_groups.id | |
| `subject_area` | text | NOT NULL | F.eks. "revenue", "inventory" |
| `action_name` | text | NOT NULL | |
| `description` | text | | |
| `content` | text | | Standard content for action |
| `is_system_template` | boolean | DEFAULT false | |
| `created_by` | uuid | FK → profiles.id | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view templates in their firm and system templates

---

### `action_groups`

Grupper for å organisere revisjonshandlinger.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `audit_firm_id` | uuid | FK → audit_firms.id | Null = system group |
| `subject_area_id` | uuid | | Deprecated |
| `subject_area` | subject_area_type | NOT NULL | Enum value |
| `name` | text | NOT NULL | |
| `description` | text | | |
| `color` | text | DEFAULT '#3B82F6' | Hex color |
| `sort_order` | integer | DEFAULT 0 | |
| `is_system_group` | boolean | DEFAULT false | |
| `created_by` | uuid | FK → profiles.id | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view groups in their firm and system groups

---

### `client_audit_actions`

Instanser av revisjonshandlinger per klient.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `template_id` | uuid | FK → audit_action_templates.id | |
| `fiscal_year` | integer | NOT NULL | |
| `subject_area` | text | | |
| `action_name` | text | NOT NULL | |
| `content` | text | | Rich text content (HTML/Markdown) |
| `status` | text | DEFAULT 'not_started' | not_started, in_progress, completed |
| `assigned_to` | uuid | FK → profiles.id | |
| `due_date` | date | | |
| `completed_at` | timestamptz | | |
| `created_by` | uuid | FK → profiles.id | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage audit actions for their clients

---

### `document_versions`

Versjoner av revisjonshandlinger (for historikk/sporbarhet).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_audit_action_id` | uuid | NOT NULL, FK → client_audit_actions.id | |
| `content` | text | NOT NULL | Snapshot av content |
| `version_name` | text | NOT NULL | F.eks. "v1.0", "Draft" |
| `change_source` | text | NOT NULL | 'user' eller 'ai' |
| `change_description` | text | | Hva endret seg? |
| `created_by_user_id` | uuid | FK → profiles.id | |
| `created_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view versions for their clients' actions

---

### `planning_modules`

Planleggingsmoduler per klient (ISA 300).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `fiscal_year` | integer | NOT NULL | |
| `module_name` | text | NOT NULL | F.eks. "Overordnet strategi" |
| `description` | text | | |
| `sort_order` | integer | DEFAULT 0 | |
| `is_completed` | boolean | DEFAULT false | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage planning modules for their clients

---

### `planning_sections`

Seksjoner innenfor en planleggingsmodul.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `module_id` | uuid | NOT NULL, FK → planning_modules.id | |
| `section_name` | text | NOT NULL | |
| `description` | text | | |
| `sort_order` | integer | DEFAULT 0 | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage planning sections for their clients

---

### `planning_items`

Individuelle planleggingsitems i en seksjon.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `section_id` | uuid | NOT NULL, FK → planning_sections.id | |
| `item_text` | text | NOT NULL | |
| `item_type` | text | DEFAULT 'text' | text, checklist, question |
| `answer` | text | | Brukerens svar |
| `is_completed` | boolean | DEFAULT false | |
| `sort_order` | integer | DEFAULT 0 | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage planning items for their clients

---

## Documents & AI

### `client_documents_files`

Dokumenter lastet opp for en klient.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `file_name` | text | NOT NULL | |
| `file_path` | text | NOT NULL | Sti i storage bucket |
| `file_size` | bigint | | Bytes |
| `mime_type` | text | | F.eks. "application/pdf" |
| `document_category_id` | uuid | FK → document_categories.id | |
| `document_type_id` | uuid | FK → document_types.id | |
| `fiscal_year` | integer | | |
| `uploaded_by` | uuid | FK → profiles.id | |
| `upload_batch_id` | uuid | | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage documents for their clients

**Indexes:**
- `idx_documents_client` on `client_id`
- `idx_documents_category` on `document_category_id`

---

### `document_categories`

Kategorier for dokumenter (f.eks. "Årsregnskap", "Kundefakturaer").

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `subject_area` | text | NOT NULL | F.eks. "revenue", "payroll" |
| `category_name` | text | NOT NULL | |
| `description` | text | | |
| `expected_file_patterns` | text[] | | F.eks. ["*.xlsx", "*regnskap*"] |
| `is_standard` | boolean | DEFAULT false | System-kategori? |
| `created_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Authenticated users can view categories

---

### `document_types`

Dokumenttyper for AI-klassifisering.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `name` | text | NOT NULL | |
| `display_name` | text | NOT NULL | |
| `description` | text | | |
| `color` | text | DEFAULT '#3B82F6' | |
| `icon` | text | | Lucide icon name |
| `is_system_type` | boolean | DEFAULT false | |
| `sort_order` | integer | DEFAULT 0 | |
| `created_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Authenticated users can view document types

---

### `document_ai_metadata`

AI-analyse av dokumenter (OCR, klassifisering, embeddings).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `document_id` | uuid | NOT NULL, FK → client_documents_files.id | |
| `extracted_text` | text | | OCR text |
| `suggested_category` | text | | AI forslag |
| `classification_confidence` | numeric | DEFAULT 0 | 0-1 score |
| `key_entities` | jsonb | DEFAULT '[]' | Named entities (beløp, datoer, osv) |
| `embedding` | vector(1536) | | Vector embedding for semantic search |
| `analyzed_at` | timestamptz | DEFAULT now() | |
| `created_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view AI metadata for their clients' documents

**Indexes:**
- `idx_ai_metadata_embedding` on `embedding` (ivfflat)

---

### `ai_suggested_postings`

AI-foreslåtte posteringer basert på dokumenter.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `document_id` | uuid | NOT NULL, FK → client_documents_files.id | |
| `suggested_entries` | jsonb | NOT NULL | Array of {account, debit, credit, description} |
| `confidence_score` | numeric | DEFAULT 0.8 | |
| `status` | text | DEFAULT 'pending' | pending, approved, rejected |
| `applied_to_journal_entry_id` | uuid | | Hvis godkjent |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage AI postings for their clients

---

## Communication

### `chat_rooms`

Chat-rom per klient.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `room_name` | text | NOT NULL | |
| `room_type` | text | DEFAULT 'client' | client, team, direct |
| `created_by` | uuid | FK → profiles.id | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view chat rooms for their clients

---

### `messages`

Meldinger i chat-rom.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `room_id` | uuid | NOT NULL, FK → chat_rooms.id | |
| `sender_id` | uuid | NOT NULL, FK → profiles.id | |
| `content` | text | NOT NULL | |
| `message_type` | text | DEFAULT 'text' | text, file, system |
| `metadata` | jsonb | DEFAULT '{}' | Fil-info, mentions, osv |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view messages in their accessible chat rooms

**Indexes:**
- `idx_messages_room` on `room_id`
- `idx_messages_created` on `created_at DESC`

---

### `user_presence`

Sanntids tilstedeværelse for brukere.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `user_id` | uuid | NOT NULL, FK → profiles.id | |
| `status` | text | DEFAULT 'offline' | online, away, busy, offline |
| `last_seen` | timestamptz | DEFAULT now() | |
| `current_page` | text | | Hvilken side er brukeren på? |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view presence of users in their firm

---

## AI & Analysis

### `ai_usage_logs`

Logger for AI-bruk (tracking tokens/cost).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `user_id` | uuid | NOT NULL, FK → profiles.id | |
| `client_id` | uuid | FK → clients.id | |
| `model` | text | NOT NULL | F.eks. "gpt-4o" |
| `request_type` | text | DEFAULT 'chat' | chat, embedding, analysis |
| `prompt_tokens` | integer | DEFAULT 0 | |
| `completion_tokens` | integer | DEFAULT 0 | |
| `total_tokens` | integer | DEFAULT 0 | |
| `estimated_cost_usd` | numeric | DEFAULT 0 | |
| `context_type` | text | | F.eks. "audit_action", "document_analysis" |
| `session_id` | text | | For grouping requests |
| `response_time_ms` | integer | | |
| `error_message` | text | | |
| `created_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view own AI usage
- Admins can view all AI usage

**Indexes:**
- `idx_ai_usage_user_date` on `(user_id, created_at DESC)`
- `idx_ai_usage_client` on `client_id`

---

### `ai_cache`

Cache for AI-responser (for å spare tokens).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `request_hash` | text | NOT NULL, UNIQUE | SHA256 av request |
| `response` | jsonb | NOT NULL | Cached response |
| `model` | text | NOT NULL | |
| `user_id` | uuid | FK → profiles.id | |
| `client_id` | uuid | FK → clients.id | |
| `hits` | integer | DEFAULT 1 | Antall ganger brukt |
| `last_hit_at` | timestamptz | DEFAULT now() | |
| `created_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Owner can read/write their cache

**Indexes:**
- `idx_ai_cache_hash` on `request_hash`

---

### `ai_analysis_sessions`

Lengre AI-analyse-sesjoner med progress tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `data_version_id` | uuid | FK → accounting_data_versions.id | |
| `session_type` | text | DEFAULT 'ai_transaction_analysis' | |
| `status` | text | DEFAULT 'pending' | pending, in_progress, completed, failed |
| `progress_percentage` | integer | DEFAULT 0 | |
| `total_steps` | integer | DEFAULT 1 | |
| `current_step` | text | | Beskrivelse av nåværende steg |
| `result_data` | jsonb | | Resultater |
| `analysis_config` | jsonb | DEFAULT '{}' | Konfig for analysen |
| `metadata` | jsonb | DEFAULT '{}' | |
| `error_message` | text | | |
| `started_at` | timestamptz | DEFAULT now() | |
| `completed_at` | timestamptz | | |
| `created_by` | uuid | FK → profiles.id | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage AI sessions for their clients

---

### `ai_conversations`

Multi-agent AI-samtaler.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `user_id` | uuid | NOT NULL, FK → profiles.id | |
| `client_id` | uuid | FK → clients.id | |
| `title` | text | | |
| `idea` | text | NOT NULL | Brukerens initielle idé |
| `agents` | jsonb | DEFAULT '[]' | Array of agent configs |
| `settings` | jsonb | DEFAULT '{}' | |
| `status` | text | DEFAULT 'pending' | pending, active, completed |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage their own conversations

---

### `ai_messages`

Meldinger i AI-samtaler.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `conversation_id` | uuid | NOT NULL, FK → ai_conversations.id | |
| `role` | text | NOT NULL | user, assistant, system |
| `content` | text | NOT NULL | |
| `agent_key` | text | | Hvilken agent sendte meldingen? |
| `agent_name` | text | | |
| `turn_index` | integer | | Rekkefølge i samtalen |
| `metadata` | jsonb | DEFAULT '{}' | |
| `created_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view messages in their conversations

---

### `analysis_cache`

Cache for tunge regnskapsanalyser.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `dataset_id` | uuid | NOT NULL, FK → accounting_data_versions.id | |
| `cache_key` | text | NOT NULL, UNIQUE | |
| `analysis_type` | text | DEFAULT 'optimized' | |
| `result_data` | jsonb | NOT NULL | |
| `trial_balance_id` | uuid | FK → trial_balances.id | |
| `cached_at` | timestamptz | DEFAULT now() | |
| `expires_at` | timestamptz | DEFAULT now() + 30min | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage analysis cache for their clients

---

## Account Mappings

### `standard_chart_of_accounts`

Standard kontoplan (NS 4102 eller custom).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `standard_account_number` | text | NOT NULL | F.eks. "3000" |
| `account_name` | text | NOT NULL | |
| `account_type` | text | | Asset, Liability, osv |
| `parent_account_id` | uuid | FK → standard_chart_of_accounts.id | |
| `level` | integer | | Hierarkinivå (1-5) |
| `is_active` | boolean | DEFAULT true | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Authenticated users can view standard chart

---

### `account_mappings`

Mapping fra klient-konto til standard-konto.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `client_account_id` | uuid | NOT NULL, FK → client_chart_of_accounts.id | |
| `standard_account_id` | uuid | NOT NULL, FK → standard_chart_of_accounts.id | |
| `mapping_confidence` | numeric | DEFAULT 1.0 | 0-1 confidence score |
| `is_manual_mapping` | boolean | DEFAULT false | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage mappings for their clients

**Unique Constraint:**
- `(client_id, client_account_id)` - Én mapping per klient-konto

---

### `account_mapping_rules`

Regler for automatisk mapping (range-basert).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `rule_name` | text | NOT NULL | |
| `standard_account_id` | uuid | NOT NULL, FK → standard_chart_of_accounts.id | |
| `account_range_start` | integer | NOT NULL | F.eks. 3000 |
| `account_range_end` | integer | NOT NULL | F.eks. 3999 |
| `confidence_score` | numeric | DEFAULT 0.9 | |
| `is_active` | boolean | DEFAULT true | |
| `created_by` | uuid | FK → profiles.id | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Admins can manage mapping rules
- All authenticated users can view rules

---

### `account_mapping_suggestions`

AI-genererte forslag til mappings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `client_id` | uuid | NOT NULL, FK → clients.id | |
| `client_account_id` | uuid | NOT NULL, FK → client_chart_of_accounts.id | |
| `suggested_standard_account_id` | uuid | NOT NULL, FK → standard_chart_of_accounts.id | |
| `rule_id` | uuid | FK → account_mapping_rules.id | |
| `confidence_score` | numeric | DEFAULT 0 | |
| `status` | text | DEFAULT 'pending' | pending, approved, rejected |
| `approved_by` | uuid | FK → profiles.id | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage suggestions for their clients

---

## Legal & Knowledge Base

### `legal_documents`

Juridiske dokumenter (lover, forskrifter) med embeddings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `document_type_id` | uuid | FK → legal_document_types.id | |
| `title` | text | NOT NULL | |
| `document_number` | text | NOT NULL, UNIQUE | F.eks. "LOV-1998-07-17-56" |
| `content` | text | | Full tekst |
| `summary` | text | | Kort oppsummering |
| `created_date` | date | | Når ble loven vedtatt? |
| `last_updated` | date | | |
| `is_active` | boolean | DEFAULT true | |
| `embedding` | vector(1536) | | For semantic search |
| `search_vector` | tsvector | | For full-text search |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Authenticated users can view legal documents

**Indexes:**
- `idx_legal_docs_embedding` on `embedding` (ivfflat)
- `idx_legal_docs_search` on `search_vector` (GIN)

**Functions:**
- `match_legal_documents(vector, threshold, count)` - Semantic search

---

### `legal_document_types`

Typer juridiske dokumenter (lov, forskrift, rundskriv).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `name` | text | NOT NULL, UNIQUE | F.eks. "lov", "forskrift" |
| `display_name` | text | NOT NULL | |
| `description` | text | | |
| `hierarchy_level` | integer | DEFAULT 1 | 1=lov, 2=forskrift, osv |
| `authority_weight` | numeric | DEFAULT 1.0 | For rangering i søk |
| `created_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Authenticated users can view document types

---

### `knowledge_articles`

Kunnskapsbase-artikler (internt innhold).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `title` | text | NOT NULL | |
| `content` | text | NOT NULL | Rich text |
| `category` | text | | F.eks. "ISA", "Regnskapsloven" |
| `tags` | text[] | DEFAULT '{}' | |
| `status` | text | DEFAULT 'draft' | draft, published, archived |
| `author_id` | uuid | FK → profiles.id | |
| `embedding` | vector(1536) | | For semantic search |
| `search_vector` | tsvector | | For full-text search |
| `view_count` | integer | DEFAULT 0 | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Authenticated users can view published articles
- Authors can manage their own articles

**Triggers:**
- `auto_generate_embeddings()` - Generate embeddings on publish

---

## Shareholders

### `share_companies`

Aksjeselskaper (fra Brønnøysund).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `orgnr` | text | NOT NULL | Composite PK |
| `year` | integer | NOT NULL | Composite PK |
| `user_id` | uuid | NOT NULL, FK → profiles.id | Composite PK |
| `name` | text | NOT NULL | |
| `total_shares` | integer | DEFAULT 0 | Totalt antall aksjer |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage their own share companies

**Primary Key:** `(orgnr, year, user_id)`

---

### `share_entities`

Aksjeeiere (personer eller selskaper).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `entity_type` | text | NOT NULL | 'person' eller 'company' |
| `name` | text | NOT NULL | |
| `orgnr` | text | | Hvis company |
| `birth_year` | integer | | Hvis person |
| `country_code` | text | | F.eks. "NO", "SE" |
| `user_id` | uuid | NOT NULL, FK → profiles.id | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage their own share entities

**Unique Constraint:**
- `(entity_type, name, orgnr, birth_year, user_id)` - Unike entiteter

---

### `share_holdings`

Aksjeposter - hvem eier hvor mange aksjer.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `company_orgnr` | text | NOT NULL | Composite PK |
| `holder_id` | uuid | NOT NULL, FK → share_entities.id | Composite PK |
| `share_class` | text | NOT NULL | Composite PK (f.eks. "Ordinære") |
| `year` | integer | NOT NULL | Composite PK |
| `user_id` | uuid | NOT NULL, FK → profiles.id | Composite PK |
| `shares` | integer | DEFAULT 0 | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage their own share holdings

**Primary Key:** `(company_orgnr, holder_id, share_class, year, user_id)`

---

### `shareholders_staging`

Staging-tabell for bulk import av aksjonærer.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigserial | PK | |
| `job_id` | bigint | NOT NULL, FK → import_jobs.id | |
| `user_id` | uuid | NOT NULL, FK → profiles.id | |
| `orgnr` | text | NOT NULL | Company org.nr |
| `selskap` | text | | Company name |
| `year` | integer | NOT NULL | |
| `fodselsaar_orgnr` | text | | Birth year or org.nr |
| `navn_aksjonaer` | text | | Shareholder name |
| `antall_aksjer` | integer | | Number of shares |
| `aksjeklasse` | text | | Share class |
| `landkode` | text | | Country code |
| `processed_at` | timestamptz | | |
| `created_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can manage their own staging data

**Functions:**
- `process_shareholders_batch(job_id, user_id, offset, limit)` - Process batch

---

## System & Admin

### `app_super_admins`

Super-administratorer med full tilgang.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | uuid | PK, FK → profiles.id | |
| `note` | text | | Hvorfor er de super admin? |
| `created_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Super admins can read
- Super admins can modify
- Bootstrap first super admin (special INSERT policy)

**Functions:**
- `is_super_admin(uuid)` - Check if user is super admin

---

### `admin_audit_logs`

Audit-log for administrative handlinger.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK | |
| `user_id` | uuid | NOT NULL, FK → profiles.id | Hvem gjorde handlingen? |
| `target_user_id` | uuid | FK → profiles.id | Hvem ble påvirket? |
| `action_type` | text | NOT NULL | F.eks. "role_change", "firm_access_granted" |
| `description` | text | NOT NULL | |
| `old_values` | jsonb | DEFAULT '{}' | |
| `new_values` | jsonb | DEFAULT '{}' | |
| `metadata` | jsonb | DEFAULT '{}' | |
| `created_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Admins can view audit logs
- System can insert audit logs

---

### `import_jobs`

Generell import-jobb tabell (for bulk imports).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | bigserial | PK | |
| `user_id` | uuid | NOT NULL, FK → profiles.id | |
| `job_type` | text | NOT NULL | F.eks. "shareholders", "transactions" |
| `status` | text | DEFAULT 'pending' | pending, processing, completed, failed |
| `total_rows` | integer | DEFAULT 0 | |
| `rows_loaded` | integer | DEFAULT 0 | |
| `rows_failed` | integer | DEFAULT 0 | |
| `error_message` | text | | |
| `started_at` | timestamptz | | |
| `completed_at` | timestamptz | | |
| `created_at` | timestamptz | DEFAULT now() | |
| `updated_at` | timestamptz | DEFAULT now() | |

**RLS Policies:**
- Users can view their own import jobs

---

## Enums & Custom Types

### `user_role_type`

Brukerroller i systemet.

```sql
CREATE TYPE user_role_type AS ENUM (
  'admin',
  'partner',
  'manager',
  'employee'
);
```

### `subject_area_type`

Revisjonsområder.

```sql
CREATE TYPE subject_area_type AS ENUM (
  'revenue',
  'purchases',
  'payroll',
  'inventory',
  'fixed_assets',
  'cash',
  'equity',
  'other'
);
```

---

## Security Functions

### `get_user_firm(uuid)`

Hent brukerens firma-ID (security definer for RLS).

```sql
CREATE FUNCTION get_user_firm(user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT audit_firm_id FROM profiles WHERE id = user_id;
$$;
```

### `get_user_role(uuid)`

Hent brukerens rolle (security definer for RLS).

```sql
CREATE FUNCTION get_user_role(user_id uuid)
RETURNS user_role_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_role FROM profiles WHERE id = user_id;
$$;
```

### `is_super_admin(uuid)`

Sjekk om bruker er super-admin (security definer for RLS).

```sql
CREATE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM app_super_admins WHERE user_id = user_id
  );
$$;
```

---

## See Also

- [Database Architecture](./README.md) - ERD, migration strategy, security
- [Database Overview](../database-overview.md) - Quick reference
- [Service Role Functions](../service-role-functions.md) - Edge functions med elevated privileges
