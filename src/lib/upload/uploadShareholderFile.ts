import { supabase } from '@/integrations/supabase/client';

type Mapping = Record<string, string>; // { kildeHeader: målKolonne }

export async function uploadAndStartImport(
  file: File,
  opts: { bucket?: string; prefix?: string; mapping: Mapping }
) {
  console.log('🔧 DEBUG: uploadAndStartImport called', { 
    fileName: file.name, 
    fileSize: file.size, 
    options: opts 
  });

  const bucket = opts.bucket ?? 'imports';
  const key = `${opts.prefix ?? 'shareholders/'}${Date.now()}_${file.name}`;

  // 1) Laste opp fil
  console.log('📁 DEBUG: Starting storage upload', { bucket, key });
  const { error: upErr } = await supabase.storage.from(bucket).upload(key, file, {
    upsert: false,
    contentType: file.type || 'text/csv',
  });
  if (upErr) {
    console.error('❌ DEBUG: Storage upload failed', upErr);
    throw upErr;
  }
  console.log('✅ DEBUG: Storage upload successful');

  // 2) Hent brukerens access_token for å identifisere user_id i edge-funksjonen
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token ?? null;

  // 3) Kall edge-funksjon via Supabase client
  console.log('🚀 DEBUG: Calling edge function', { 
    functionName: 'large-dataset-shareholders-import',
    hasToken: !!token,
    payload: { bucket, path: key, mapping: opts.mapping }
  });
  
  const { data, error } = await supabase.functions.invoke('large-dataset-shareholders-import', {
    body: { bucket, path: key, mapping: opts.mapping }
  });
  
  console.log('📡 DEBUG: Edge function response', { 
    data,
    error 
  });

  if (error) {
    throw new Error(`Start import failed: ${error.message}`);
  }

  return { storagePath: `${bucket}/${key}` };
}