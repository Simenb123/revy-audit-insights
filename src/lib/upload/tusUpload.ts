import { supabase } from '@/integrations/supabase/client';

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

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

/**
 * TUS-based resumable upload for large files
 * Uses Supabase's createSignedUploadUrl and uploadToSignedUrl for files > 6MB
 */
export async function tusUpload(
  file: File, 
  options: TusUploadOptions
): Promise<{ path: string; fullPath: string }> {
  const { bucket, path, contentType, onProgress, onRetry } = options;
  
  console.log('📡 Starting TUS upload', { 
    fileName: file.name, 
    fileSize: file.size,
    bucket, 
    path 
  });

  // Step 1: Create signed upload URL
  const { data: urlData, error: urlError } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (urlError) {
    console.error('❌ Failed to create signed upload URL:', urlError);
    throw new Error(`Failed to create upload URL: ${urlError.message}`);
  }

  console.log('✅ Created signed upload URL:', urlData);

  // Step 2: Upload using TUS protocol with retries
  let attempt = 0;
  let lastError: Error;

  while (attempt <= MAX_RETRIES) {
    try {
      console.log(`🔄 TUS upload attempt ${attempt + 1}/${MAX_RETRIES + 1}`);
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(urlData.path, urlData.token, file, {
          contentType: contentType || file.type
        });

      // Manual progress simulation since onUploadProgress isn't available
      if (onProgress) {
        onProgress({
          loaded: file.size,
          total: file.size,
          percentage: 100
        });
      }

      if (!uploadError) {
        console.log('✅ TUS upload completed successfully');
        return {
          path: urlData.path,
          fullPath: `${bucket}/${urlData.path}`
        };
      }

      lastError = new Error(uploadError.message);
      console.error(`❌ Upload attempt ${attempt + 1} failed:`, uploadError);

    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Upload attempt ${attempt + 1} error:`, error);
    }

    attempt++;

    // If not the last attempt, wait before retrying
    if (attempt <= MAX_RETRIES) {
      const delay = RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(`⏳ Retrying in ${delay}ms...`);
      
      if (onRetry) {
        onRetry(attempt, lastError);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // All attempts failed
  console.error('💀 TUS upload failed after all retries');
  throw new Error(`Upload failed after ${MAX_RETRIES + 1} attempts: ${lastError.message}`);
}

/**
 * Check if file should use TUS upload (files > 6MB)
 */
export function shouldUseTusUpload(file: File): boolean {
  const TUS_THRESHOLD = 6 * 1024 * 1024; // 6MB
  return file.size > TUS_THRESHOLD;
}