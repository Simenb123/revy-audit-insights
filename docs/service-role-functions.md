# Edge Functions Requiring Service Role

The following edge functions still use `SUPABASE_SERVICE_ROLE_KEY` because they perform privileged operations that cannot run under normal user roles.

- **syncKunngjoring** – runs as a scheduled job to fetch announcements for all clients and insert them into the database. The caller must now supply a valid session token while the function uses the service role key to write data.
- **setup-storage** – manages creation of the `client-documents` storage bucket. Storage administration requires service role privileges.
- **revy-ai-chat** (and supporting modules) – accesses knowledge articles and client documents across organizations. The function verifies the caller's JWT and uses the service role key internally to bypass row level security during chat operations.

All other functions now create Supabase clients using the caller's JWT via the `Authorization` header.

Because `verify_jwt = true` is enabled for these functions, callers **must** include a valid Supabase session token in the `Authorization` header formatted as `Bearer <token>`.
