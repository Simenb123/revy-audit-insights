# Upload Column Mappings

This table stores how CSV columns were mapped during a general ledger upload.

## Table Structure

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID, PK | Unique identifier |
| `client_id` | UUID, FK `clients(id)` | Client the mapping belongs to |
| `upload_batch_id` | UUID, FK `upload_batches(id)` | Upload batch this mapping was used for |
| `column_mappings` | JSONB | JSON object describing mapping of file columns to standard fields |
| `created_at` | timestamp with time zone | Time the mapping was saved |

An index on `client_id` allows fast lookup of a client's most recent mapping.

## Pre‑filling in the Upload UI

When a user uploads a CSV for a client, the UI fetches the last saved mapping:

```ts
const { data, error } = await supabase
  .from('upload_column_mappings')
  .select('column_mappings')
  .eq('client_id', clientId)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

If a mapping exists it is passed as `initialMapping` to the column mapping dialog. This pre-populates the fields so the user only needs to confirm or adjust them.

## Limitations

- Mappings are stored per client. The first upload for each client requires manual mapping.
- Only the latest mapping is reused. If a client sends files in different formats, the pre-filled mapping may not match.


