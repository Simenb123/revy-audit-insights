# Database Schema Overview

The Supabase migrations in `supabase/migrations` define tables, enums and policies. Key areas include:

- **Audit Firms & Departments** – tables `audit_firms` and `departments` group users and clients.
- **Clients & Teams** – `clients`, `client_teams` and `team_members` link engagements to departments and users.
- **Communication** – `chat_rooms`, `messages` and `user_presence` provide real-time collaboration.
- **Documents** – `client_documents_files` and related tables store uploaded files and AI metadata.
- **Accounting** – transactions are stored in `general_ledger_transactions`; period balances in `trial_balances`; account definitions in `client_chart_of_accounts`.
- **Audit Actions** – templates and client actions live in `audit_action_templates` and `client_audit_actions`.

Migrations are timestamped SQL scripts applied in order. Each table has row level security enabled with policies to restrict access based on the user's firm, department or team. Triggers update `updated_at` automatically.

There are currently **55** migration files. The early scripts create enum types
like `user_role_type`, `communication_type` and `audit_log_action` as well as
the first tables for audit firms and departments. Later migrations add extra
columns such as the `embedding` vector in `knowledge_articles` for semantic
search and numerous triggers to keep timestamps in sync.
