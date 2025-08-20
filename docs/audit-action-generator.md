# Audit Action Generator

The audit action generator lets Revi propose new audit steps based on your selected subject area. It relies on Supabase to store the action templates and an AI service to produce the initial text.

## Prerequisites

- **Supabase setup** – the application must be configured with `SUPABASE_URL` and `SUPABASE_ANON_KEY`. The Supabase migrations need to be applied so the `audit_action_templates` tables exist.
- **AI service** – a valid `OPENAI_API_KEY` (or another compatible model key) is required. If no key is configured, the generator tools will be disabled in the UI.

## Where to find it

1. Open a client and choose **Revisjonshandlinger**.
2. Navigate to the **AI-verktøy** tab.
3. Use the AI-enabled editor to generate or refine audit actions for that client.

## `getRelevantKnowledge`

The generator can enrich suggestions with related knowledge base articles. The
`getRelevantKnowledge` helper, located in
`src/services/revy/aiInteractionService.ts`, invokes the `knowledge-search`
edge function and returns the article titles from the response. These titles can
then be fed into the AI request so that generated actions are enriched with
relevant context.
