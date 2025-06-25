# Edge Functions Requiring Service Role

The following edge functions still use `SUPABASE_SERVICE_ROLE_KEY` because they perform privileged operations that cannot run under normal user roles.

- **syncKunngjoring** – runs as a scheduled job to fetch announcements for all clients and insert them into the database. No user context is available so a service role is required.
- **setup-storage** – manages creation of the `client-documents` storage bucket. Storage administration requires service role privileges.

All other functions, including **revy-ai-chat**, create Supabase clients using the caller's JWT via the `Authorization` header. The service role key should only be used for scheduled jobs or admin-restricted endpoints.
