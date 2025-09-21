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

  // 3) Subscribe to real-time progress updates
  console.log('🔄 Setting up real-time progress tracking...');
  
  let totalProcessed = 0;
  let totalRows = 0;
  
  return new Promise((resolve, reject) => {
    const channel = supabase
      .channel('import-progress')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'import_jobs',
          filter: `id=eq.${jobId}`
        },
        (payload) => {
          const jobData = payload.new;
          console.log(`📊 Real-time update: ${jobData.status}, processed: ${jobData.rows_loaded}/${jobData.total_rows}`);
          
          totalProcessed = jobData.rows_loaded || 0;
          totalRows = jobData.total_rows || 0;
          
          // Report progress to callback
          if (opts.onProcessProgress && totalRows > 0) {
            opts.onProcessProgress(totalProcessed, totalRows);
          }
          
          // Check job status
          if (jobData.status === 'completed') {
            console.log('🎉 Import completed!');
            channel.unsubscribe();
            resolve({ 
              storagePath: `${bucket}/${uploadPath}`,
              jobId,
              totalProcessed 
            });
          } else if (jobData.status === 'error' || jobData.status === 'failed') {
            channel.unsubscribe();
            reject(new Error(`Import failed: ${jobData.error || 'Unknown error'}`));
          }
        }
      )
      .subscribe();

    // Initial status check in case the job is already completed
    const checkInitialStatus = async () => {
      const { data: jobData, error: jobError } = await supabase
        .from('import_jobs')
        .select('status, rows_loaded, total_rows, error')
        .eq('id', jobId)
        .single();
      
      if (jobError) {
        channel.unsubscribe();
        reject(new Error(`Failed to check job status: ${jobError.message}`));
        return;
      }
      
      if (!jobData) {
        channel.unsubscribe();
        reject(new Error('Job not found'));
        return;
      }
      
      totalProcessed = jobData.rows_loaded || 0;
      totalRows = jobData.total_rows || 0;
      
      if (opts.onProcessProgress && totalRows > 0) {
        opts.onProcessProgress(totalProcessed, totalRows);
      }
      
      if (jobData.status === 'completed') {
        console.log('🎉 Import already completed!');
        channel.unsubscribe();
        resolve({ 
          storagePath: `${bucket}/${uploadPath}`,
          jobId,
          totalProcessed 
        });
      } else if (jobData.status === 'error' || jobData.status === 'failed') {
        channel.unsubscribe();
        reject(new Error(`Import failed: ${jobData.error || 'Unknown error'}`));
      }
    };

     checkInitialStatus();
   });
 }
