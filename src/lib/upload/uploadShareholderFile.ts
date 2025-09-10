import { supabase } from '@/integrations/supabase/client';
import { tusUpload, shouldUseTusUpload, type TusUploadProgress } from './tusUpload';

type Mapping = Record<string, string>; // { kildeHeader: målKolonne }

export interface UploadProgressCallback {
  (progress: TusUploadProgress): void;
}

export async function uploadAndStartImport(
  file: File,
  opts: { 
    bucket?: string; 
    prefix?: string; 
    mapping: Mapping;
    onProgress?: UploadProgressCallback;
  }
) {
  console.log('🔧 DEBUG: uploadAndStartImport called', { 
    fileName: file.name, 
    fileSize: file.size, 
    options: opts 
  });

  const bucket = opts.bucket ?? 'imports';
  const key = `${opts.prefix ?? 'shareholders/'}${Date.now()}_${file.name}`;

  // 1) Laste opp fil - use TUS for large files, standard upload for small files
  console.log('📁 DEBUG: Starting storage upload', { bucket, key, fileSize: file.size });
  
  let uploadPath: string;
  
  if (shouldUseTusUpload(file)) {
    console.log('📡 Using TUS resumable upload for large file');
    try {
      const result = await tusUpload(file, {
        bucket,
        path: key,
        contentType: file.type || 'text/csv',
        onProgress: (progress) => {
          if (opts.onProgress) {
            opts.onProgress(progress);
          }
          console.log(`📊 Upload progress: ${progress.percentage}% (${progress.loaded}/${progress.total} bytes)`);
        },
        onRetry: (attempt, error) => {
          console.log(`🔄 Retry attempt ${attempt}: ${error.message}`);
        }
      });
      uploadPath = result.path;
      console.log('✅ TUS upload successful:', uploadPath);
    } catch (tusError: any) {
      console.error('❌ TUS upload failed:', tusError);
      throw new Error(`Large file upload failed: ${tusError.message}`);
    }
  } else {
    console.log('📤 Using standard upload for small file');
    const { error: upErr } = await supabase.storage.from(bucket).upload(key, file, {
      upsert: false,
      contentType: file.type || 'text/csv',
    });
    if (upErr) {
      console.error('❌ DEBUG: Storage upload failed', upErr);
      throw upErr;
    }
    uploadPath = key;
    console.log('✅ Standard upload successful');
  }

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
    body: { bucket, path: uploadPath, mapping: opts.mapping }
  });
  
  console.log('📡 DEBUG: Edge function response', { 
    data,
    error 
  });

  if (error) {
    throw new Error(`Start import failed: ${error.message}`);
  }

  return { storagePath: `${bucket}/${uploadPath}` };
}