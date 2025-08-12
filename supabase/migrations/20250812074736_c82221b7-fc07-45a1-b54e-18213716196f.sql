
-- Create bucket (id and name must match)
insert into storage.buckets (id, name, public)
values ('saft-imports', 'saft-imports', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload to this bucket
create policy "saft-imports insert for authenticated"
on storage.objects for insert
to authenticated
with check (bucket_id = 'saft-imports');

-- Allow authenticated users to read from this bucket
create policy "saft-imports select for authenticated"
on storage.objects for select
to authenticated
using (bucket_id = 'saft-imports');

-- Allow authenticated users to update their own objects in this bucket (optional)
create policy "saft-imports update for authenticated"
on storage.objects for update
to authenticated
using (bucket_id = 'saft-imports')
with check (bucket_id = 'saft-imports');

-- Allow authenticated users to delete their own objects in this bucket (optional)
create policy "saft-imports delete for authenticated"
on storage.objects for delete
to authenticated
using (bucket_id = 'saft-imports');
