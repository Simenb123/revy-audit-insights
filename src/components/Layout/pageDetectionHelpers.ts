
export const detectPageType = (pathname: string) => {
  // Admin pages
  if (pathname.startsWith('/ai-revy-admin') || 
      pathname.startsWith('/user-admin') || 
      pathname.startsWith('/ai-usage') ||
      pathname.startsWith('/audit-logs')) {
    return 'admin';
  }

  // Knowledge base pages
  if (pathname.startsWith('/fag')) {
    return 'knowledge';
  }

  return 'general';
};

export const extractClientId = (pathname: string): string => {
  const pathSegments = pathname.split('/').filter(Boolean);
  
  // Look for org number pattern (9 digits) or UUID in path
  for (const segment of pathSegments) {
    if (/^\d{9}$/.test(segment) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) {
      return segment;
    }
  }
  
  return '';
};
