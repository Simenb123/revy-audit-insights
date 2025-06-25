# Service Role Usage Audit

This document tracks which edge functions require the `SUPABASE_SERVICE_ROLE_KEY` and which now run using user JWTs.

## Updated to Use User JWT

The following functions create Supabase clients with the caller's `Authorization` header and the anon key:

- `document-ai-analyzer`
- `document-ai-categorizer`
- `enhanced-pdf-text-extractor`
- `pdf-text-extractor`
- `generate-embeddings`
- `pdf-converter`

These operations update user-owned rows where RLS policies allow the authenticated user to perform the action.

## Still Using Service Role

Some functions still depend on the service role key:

- `revy-ai-chat` and its helper modules – shared client relies on unrestricted access for complex knowledge lookups and caching.
- `syncKunngjoring` – processes announcements for all clients and must bypass RLS.
- `setup-storage` – administrative bucket creation.

These require elevated privileges until dedicated roles or further refactoring are implemented.
