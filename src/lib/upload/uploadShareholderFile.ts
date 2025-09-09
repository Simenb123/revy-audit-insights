import { createClient } from '@supabase/supabase-js';

type Mapping = Record<string, string>; // { kildeHeader: målKolonne }

export async function uploadAndStartImport(
  file: File,
  opts: { bucket?: string; prefix?: string; mapping: Mapping }
) {
  const supabaseUrl = 'https://fxelhfwaoizqyecikscu.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZWxoZndhb2l6cXllY2lrc2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUxNjM2NzksImV4cCI6MjA2MDczOTY3OX0.h20hURN-5qCAtI8tZaHpEoCnNmfdhIuYJG3tgXyvKqc';
  const supabase = createClient(supabaseUrl, anonKey);

  const bucket = opts.bucket ?? 'imports';
  const key = `${opts.prefix ?? 'shareholders/'}${Date.now()}_${file.name}`;

  const { error: upErr } = await supabase.storage.from(bucket).upload(key, file, {
    upsert: false,
    contentType: file.type || 'text/csv',
  });
  if (upErr) throw upErr;

  const res = await fetch(`${supabaseUrl}/functions/v1/large-dataset-shareholders-import`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ bucket, path: key, mapping: opts.mapping }),
  });

  if (!res.ok) throw new Error(`Start import failed: ${res.status} ${await res.text()}`);
  return { storagePath: `${bucket}/${key}` };
}