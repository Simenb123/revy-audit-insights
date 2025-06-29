# Managing Audit Actions

This guide explains how audit actions are created and used.

## 1. Create action templates

Administrators open **Knowledge → Revisjonshandlinger** in the admin panel. From there they choose **Ny handlingsmal** to define a template. Each template includes:

- Name and description
- Subject area and risk level
- Applicable audit phases (engagement, planning, execution, etc.)

By setting `applicable_phases` the template becomes available when auditors work in those phases.

## 2. Add actions to a client

On a client page choose **Revisjonshandlinger** from the left menu. The page shows tabs for each audit phase. Inside a phase there are two views:

- **Mine handlinger** – actions already assigned to the client.
- **Tilgjengelige maler** – templates that match the current phase.

Auditors can:

- Select templates and copy them to the client.
- Use **Kopier fra annen klient** to duplicate actions from another engagement.
- Click **Ny handling** to add an ad‑hoc action.

## 3. Where actions appear

When the engagement moves through the phases, the client page displays the relevant actions under that phase’s **Mine handlinger** tab. Templates only appear in the **Tilgjengelige maler** tab for the phase selected in `applicable_phases`.
