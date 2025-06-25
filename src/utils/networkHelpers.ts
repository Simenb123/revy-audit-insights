
/**
 * Network helper utilities for handling development environment issues
 */

export const isDevelopment = () => {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' || 
         window.location.hostname.includes('lovable.app');
};

export const isSecureContext = () => {
  return window.isSecureContext || window.location.protocol === 'https:';
};

export const handleNetworkError = (error: any) => {
  console.warn('Network error detected:', error);
  
  if (!isSecureContext() && isDevelopment()) {
    console.warn('Development environment detected with HTTP. Some features may require HTTPS.');
    return {
      isDevelopmentHttpError: true,
      suggestion: 'Try using HTTPS or allow insecure content for development'
    };
  }
  
  return {
    isDevelopmentHttpError: false,
    suggestion: 'Check network connection and try again'
  };
};

export const createSecureUrl = (url: string) => {
  if (isDevelopment() && url.startsWith('http://')) {
    // In development, try to use the secure version if available
    return url.replace('http://', 'https://');
  }
  return url;
};

/**
 * Create an AbortSignal that automatically aborts after the given timeout.
 * Returns the signal and a clear function to cancel the timeout when finished.
 */
export const createTimeoutSignal = (timeoutMs: number = 20000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer)
  };
};
