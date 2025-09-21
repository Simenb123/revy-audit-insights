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

  // Check initial authentication session
  const { data: { session: initialSession } } = await supabase.auth.getSession();
  if (!initialSession) {
    throw new Error('No active session for TUS upload');
  }

  // Check if token expires soon and refresh proactively
  const tokenExpiresAt = initialSession.expires_at ? initialSession.expires_at * 1000 : 0;
  const now = Date.now();
  const timeUntilExpiry = tokenExpiresAt - now;
  
  if (timeUntilExpiry < 5 * 60 * 1000) { // Less than 5 minutes
    console.log('🔄 Token expires soon, refreshing proactively');
    await supabase.auth.refreshSession();
  }

  // Construct the TUS resumable endpoint dynamically
  const SUPABASE_URL = 'https://fxelhfwaoizqyecikscu.supabase.co';
  const projectRef = new URL(SUPABASE_URL).hostname.split('.')[0];
  const endpoint = `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;

  let retryCount = 0;
  let authRetryCount = 0;

  return new Promise<{ path: string; fullPath: string }>((resolve, reject) => {
    // Function to get fresh token for each request
    const getFreshToken = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('No valid session available');
        }
        return session.access_token;
      } catch (error) {
        console.error('❌ Failed to get fresh token:', error);
        throw error;
      }
    };

    const upload = new tus.Upload(file, {
      endpoint,
      chunkSize: 6 * 1024 * 1024, // 6MB chunks
      retryDelays: [0, 1000, 3000, 5000, 10000, 20000], // Increased retry attempts
      // Remove static authorization header - use beforeRequest instead
      headers: {
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
      // Dynamic token renewal for each request  
      onBeforeRequest: async (req: any) => {
        try {
          const token = await getFreshToken();
          req.setHeader('Authorization', `Bearer ${token}`);
          console.log('🔄 Updated authorization header for TUS request');
        } catch (error) {
          console.error('❌ Failed to set authorization header:', error);
          throw error;
        }
      },
      onError: async (error) => {
        console.error(`❌ TUS upload error (attempt ${retryCount + 1}):`, error);
        
        // Handle authentication errors specifically
        if (error.message.includes('Unauthorized') || 
            error.message.includes('AccessDenied') ||
            error.message.includes('exp') ||
            error.message.includes('403') ||
            error.message.includes('401')) {
          
          authRetryCount++;
          console.log(`🔐 Authentication error detected (${authRetryCount}/3), attempting token refresh...`);
          
          if (authRetryCount <= 3) {
            try {
              // Force token refresh
              await supabase.auth.refreshSession();
              console.log('✅ Token refreshed successfully, retrying upload');
              // Let TUS handle the retry with fresh token via beforeRequest
              return;
            } catch (refreshError) {
              console.error('❌ Failed to refresh token:', refreshError);
            }
          }
        }
        
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