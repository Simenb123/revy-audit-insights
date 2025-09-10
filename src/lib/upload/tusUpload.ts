import { supabase } from '@/integrations/supabase/client';
import * as tus from 'tus-js-client';

export interface TusUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface TusUploadOptions {
  bucket: string;
  path: string;
  contentType?: string;
  onProgress?: (progress: TusUploadProgress) => void;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Real TUS resumable upload for large files
 * Uses tus-js-client against Supabase's resumable upload endpoint
 */
export async function tusUpload(
  file: File, 
  options: TusUploadOptions
): Promise<{ path: string; fullPath: string }> {
  const { bucket, path, contentType, onProgress, onRetry } = options;
  
  console.log('📡 Starting real TUS upload', { 
    fileName: file.name, 
    fileSize: file.size,
    bucket, 
    path 
  });

  // Get authentication session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session for TUS upload');
  }

  // Construct the TUS resumable endpoint
  const supabaseUrl = 'https://fxelhfwaoizqyecikscu.supabase.co';
  const projectId = 'fxelhfwaoizqyecikscu';
  const endpoint = `https://${projectId}.supabase.co/storage/v1/upload/resumable`;

  let retryCount = 0;

  return new Promise<{ path: string; fullPath: string }>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint,
      chunkSize: 6 * 1024 * 1024, // 6MB chunks
      retryDelays: [0, 3000, 5000, 10000, 20000],
      headers: {
        authorization: `Bearer ${session.access_token}`,
        'x-upsert': 'true'
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName: bucket,
        objectName: path,
        contentType: contentType || file.type || 'text/csv',
        cacheControl: '3600'
      },
      onError: (error) => {
        console.error(`❌ TUS upload error (attempt ${retryCount + 1}):`, error);
        if (onRetry) {
          onRetry(++retryCount, error);
        }
        reject(new Error(`TUS upload failed: ${error.message}`));
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = Math.floor((bytesUploaded / bytesTotal) * 100);
        console.log(`📈 TUS progress: ${percentage}% (${bytesUploaded}/${bytesTotal})`);
        
        if (onProgress) {
          onProgress({
            loaded: bytesUploaded,
            total: bytesTotal,
            percentage
          });
        }
      },
      onSuccess: () => {
        console.log('✅ TUS upload completed successfully');
        resolve({
          path,
          fullPath: `${bucket}/${path}`
        });
      }
    });

    // Start the upload, checking for previous uploads first
    upload.findPreviousUploads().then((previousUploads) => {
      if (previousUploads.length > 0) {
        console.log('🔄 Resuming previous TUS upload');
        upload.resumeFromPreviousUpload(previousUploads[0]);
      }
      upload.start();
    }).catch((error) => {
      console.error('❌ Error starting TUS upload:', error);
      reject(error);
    });
  });
}

/**
 * Check if file should use TUS upload (files > 6MB)
 */
export function shouldUseTusUpload(file: File): boolean {
  const TUS_THRESHOLD = 6 * 1024 * 1024; // 6MB
  return file.size > TUS_THRESHOLD;
}