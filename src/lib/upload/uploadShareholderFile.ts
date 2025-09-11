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
    onProcessProgress?: (processed: number, total: number) => void;
  }
) {
  console.log('🔧 DEBUG: uploadAndStartImport called', { 
    fileName: file.name, 
    fileSize: file.size, 
    options: opts 
  });

  const bucket = opts.bucket ?? 'imports';
  const key = `${opts.prefix ?? 'shareholders/'}${Date.now()}_${file.name}`;

  // 1) Upload file - use TUS for large files, standard upload for small files
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

  // 2) Initialize import job
  console.log('🚀 DEBUG: Initializing import job');
  
  const { data: initData, error: initError } = await supabase.functions.invoke('large-dataset-shareholders-import', {
    body: { 
      action: 'init',
      bucket, 
      path: uploadPath, 
      mapping: opts.mapping 
    }
  });
  
  if (initError) {
    throw new Error(`Initialize import failed: ${initError.message}`);
  }

  const jobId = initData?.jobId;
  if (!jobId) {
    throw new Error('No job ID returned from init');
  }

  console.log('✅ Import job created:', jobId);

  // 3) Process file in chunks
  let offset = 0;
  const limit = 100000; // Process 100k rows per chunk
  let totalProcessed = 0;
  
  console.log('🔄 Starting chunked processing...');
  
  while (true) {
    console.log(`📊 Processing chunk: offset=${offset}, limit=${limit}`);
    
    const { data: processData, error: processError } = await supabase.functions.invoke('large-dataset-shareholders-import', {
      body: { 
        action: 'process',
        bucket, 
        path: uploadPath, 
        mapping: opts.mapping,
        jobId,
        offset,
        limit
      }
    });
    
    if (processError) {
      throw new Error(`Process chunk failed: ${processError.message}`);
    }
    
    totalProcessed = processData?.totalProcessed || 0;
    const processedInChunk = processData?.processedInChunk || 0;
    
    console.log(`✅ Chunk processed: ${processedInChunk} rows, total: ${totalProcessed}`);
    
    // Report progress
    if (opts.onProcessProgress) {
      opts.onProcessProgress(totalProcessed, totalProcessed + (processData?.done ? 0 : limit));
    }
    
    // Check if done
    if (processData?.done) {
      console.log('🎉 Import completed!');
      break;
    }
    
    // Move to next chunk
    offset = processData?.nextOffset || (offset + processedInChunk);
    
    // Small delay between chunks to prevent overwhelming the system
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { 
    storagePath: `${bucket}/${uploadPath}`,
    jobId,
    totalProcessed 
  };
}