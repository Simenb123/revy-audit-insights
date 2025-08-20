# Audit Phases

AI Revi divides the audit workflow into seven phases. These phases are stored as the `audit_phase` enum in the database and used throughout the application.

## The seven phases

- **overview** – generic tasks and information that apply across the engagement.
- **engagement** – client acceptance and establishing the engagement terms.
- **planning** – designing the audit strategy and identifying focus areas.
- **risk_assessment** – assessing inherent and control risks before fieldwork.
- **execution** – performing substantive and control tests.
- **completion** – wrapping up work programmes and evaluations.
- **reporting** – issuing the auditor’s report and communicating results.

## How phases are referenced

The `audit_action_templates` table includes an `applicable_phases` array. Each template can be linked to one or more phases. When a template is copied to a client, the resulting record in `client_audit_actions` stores a single `phase` value.

Administrators manage templates under **Knowledge → Revisjonshandlinger** in the admin panel. By setting `applicable_phases` they control which actions appear when auditors fetch actions for a client. Only templates matching the client’s current phase are shown for selection.

